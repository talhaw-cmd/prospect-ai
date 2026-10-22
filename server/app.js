import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

function getOsmTags(tags = {}) {
  return [
    tags.name,
    tags.amenity,
    tags.shop,
    tags.office,
    tags.healthcare,
    tags.tourism,
    tags.craft,
    tags.industry,
    tags.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesNiche(tags, niche, keywords = '') {
  const text = getOsmTags(tags);
  const terms = `${niche} ${keywords}`
    .toLowerCase()
    .split(/[,;\s]+/)
    .filter((word) => word.length > 2);

  // Prefer meaningful matches over returning unrelated businesses.
  const aliases = {
    dentist: ['dentist', 'dental', 'orthodont'],
    restaurant: ['restaurant', 'fast_food', 'food'],
    cafe: ['cafe', 'coffee'],
    hotel: ['hotel', 'hostel', 'guest_house'],
    gym: ['fitness', 'gym', 'sports'],
    salon: ['hairdresser', 'beauty', 'salon'],
    realestate: ['estate_agent', 'real_estate', 'property'],
    lawyer: ['lawyer', 'legal'],
    pharmacy: ['pharmacy', 'chemist'],
  };

  const normalized = niche.toLowerCase().replace(/[^a-z]/g, '');
  const matchedAlias = Object.entries(aliases).find(([key]) =>
    normalized.includes(key)
  );

  if (matchedAlias) {
    return matchedAlias[1].some((term) => text.includes(term));
  }

  return terms.some((term) => text.includes(term));
}

function mapOsmLead(element, userId) {
  const tags = element.tags || {};
  const addressParts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:postcode'],
    tags['addr:country'],
  ].filter(Boolean);

  const website =
    tags.website ||
    tags['contact:website'] ||
    tags.url ||
    '';

  const email = tags.email || tags['contact:email'] || '';

  return {
    user_id: userId,
    company_name: tags.name || 'Unnamed business',
    website,
    industry: tags.amenity || tags.shop || tags.office ||
      tags.healthcare || tags.tourism || tags.craft || '',
    location: addressParts.join(', '),
    contact_name: '',
    contact_email: email,
    notes: `OpenStreetMap record: ${element.type}/${element.id}`,
    status: 'new',
    score: 0,
    score_reasons: ['Discovered from OpenStreetMap; verify details manually.'],
    source: 'openstreetmap',
  };
}

const app = express(); app.disable('x-powered-by'); app.use(helmet());

app.use(cors({
  origin: (origin, cb) => {
    const allowedOrigins = (
      process.env.CLIENT_URL ||
      'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'
    )
      .split(',')
      .map((s) => s.trim());

    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }

    console.log('Blocked CORS origin:', origin);
    return cb(new Error('Origin not allowed'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));

app.use(express.json({ limit: '100kb' }));
function client() { const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY; if (!url || !key) throw new Error('Server Supabase environment is not configured.'); return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); }
async function auth(req, res, next) { try { const h = req.headers.authorization || '', token = h.startsWith('Bearer ') ? h.slice(7) : ''; if (!token) return res.status(401).json({ error: 'Sign in to continue.' }); const supabase = await client();
const { data, error } = await supabase.auth.getUser(token); if (error || !data.user) return res.status(401).json({ error: 'Session is invalid or expired.' }); req.user = data.user; next(); } catch (e) { next(e); } }
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'prospect-ai-api', version: '1.0.0' }));

const discoverySearchSchema = z.object({
  niche: z.string().trim().min(1).max(120),
  country: z.string().trim().max(100).optional().default(''),
  city: z.string().trim().max(100).optional().default(''),
  keywords: z.string().trim().max(500).optional().default(''),
  requested_limit: z.number().int().min(1).max(50).optional().default(50),
});


app.post('/api/discovery/search', auth, async (req, res, next) => {
  try {
    const parsed = discoverySearchSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Enter a valid niche and search criteria.',
      });
    }

    const { niche, country, city, keywords, requested_limit } = parsed.data;

    // A city-level search helps avoid excessively large country-wide queries.
    if (!city.trim()) {
      return res.status(400).json({
        error: 'Enter a city as well as a country for a more reliable search.',
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return res.status(500).json({
        error: 'Supabase environment is not configured.',
      });
    }

    const userSupabase = createClient(supabaseUrl, anonKey, {
      global: {
        headers: { Authorization: req.headers.authorization },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Record the search under the authenticated user's RLS policies.
    const { data: search, error: searchError } = await userSupabase
      .from('lead_searches')
      .insert({
        user_id: req.user.id,
        ...parsed.data,
        status: 'pending',
      })
      .select(
        'id, niche, country, city, keywords, requested_limit, status, created_at'
      )
      .single();

    if (searchError) {
      console.error('Search creation failed:', searchError.message);
      return res.status(500).json({
        error: 'Could not create the lead search.',
      });
    }

    // Geocode the city with OpenStreetMap's public Nominatim service.
    const placeQuery = [city, country].filter(Boolean).join(', ');
    const geocodeUrl = new URL('https://nominatim.openstreetmap.org/search');
    geocodeUrl.searchParams.set('q', placeQuery);
    geocodeUrl.searchParams.set('format', 'jsonv2');
    geocodeUrl.searchParams.set('limit', '1');

    const geoResponse = await fetch(geocodeUrl, {
      headers: {
        'User-Agent': 'ProspectAI/1.0 (business research tool)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!geoResponse.ok) {
      throw new Error('Location lookup service is unavailable.');
    }

    const places = await geoResponse.json();

    if (!places.length || !places[0].boundingbox) {
      return res.status(404).json({
        search,
        error: 'Could not find that city. Check the city and country names.',
        discovery_status: 'no_location',
      });
    }

    const [south, north, west, east] = places[0].boundingbox.map(Number);

    // Overpass expects south, west, north, east.
    const query = `
      [out:json][timeout:25];
      (
        node["name"](${south},${west},${north},${east});
        way["name"](${south},${west},${north},${east});
        relation["name"](${south},${west},${north},${east});
      );
      out center tags ${Math.min(requested_limit * 20, 1000)};
    `;

    const osmResponse = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'User-Agent': 'ProspectAI/1.0',
      },
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(35000),
    });

    if (!osmResponse.ok) {
      throw new Error(
        'OpenStreetMap discovery is temporarily busy. Please try again shortly.'
      );
    }

    const osmData = await osmResponse.json();

    const matched = (osmData.elements || [])
      .filter((item) => item.tags?.name)
      .filter((item) => matchesNiche(item.tags, niche, keywords))
      .slice(0, requested_limit);

    const candidates = matched.map((item) =>
      mapOsmLead(item, req.user.id)
    );

    let inserted = [];
    let skippedDuplicates = 0;

    if (candidates.length) {
      // Avoid re-inserting an existing OSM record for this user.
      const osmIds = matched.map((item) => `${item.type}/${item.id}`);
      const notesToCheck = osmIds.map(
        (osmId) => `OpenStreetMap record: ${osmId}`
      );

      const { data: existing, error: existingError } = await userSupabase
        .from('leads')
        .select('notes')
        .eq('user_id', req.user.id)
        .in('notes', notesToCheck);

      if (existingError) {
        throw new Error('Could not check existing leads for duplicates.');
      }

      const existingNotes = new Set((existing || []).map((row) => row.notes));
      const newRows = candidates.filter(
        (lead) => !existingNotes.has(lead.notes)
      );

      skippedDuplicates = candidates.length - newRows.length;

      if (newRows.length) {
        const { data, error } = await userSupabase
          .from('leads')
          .insert(newRows)
          .select(
            'id, company_name, website, industry, location, contact_name, contact_email, notes, status, score, score_reasons, source, created_at, updated_at'
          );

        if (error) {
          console.error('Lead insert failed:', error.message);
          throw new Error(
            'Could not save discovered leads. Check your leads table and RLS policies.'
          );
        }

        inserted = data || [];
      }
    }

    return res.status(200).json({
      message: 'OpenStreetMap discovery finished.',
      search,
      discovery_status: 'completed',
      found: matched.length,
      saved: inserted.length,
      skipped_duplicates: skippedDuplicates,
      leads: inserted,
      warnings: [
        'OpenStreetMap records may have incomplete contact details.',
        'Verify each business before contacting it.',
      ],
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Discovery timed out. Please try again.',
      });
    }

    next(error);
  }
});


const scoreSchema = z.object({ industry: z.string().max(120).optional().default(''), location: z.string().max(180).optional().default(''), website: z.string().max(500).optional().default(''), contact_name: z.string().max(160).optional().default(''), contact_email: z.string().max(254).optional().default(''), notes: z.string().max(4000).optional().default(''), target_industry: z.string().max(120).optional().default(''), target_location: z.string().max(180).optional().default('') });
app.post('/api/score', auth, (req, res) => { const p = scoreSchema.safeParse(req.body); if (!p.success) return res.status(400).json({ error: 'Invalid lead data.' }); const d = p.data; let score = 0; const reasons = []; if (d.industry && d.target_industry && d.industry.toLowerCase().includes(d.target_industry.toLowerCase())) { score += 25; reasons.push('Industry matches target (+25)'); } else if (d.industry) { score += 10; reasons.push('Industry is known (+10)'); } if (d.location && d.target_location && d.location.toLowerCase().includes(d.target_location.toLowerCase())) { score += 20; reasons.push('Location matches target (+20)'); } else if (d.location) { score += 8; reasons.push('Location is known (+8)'); } if (/^https?:\/\//i.test(d.website)) { score += 20; reasons.push('Website URL is available (+20)'); } if (d.contact_name.trim()) { score += 8; reasons.push('Contact name is available (+8)'); } if (d.contact_email.trim()) { score += 12; reasons.push('Contact email is available (+12)'); } if (d.notes.trim()) { score += 15; reasons.push('Research notes/evidence are present (+15)'); } if (!reasons.length) reasons.push('Add verified company details and evidence to improve this score.'); res.json({ score: Math.min(100, score), reasons, type: 'heuristic_relevance', disclaimer: 'This is a heuristic relevance score, not a conversion prediction.' }); });
const draftSchema = z.object({ company_name: z.string().min(1).max(200), contact_name: z.string().max(160).optional().default(''), industry: z.string().max(120).optional().default(''), website: z.string().max(500).optional().default(''), notes: z.string().max(4000).optional().default(''), service_offer: z.string().max(300).optional().default('website improvement and workflow automation'), sender_name: z.string().max(120).optional().default(''), tone: z.enum(['professional', 'friendly', 'concise']).optional().default('professional') });
app.post('/api/drafts', auth, (req, res) => { const p = draftSchema.safeParse(req.body); if (!p.success) return res.status(400).json({ error: 'Invalid draft details.' }); const d = p.data; const greeting = d.contact_name.trim() ? `Hi ${d.contact_name.trim()},` : `Hello ${d.company_name},`; const evidence = d.notes.trim() ? `I was reviewing the details available for ${d.company_name} and noted: ${d.notes.trim()}.` : `I came across ${d.company_name} while researching businesses in ${d.industry || 'your sector'}.`; const offer = d.tone === 'concise' ? `I help businesses with ${d.service_offer}. Would a short overview be useful?` : `I work on ${d.service_offer} and thought it might be relevant to your team. If improving this area is a priority, I can share a few specific ideas—no pressure.`; res.json({ subject: `A quick idea for ${d.company_name}`, body: `${greeting}\n\n${evidence}\n\n${offer}\n\nBest,\n${d.sender_name.trim() || '[Your name]'}\n\nIf this is not relevant, let me know and I will not follow up.`, source: 'template_fallback', warnings: ['Review every statement against your own research before sending.', 'This endpoint does not send email. Human review and a compliant sending provider are required.', ...(d.notes.trim() ? [] : ['No specific evidence was provided; personalize this draft before use.'])] }); });
app.use((err, _req, res, _next) => { if (err?.message === 'Origin not allowed') return res.status(403).json({ error: 'Origin not allowed.' }); console.error('API error:', err?.message || 'Unknown error'); res.status(500).json({ error: 'Unexpected server error.' }); });
export default app;
