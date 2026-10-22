
import React, { useEffect, useMemo, useState } from 'react';
import {
  Routes, Route, Navigate, useLocation, useNavigate
} from 'react-router-dom';
import Papa from 'papaparse';
import {
  Activity, ArrowDownToLine, ArrowRight, BadgeCheck, Building2,
  Check, ChevronDown, Command, FileSpreadsheet, Filter, Globe2,
  LayoutDashboard, LoaderCircle, LogOut, Mail, Menu, Plus, Search,
  Settings2, ShieldCheck, Sparkles, Target, Trash2, Upload, Users,
  X, Zap
} from 'lucide-react';
import { supabase, configured } from './lib/supabase';
import { api } from './lib/api';

const nav = [
  ['Overview', '/dashboard', LayoutDashboard],
  ['Lead workspace', '/leads', Users],
  ['Discover leads', '/discover', Target],
  ['Outreach drafts', '/outreach', Mail],
];

const statuses = [
  'new', 'qualified', 'contacted', 'replied',
  'won', 'lost', 'archived',
];

const label = status => ({
  new: 'New',
  qualified: 'Qualified',
  contacted: 'Contacted',
  replied: 'Replied',
  won: 'Won',
  lost: 'Lost',
  archived: 'Archived',
}[status] || status);

const initials = email =>
  (email || 'PA').split('@')[0].slice(0, 2).toUpperCase();

function scoreLead(lead, targetIndustry = '', targetLocation = '') {
  let score = 0;
  const reasons = [];

  if (lead.industry && targetIndustry &&
      lead.industry.toLowerCase().includes(targetIndustry.toLowerCase())) {
    score += 25;
    reasons.push('Industry matches target (+25)');
  } else if (lead.industry) {
    score += 10;
    reasons.push('Industry is known (+10)');
  }

  if (lead.location && targetLocation &&
      lead.location.toLowerCase().includes(targetLocation.toLowerCase())) {
    score += 20;
    reasons.push('Location matches target (+20)');
  } else if (lead.location) {
    score += 8;
    reasons.push('Location is known (+8)');
  }

  if (/^https?:\/\//i.test(lead.website || '')) {
    score += 20;
    reasons.push('Website URL is available (+20)');
  }

  if (lead.contact_name?.trim()) {
    score += 8;
    reasons.push('Contact name is available (+8)');
  }

  if (lead.contact_email?.trim()) {
    score += 12;
    reasons.push('Contact email is available (+12)');
  }

  if (lead.notes?.trim()) {
    score += 15;
    reasons.push('Research notes/evidence are present (+15)');
  }

  return {
    score: Math.min(100, score),
    reasons: reasons.length
      ? reasons
      : ['Add verified company details and evidence to improve this score.'],
  };
}

function Auth({ done }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNote('');

    try {
      if (!configured) {
        throw new Error(
          'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env first.'
        );
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { full_name: name } },
        });

        if (error) throw error;

        if (data.session) {
          done(data.session);
        } else {
          setNote('Account created. Check your email to confirm, then sign in.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (error) throw error;
        done(data.session);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-hero">
        <div className="brand">
          <i><Command size={18} /></i> prospect<span>.ai</span>
        </div>
        <div className="hero-copy">
          <small><b /> YOUR NEXT CUSTOMER IS OUT THERE</small>
          <h1>Find the right<br /><em>opportunities.</em></h1>
          <p>
            Bring prospect research, qualification and thoughtful outreach
            into one focused workspace.
          </p>
          <div className="insight">
            <Sparkles />
            <div>
              <strong>Evidence over guesswork</strong>
              <span>Keep the reason behind every score in view.</span>
            </div>
          </div>
        </div>
        <footer>BUILT FOR FOCUSED GROWTH <span>01 / WORKSPACE</span></footer>
      </section>

      <section className="auth-form-wrap">
        <div className="secure">
          <span>WORKSPACE ACCESS</span>
          <span><ShieldCheck size={14} /> PRIVATE BY DESIGN</span>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <small>{mode === 'signin' ? 'WELCOME BACK' : 'WELCOME ABOARD'}</small>
          <h2>{mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace'}</h2>
          <p>{mode === 'signin' ? 'Pick up where your research left off.' : 'A clearer way to build your pipeline.'}</p>

          {mode === 'signup' && (
            <label>
              Full name
              <input value={name} onChange={e => setName(e.target.value)}
                required maxLength={120} />
            </label>
          )}

          <label>
            Email address
            <input type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email" />
          </label>

          <label>
            Password
            <input type="password" value={pass}
              onChange={e => setPass(e.target.value)}
              required minLength={8}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
          </label>

          {error && <div className="alert error">{error}</div>}
          {note && <div className="alert">{note}</div>}

          <button className="btn primary wide" disabled={busy}>
            {busy && <LoaderCircle className="spin" size={16} />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
            <ArrowRight size={16} />
          </button>

          <div className="switch">
            {mode === 'signin' ? 'New to Prospect AI?' : 'Already have an account?'}
            {' '}
            <button type="button" onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setNote('');
            }}>
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </div>

          <div className="privacy">
            <ShieldCheck size={15} />
            Your records are protected by row-level security.
          </div>
        </form>
      </section>
    </div>
  );
}

function Header({ eyebrow, title, description, action }) {
  return (
    <div className="pagehead">
      <div>
        <small>{eyebrow}</small>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="head-actions">{action}</div>}
    </div>
  );
}

function Badge({ status }) {
  return <span className={`badge b-${status}`}>{label(status)}</span>;
}

function Score({ n = 0 }) {
  const score = Math.max(0, Math.min(100, Number(n) || 0));

  return (
    <div className="score">
      <span><i style={{ width: `${score}%` }} /></span>
      <b>{score}</b>
    </div>
  );
}

function Empty({ title, body, action, button }) {
  return (
    <div className="empty">
      <div><Building2 /></div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action && (
        <button className="btn secondary" onClick={action}>
          {button || 'Get started'} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function Modal({ lead, onClose, onSave, busy }) {
  const [form, setForm] = useState(lead || {
    company_name: '',
    website: '',
    industry: '',
    location: '',
    contact_name: '',
    contact_email: '',
    notes: '',
    status: 'new',
  });
  const [error, setError] = useState('');

  function set(key, value) {
    setForm(previous => ({ ...previous, [key]: value }));
  }

  return (
    <div className="backdrop"
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={async e => {
        e.preventDefault();

        if (!form.company_name.trim()) {
          setError('Company name is required.');
          return;
        }

        setError('');
        await onSave(form);
      }}>
        <div className="modalhead">
          <div>
            <small>{lead ? 'EDIT RECORD' : 'NEW RECORD'}</small>
            <h2>{lead ? 'Update prospect' : 'Add a prospect'}</h2>
            <p>Keep details factual; add evidence in notes.</p>
          </div>
          <button type="button" className="iconbtn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="formgrid">
          <label className="full">
            Company name *
            <input value={form.company_name}
              onChange={e => set('company_name', e.target.value)}
              required maxLength={200} placeholder="e.g. Bright Dental" />
          </label>

          <label>
            Website
            <input type="url" value={form.website || ''}
              onChange={e => set('website', e.target.value)}
              maxLength={500} placeholder="https://example.com" />
          </label>

          <label>
            Industry
            <input value={form.industry || ''}
              onChange={e => set('industry', e.target.value)}
              maxLength={120} placeholder="Dental, SaaS, agency…" />
          </label>

          <label>
            Location
            <input value={form.location || ''}
              onChange={e => set('location', e.target.value)}
              maxLength={180} placeholder="City, country" />
          </label>

          <label>
            Contact name
            <input value={form.contact_name || ''}
              onChange={e => set('contact_name', e.target.value)}
              maxLength={160} />
          </label>

          <label className="full">
            Contact email
            <input type="email" value={form.contact_email || ''}
              onChange={e => set('contact_email', e.target.value)}
              maxLength={254} />
          </label>

          <label className="full">
            Research notes / opportunity evidence
            <textarea rows="3" value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
              maxLength={4000} placeholder="What did you personally verify?" />
          </label>

          <label>
            Status
            <select value={form.status || 'new'}
              onChange={e => set('status', e.target.value)}>
              {statuses.map(status => (
                <option key={status} value={status}>{label(status)}</option>
              ))}
            </select>
          </label>

          {error && <div className="alert error full">{error}</div>}
        </div>

        <div className="modalactions">
          <button type="button" className="btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
            {lead ? 'Save changes' : 'Add prospect'}
          </button>
        </div>
      </form>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [leads, setLeads] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [menu, setMenu] = useState(false);

  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) notify(error.message);
      setSession(data?.session || null);
      setChecking(false);
    }).catch(error => {
      if (!mounted) return;
      notify(error.message || 'Could not check your session.');
      setChecking(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  }

  async function load() {
    if (!supabase || !session) return;

    setLoading(true);

    try {
      const [leadsResult, draftsResult] = await Promise.all([
        supabase.from('leads').select('*')
          .order('created_at', { ascending: false }),
        supabase.from('outreach_drafts').select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (leadsResult.error) throw leadsResult.error;
      if (draftsResult.error) throw draftsResult.error;

      setLeads(leadsResult.data || []);
      setDrafts(draftsResult.data || []);
    } catch (error) {
      notify(error.message || 'Could not load workspace data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      load();
    } else {
      setLeads([]);
      setDrafts([]);
      setLoading(false);
    }
  }, [session?.user?.id]);

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      notify(error.message);
      return;
    }
    setSession(null);
    navigate('/');
  }

  if (checking) {
    return (
      <div className="loading">
        <div className="brand"><i><Command /></i> prospect<span>.ai</span></div>
        Preparing your workspace…
      </div>
    );
  }

  if (!session) return <Auth done={setSession} />;

  const current = nav.find(item =>
    loc.pathname === item[1] ||
    (item[1] !== '/dashboard' && loc.pathname.startsWith(item[1]))
  ) || nav[0];

  const props = {
    session, leads, setLeads, drafts, setDrafts, load, notify, loading,
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand"><i><Command size={18} /></i> prospect<span>.ai</span></div>

        <div className="workspace">
          <b>P</b>
          <div><strong>Personal workspace</strong><small>Free plan</small></div>
          <ChevronDown size={14} />
        </div>

        <small className="side-label">WORKSPACE</small>

        <nav>
          {nav.map(([title, path, Icon]) => (
            <button key={path}
              className={current[1] === path ? 'active' : ''}
              onClick={() => { navigate(path); setMenu(false); }}>
              <Icon size={17} />{title}
              {path === '/outreach' &&
                drafts.some(d => d.status === 'draft') && (
                  <span className="count">
                    {drafts.filter(d => d.status === 'draft').length}
                  </span>
                )}
            </button>
          ))}
        </nav>

        <small className="side-label tools-label">TOOLS</small>
        <button className="navitem" onClick={() => navigate('/settings')}>
          <Settings2 size={17} />Settings & setup
        </button>

        <div className="sidebar-spacer" />

        <div className="tip">
          <Zap size={16} />
          <strong>Small steps. Better leads.</strong>
          <p>Use verified details and evidence to make each outreach relevant.</p>
          <button onClick={() => navigate('/discover')}>
            Start a search <ArrowRight size={13} />
          </button>
        </div>

        <div className="userline">
          <b>{initials(session.user.email)}</b>
          <div>
            <strong>{session.user.user_metadata?.full_name ||
              session.user.email?.split('@')[0]}</strong>
            <small>{session.user.email}</small>
          </div>
          <button className="iconbtn" title="Sign out" onClick={logout}>
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {menu && <button className="scrim" onClick={() => setMenu(false)} />}

      <main>
        <header className="topbar">
          <div className="crumb">
            <button className="menubtn" onClick={() => setMenu(true)}>
              <Menu size={19} />
            </button>
            Workspace <span>/</span> <b>{current[0]}</b>
          </div>
          <div className="topright">
            <span className="activepill"><i /> Workspace active</span>
            <div className="avatar">{initials(session.user.email)}</div>
          </div>
        </header>

        <div className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard {...props} />} />
            <Route path="/leads" element={<Leads {...props} />} />
            <Route path="/discover"
              element={<Discover {...props} />} />
            <Route path="/outreach" element={<Outreach {...props} />} />
            <Route path="/settings"
              element={<Settings session={session} notify={notify} />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>

        <footer className="appfooter">
          <span>© 2026 Prospect AI</span>
          <span><ShieldCheck size={13} /> Evidence-led prospecting · Human-reviewed outreach</span>
        </footer>
      </main>

      {toast && <div className="toast"><Check size={15} />{toast}</div>}
    </div>
  );
}

function Dashboard({ leads, drafts, loading }) {
  const navigate = useNavigate();
  const qualified = leads.filter(l => l.score >= 65 && l.status !== 'archived').length;

  return (
    <div>
      <div className="welcome">
        <div>
          <small>{new Date().toLocaleDateString(undefined, {
            weekday: 'long', month: 'long', day: 'numeric',
          })}</small>
          <h1>Good work starts with <em>good leads.</em></h1>
          <p>Here’s what’s happening in your pipeline today.</p>
        </div>
        <button className="btn primary"
          onClick={() => navigate('/leads', { state: { create: true } })}>
          <Plus size={16} /> Add a lead
        </button>
      </div>

      <div className="hero-strip">
        <div className="heroicon"><Sparkles /></div>
        <div>
          <small>YOUR PROSPECTING DESK</small>
          <h2>Build a pipeline you can explain.</h2>
          <p>Track the evidence, understand the score, and approve every message before it leaves your desk.</p>
        </div>
        <button className="btn ghost" onClick={() => navigate('/discover')}>
          Explore workflow <ArrowRight size={15} />
        </button>
      </div>

      <div className="sectiontitle">
        <div><h2>Pipeline overview</h2><p>Live totals from your saved leads and drafts.</p></div>
        <span><Activity size={13} /> {loading ? 'Syncing…' : 'Synced with your workspace'}</span>
      </div>

      <div className="metrics">
        {[
          ['Total prospects', leads.length, 'Across all statuses', Building2],
          ['Qualified leads', qualified, 'Score of 65 or higher', Target],
          ['Drafts to review', drafts.filter(d => d.status === 'draft').length, 'Awaiting your approval', Mail],
          ['Won opportunities', leads.filter(l => l.status === 'won').length, 'Marked as won', BadgeCheck],
        ].map(([title, value, note, Icon], index) => (
          <div className={index === 1 ? 'highlight' : ''} key={title}>
            <div>{title}<i><Icon size={17} /></i></div>
            <strong>{value}</strong><small>{note}</small>
          </div>
        ))}
      </div>

      <div className="dashgrid">
        <section className="panel">
          <div className="panelhead">
            <div><h3>Recently added</h3><p>Your latest prospect records</p></div>
            <button className="textlink" onClick={() => navigate('/leads')}>
              View all <ArrowRight size={13} />
            </button>
          </div>

          {leads.length ? (
            <div className="tablewrap">
              <table>
                <thead><tr><th>COMPANY</th><th>STATUS</th><th>FIT SCORE</th><th>ADDED</th></tr></thead>
                <tbody>
                  {leads.slice(0, 5).map(lead => (
                    <tr key={lead.id} onClick={() => navigate('/leads')}>
                      <td><div className="company">
                        <b>{(lead.company_name || '?').slice(0, 1).toUpperCase()}</b>
                        <div><strong>{lead.company_name}</strong><small>{lead.industry || 'Industry not set'}</small></div>
                      </div></td>
                      <td><Badge status={lead.status} /></td>
                      <td><Score n={lead.score} /></td>
                      <td>{new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Your pipeline starts here"
              body="Add a prospect manually or import a CSV to see your first records."
              action={() => navigate('/leads', { state: { create: true } })}
              button="Add your first lead" />
          )}
        </section>

        <section className="panel next">
          <div className="panelhead">
            <div><h3>Next best steps</h3><p>Keep your workflow moving</p></div>
            <Sparkles />
          </div>
          {[
            ['01', 'Add or import leads', 'Bring your research into one place.', '/leads'],
            ['02', 'Define your ideal customer', 'Set target industry and location.', '/discover'],
            ['03', 'Review outreach drafts', 'Personalize and approve each message.', '/outreach'],
          ].map(step => (
            <button className="step" key={step[0]} onClick={() => navigate(step[3])}>
              <b>{step[0]}</b><span><strong>{step[1]}</strong><small>{step[2]}</small></span><ArrowRight size={14} />
            </button>
          ))}
          <div className="compliance">
            <ShieldCheck size={17} />
            <p><strong>Human review stays in control.</strong><br />Prospect AI creates drafts only. It never sends email automatically.</p>
          </div>
        </section>
      </div>

      <div className="bottomnote">
        <b><Activity size={13} /> A practical reminder</b>
        <p>Scores reflect profile completeness and target fit—not guaranteed buying intent. Verify evidence before reaching out.</p>
      </div>
    </div>
  );
}

function Leads({ session, leads, setLeads, notify }) {
  const loc = useLocation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [industry, setIndustry] = useState('all');
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (loc.state?.create) {
      setModal('new');
      window.history.replaceState({}, document.title);
    }
  }, [loc.state]);

  const industries = [...new Set(leads.map(l => l.industry).filter(Boolean))].sort();

  const filtered = useMemo(() => leads.filter(lead =>
    (!search || [
      lead.company_name, lead.website, lead.industry, lead.location,
      lead.contact_name, lead.contact_email, lead.notes,
    ].some(value => (value || '').toLowerCase().includes(search.toLowerCase()))) &&
    (status === 'all' || lead.status === status) &&
    (industry === 'all' || lead.industry === industry)
  ), [leads, search, status, industry]);

  async function save(form) {
    setBusy(true);
    try {
      const result = scoreLead(form);
      const payload = {
        ...form,
        user_id: session.user.id,
        score: result.score,
        score_reasons: result.reasons,
      };

      const query = modal === 'new'
        ? await supabase.from('leads').insert(payload).select().single()
        : await supabase.from('leads').update(payload).eq('id', modal.id).select().single();

      if (query.error) throw query.error;

      setLeads(old => modal === 'new'
        ? [query.data, ...old]
        : old.map(lead => lead.id === query.data.id ? query.data : lead));

      setModal(null);
      notify(modal === 'new' ? 'Prospect added.' : 'Prospect updated.');
    } catch (error) {
      notify(error.message || 'Could not save lead.');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(lead, nextStatus) {
    const query = await supabase.from('leads')
      .update({ status: nextStatus }).eq('id', lead.id).select().single();

    if (query.error) return notify(query.error.message);

    setLeads(old => old.map(item => item.id === lead.id ? query.data : item));
  }

  async function remove(lead) {
    if (!window.confirm(`Delete ${lead.company_name}? This cannot be undone.`)) return;

    const query = await supabase.from('leads').delete().eq('id', lead.id);
    if (query.error) return notify(query.error.message);

    setLeads(old => old.filter(item => item.id !== lead.id));
    notify('Prospect deleted.');
  }

  function exportCsv() {
    const csv = Papa.unparse(filtered.map(({
      company_name, website, industry, location, contact_name,
      contact_email, notes, status, score, created_at,
    }) => ({
      company_name, website, industry, location, contact_name,
      contact_email, notes, status, score, created_at,
    })));

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'prospect-ai-leads.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function parse(file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => {
        const rows = result.data.map(row => {
          const data = Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key.trim().toLowerCase().replace(/[ -]+/g, '_'),
              String(value ?? '').trim(),
            ])
          );

          const get = (...keys) => keys.map(key => data[key]).find(Boolean) || '';

          return {
            company_name: get('company_name', 'company', 'business_name', 'name'),
            website: get('website', 'url', 'domain'),
            industry: get('industry', 'category'),
            location: get('location', 'city', 'country'),
            contact_name: get('contact_name', 'first_name'),
            contact_email: get('contact_email', 'email'),
            notes: get('notes', 'observation', 'opportunity', 'description'),
            status: 'new',
            source: 'csv_import',
          };
        }).filter(row => row.company_name);

        const seen = new Set();
        const unique = rows.filter(row => {
          const key = (row.website || row.contact_email || row.company_name)
            .toLowerCase().replace(/\/$/, '');

          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setPreview({
          rows: unique,
          skipped: result.data.length - unique.length,
          errors: result.errors.length,
        });
      },
      error: error => notify(error.message || 'Could not parse CSV.'),
    });
  }

  async function importRows() {
    if (!preview) return;
    setImporting(true);

    try {
      const existing = new Set(
        leads.flatMap(lead => [lead.website, lead.contact_email]
          .filter(Boolean).map(value => value.toLowerCase().replace(/\/$/, '')))
      );

      const rows = preview.rows.filter(row =>
        ![row.website, row.contact_email].filter(Boolean)
          .some(value => existing.has(value.toLowerCase().replace(/\/$/, '')))
      ).map(row => {
        const score = scoreLead(row);
        return {
          ...row,
          user_id: session.user.id,
          score: score.score,
          score_reasons: score.reasons,
        };
      });

      if (!rows.length) {
        notify('No new leads; matching records already exist.');
        setPreview(null);
        return;
      }

      const query = await supabase.from('leads').insert(rows).select();
      if (query.error) throw query.error;

      setLeads(old => [...(query.data || []), ...old]);
      notify(`${query.data?.length || 0} leads imported.`);
      setPreview(null);
    } catch (error) {
      notify(error.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <Header eyebrow="YOUR PIPELINE" title="Lead workspace"
        description="Organize prospects, keep research close, and prioritize with transparent fit scores."
        action={
          <>
            <label className="btn secondary upload">
              <Upload size={15} /> Import CSV
              <input type="file" accept=".csv,text/csv"
                onChange={event => event.target.files?.[0] && parse(event.target.files[0])} />
            </label>
            <button className="btn primary" onClick={() => setModal('new')}>
              <Plus size={15} /> Add lead
            </button>
          </>
        } />

      <div className="inline-metrics">
        {[
          ['Total leads', leads.length],
          ['Qualified', leads.filter(l => l.score >= 65 && l.status !== 'archived').length],
          ['In progress', leads.filter(l => ['contacted', 'replied'].includes(l.status)).length],
          ['Archived', leads.filter(l => l.status === 'archived').length],
        ].map(item => <div key={item[0]}><small>{item[0]}</small><b>{item[1]}</b></div>)}
      </div>

      <section className="panel leadpanel">
        <div className="toolbar">
          <div className="searchbox">
            <Search size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search company, contact, notes…" />
          </div>

          <div className="filters">
            <label><Filter size={14} />
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                {statuses.map(item => <option key={item} value={item}>{label(item)}</option>)}
              </select>
            </label>
            <label><Building2 size={14} />
              <select value={industry} onChange={e => setIndustry(e.target.value)}>
                <option value="all">All industries</option>
                {industries.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button className="btn secondary export" onClick={exportCsv}>
              <ArrowDownToLine size={14} /> Export
            </button>
          </div>
        </div>

        {filtered.length ? (
          <div className="tablewrap">
            <table className="leads-table">
              <thead><tr>
                <th>COMPANY / CONTACT</th><th>INDUSTRY & LOCATION</th>
                <th>STATUS</th><th>FIT SCORE</th><th>UPDATED</th><th />
              </tr></thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}>
                    <td><div className="company">
                      <b>{(lead.company_name || '?').slice(0, 1).toUpperCase()}</b>
                      <div><strong>{lead.company_name}</strong>
                        <small>{lead.contact_name || lead.contact_email || lead.website || 'No contact details'}</small>
                      </div>
                    </div></td>
                    <td><div className="twoline">
                      <strong>{lead.industry || '—'}</strong>
                      <small>{lead.location || 'Location not set'}</small>
                    </div></td>
                    <td><select className={`statusselect b-${lead.status}`}
                      value={lead.status} onChange={e => changeStatus(lead, e.target.value)}>
                      {statuses.map(item => <option key={item} value={item}>{label(item)}</option>)}
                    </select></td>
                    <td><Score n={lead.score} /></td>
                    <td>{new Date(lead.updated_at || lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
                    <td><div className="rowactions">
                      <button className="iconbtn" title="Edit" onClick={() => setModal(lead)}><Settings2 size={15} /></button>
                      <button className="iconbtn danger" title="Delete" onClick={() => remove(lead)}><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={leads.length ? 'No matching prospects' : 'Your lead list is empty'}
            body={leads.length ? 'Try another search or clear the filters.' : 'Add a lead manually or import a CSV you are permitted to use.'}
            action={() => leads.length
              ? (setSearch(''), setStatus('all'), setIndustry('all'))
              : setModal('new')}
            button={leads.length ? 'Clear filters' : 'Add first lead'} />
        )}

        <div className="tablefoot">
          Showing <b>{filtered.length}</b> of <b>{leads.length}</b> leads
          <span><ShieldCheck size={13} /> Private to your account</span>
        </div>
      </section>

      <div className="bottomnote">
        <b><FileSpreadsheet size={13} /> Import tip</b>
        <p>CSV headers can include company_name, website, industry, location, contact_name, contact_email and notes. Check your data permissions before importing.</p>
      </div>

      {modal && (
        <Modal lead={modal === 'new' ? null : modal}
          onClose={() => setModal(null)} onSave={save} busy={busy} />
      )}

      {preview && (
        <div className="backdrop">
          <div className="modal csvmodal">
            <div className="modalhead">
              <div><small>CSV IMPORT</small><h2>Review before importing</h2>
                <p>Confirm the data looks right before adding it.</p></div>
              <button className="iconbtn" onClick={() => setPreview(null)}><X /></button>
            </div>

            <div className="csvsummary">
              <div><b>{preview.rows.length}</b><small>Valid rows</small></div>
              <div><b>{preview.skipped}</b><small>Duplicates / missing company</small></div>
              <div><b>{preview.errors}</b><small>Parser warnings</small></div>
            </div>

            <div className="tablewrap preview">
              <table>
                <thead><tr><th>Company</th><th>Industry</th><th>Location</th><th>Contact</th></tr></thead>
                <tbody>{preview.rows.slice(0, 8).map((row, index) => (
                  <tr key={index}><td>{row.company_name}</td><td>{row.industry || '—'}</td>
                    <td>{row.location || '—'}</td><td>{row.contact_email || '—'}</td></tr>
                ))}</tbody>
              </table>
            </div>

            <div className="modalactions">
              <button className="btn secondary" onClick={() => setPreview(null)}>Cancel</button>
              <button className="btn primary" disabled={!preview.rows.length || importing}
                onClick={importRows}>
                {importing && <LoaderCircle className="spin" size={15} />}
                Import {preview.rows.length} leads
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Discover({ session, notify, load }) {
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('prospect-ai-icp') || '{}');
    } catch {
      return {};
    }
  });

  const [industry, setIndustry] = useState(profile.targetIndustry || 'Dental clinics');
  const [location, setLocation] = useState(profile.targetLocation || 'United Kingdom');
  const [city, setCity] = useState(profile.targetCity || '');
  const [offer, setOffer] = useState(profile.serviceOffer || 'website improvements and appointment automation');
  const [keywords, setKeywords] = useState('');
  const [limit, setLimit] = useState(10);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function saveProfile() {
    const nextProfile = {
      targetIndustry: industry,
      targetLocation: location,
      targetCity: city,
      serviceOffer: offer,
    };

    try {
      localStorage.setItem('prospect-ai-icp', JSON.stringify(nextProfile));
      setProfile(nextProfile);
      setDone(true);
      notify('Ideal customer profile saved in this browser.');
    } catch {
      notify('Could not save the profile in this browser.');
    }
  }

  async function startSearch(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);

    try {
      if (!industry.trim() || !location.trim() || !city.trim()) {
        throw new Error('Industry, country and city are required.');
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const token = data.session?.access_token || session?.access_token;
      if (!token) throw new Error('Your session expired. Please sign in again.');

      const response = await api('/api/discovery/search', token, {
        niche: industry.trim(),
        country: location.trim(),
        city: city.trim(),
        keywords: keywords.trim(),
        requested_limit: Number(limit),
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response received from the discovery server.');
      }

      if (response.error) {
        throw new Error(typeof response.error === 'string'
          ? response.error : 'Business discovery failed.');
      }

      setResult(response);

      if (response.discovery_status === 'completed') {
        await load();
        notify(`${response.saved ?? 0} new leads saved. ${response.skipped_duplicates ?? 0} duplicates skipped.`);
      } else {
        notify(response.message || 'Search request completed.');
      }
    } catch (err) {
      setError(err.message || 'Could not complete discovery.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Header eyebrow="DISCOVERY WORKFLOW" title="Find your next prospects"
        description="Search public OpenStreetMap records, then review matching prospects before outreach." />

      <div className="discovergrid">
        <section className="panel discoverform">
          <div className="panelhead">
            <div><h3>Ideal customer profile</h3><p>Choose the businesses you want to target.</p></div>
            <Target />
          </div>

          <label>Target industry
            <input value={industry} onChange={e => { setIndustry(e.target.value); setDone(false); }}
              required maxLength={120} placeholder="e.g. Dental clinics" />
          </label>

          <label>Target country
            <input value={location} onChange={e => { setLocation(e.target.value); setDone(false); }}
              required maxLength={100} placeholder="e.g. United Kingdom" />
          </label>

          <label>Target city
            <input value={city} onChange={e => { setCity(e.target.value); setDone(false); }}
              required maxLength={100} placeholder="e.g. Manchester" />
          </label>

          <label>Service you offer
            <textarea rows="3" value={offer}
              onChange={e => { setOffer(e.target.value); setDone(false); }}
              maxLength={300} />
          </label>

          <button className="btn secondary" type="button" onClick={saveProfile}>
            Save target profile <Check size={14} />
          </button>
          {done && <p className="hint">Target profile saved in this browser.</p>}
        </section>

        <section className="panel discoverform">
          <div className="panelhead">
            <div><h3>Business discovery</h3><p>Search public OpenStreetMap data.</p></div>
            <Globe2 />
          </div>

          <form onSubmit={startSearch}>
            <label>Additional keywords
              <input value={keywords} onChange={e => setKeywords(e.target.value)}
                maxLength={500} placeholder="e.g. independent, orthodontics" />
            </label>

            <label>Maximum number of leads
              <select value={limit} onChange={e => setLimit(Number(e.target.value))}>
                <option value={10}>10 leads</option>
                <option value={25}>25 leads</option>
                <option value={50}>50 leads</option>
              </select>
            </label>

            {error && <div className="alert error">{error}</div>}

            <button className="btn primary wide" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={15} /> : <Search size={15} />}
              {busy ? 'Discovering businesses…' : 'Discover businesses'}
            </button>
          </form>

          {result && (
            <div className="alert">
              <strong>{result.message || 'Discovery result'}</strong>
              {result.search?.id && <p>Search ID: {result.search.id}</p>}
              <p>Businesses matched: <strong>{result.found ?? 0}</strong></p>
              <p>New leads saved: <strong>{result.saved ?? 0}</strong></p>
              <p>Duplicates skipped: <strong>{result.skipped_duplicates ?? 0}</strong></p>
              {result.warnings?.map((warning, index) => <p key={index}>{warning}</p>)}
            </div>
          )}
        </section>
      </div>

      <section className="panel workflow">
        <div className="panelhead">
          <div><h3>Discovery workflow</h3><p>From a target profile to saved prospect records.</p></div>
        </div>
        <div className="steps">
          {[
            ['01', 'Define', 'Choose your industry, country and city.'],
            ['02', 'Discover', 'Search public OpenStreetMap records.'],
            ['03', 'Save', 'Store new prospects in your Supabase workspace.'],
            ['04', 'Qualify', 'Review scores and verify business details.'],
          ].map(item => (
            <div key={item[0]}><small>{item[0]}</small><b>{item[1]}</b><p>{item[2]}</p></div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Outreach({ session, leads, drafts, setDrafts, notify }) {
  const [leadId, setLeadId] = useState('');
  const [offer, setOffer] = useState('website improvements and workflow automation');
  const [sender, setSender] = useState(session.user.user_metadata?.full_name || '');
  const [tone, setTone] = useState('professional');
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState('');

  const lead = leads.find(item => item.id === leadId);

  async function generate(event) {
    event.preventDefault();
    if (!lead) return;

    setBusy(true);
    setError('');

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session?.access_token) throw new Error('Please sign in again.');

      const result = await api('/api/drafts', data.session.access_token, {
        ...lead,
        service_offer: offer,
        sender_name: sender,
        tone,
      });

      if (!result || !result.subject || !result.body) {
        throw new Error('The draft service returned an incomplete response.');
      }

      const query = await supabase.from('outreach_drafts').insert({
        user_id: session.user.id,
        lead_id: lead.id,
        subject: result.subject,
        body: result.body,
        status: 'draft',
      }).select().single();

      if (query.error) throw query.error;

      const draft = { ...query.data, warnings: result.warnings || [] };
      setDrafts(old => [draft, ...old]);
      setCurrent(draft);
      notify('Draft created. Review it before use.');
    } catch (err) {
      setError(err.message || 'Could not create draft.');
    } finally {
      setBusy(false);
    }
  }

  async function approve(draft) {
    const query = await supabase.from('outreach_drafts')
      .update({ status: 'approved' }).eq('id', draft.id).select().single();

    if (query.error) return notify(query.error.message);

    setDrafts(old => old.map(item => item.id === draft.id ? query.data : item));
    setCurrent({ ...draft, ...query.data });
    notify('Draft approved for manual use. No email was sent.');
  }

  async function copy(draft) {
    try {
      await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
      notify('Draft copied to clipboard.');
    } catch {
      notify('Clipboard unavailable in this browser.');
    }
  }

  return (
    <div>
      <Header eyebrow="OUTREACH STUDIO" title="Words that start conversations"
        description="Create a grounded first draft, edit it, and approve it yourself. Sending is intentionally not connected." />

      <div className="outreachgrid">
        <section className="panel builder">
          <div className="panelhead">
            <div><h3>Draft builder</h3><p>Personalize from known fields, not assumptions.</p></div>
            <Sparkles />
          </div>

          <form onSubmit={generate}>
            <label>Choose a prospect
              <select value={leadId} onChange={e => setLeadId(e.target.value)} required>
                <option value="">Select a saved lead…</option>
                {leads.filter(item => item.status !== 'archived').map(item => (
                  <option key={item.id} value={item.id}>
                    {item.company_name}{item.contact_name ? ` · ${item.contact_name}` : ''}
                  </option>
                ))}
              </select>
            </label>

            {lead && (
              <div className="selectedlead">
                <b>{(lead.company_name || '?').slice(0, 1).toUpperCase()}</b>
                <span><strong>{lead.company_name}</strong>
                  <small>{lead.industry || 'Industry not set'} · {lead.location || 'Location not set'}</small>
                </span>
                <Score n={lead.score} />
              </div>
            )}

            <label>What are you offering?
              <textarea rows="2" value={offer} onChange={e => setOffer(e.target.value)}
                required maxLength={300} />
            </label>

            <label>Your sign-off
              <input value={sender} onChange={e => setSender(e.target.value)} maxLength={120}
                placeholder="Your name" />
            </label>

            <label>Tone
              <select value={tone} onChange={e => setTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="concise">Concise</option>
              </select>
            </label>

            {error && <div className="alert error">{error}</div>}

            <button className="btn primary wide" disabled={busy || !leads.length}>
              {busy ? <LoaderCircle className="spin" size={15} /> : <Sparkles size={15} />}
              Generate outreach draft
            </button>
            {!leads.length && <p className="hint">Add at least one lead before creating a draft.</p>}
          </form>
        </section>

        <section className="panel previewpanel">
          <div className="panelhead">
            <div><h3>Draft preview</h3><p>Review and refine before external use.</p></div>
            <small className="previewtag">PREVIEW</small>
          </div>

          {current ? (
            <div className="emailpreview">
              <div className="emailmeta"><small>TO</small>
                <b>{leads.find(item => item.id === current.lead_id)?.contact_email || 'Contact email not provided'}</b>
                <Badge status={current.status === 'approved' ? 'qualified' : 'new'} />
              </div>
              <div className="emailmeta"><small>SUBJECT</small><b>{current.subject}</b></div>
              <div className="emailbody">{current.body}</div>
              {(current.warnings?.length ? current.warnings : [
                'Review every statement against your research.',
                'Approval records your review only. No email has been sent.',
              ]).map((warning, index) => (
                <div className="warning" key={index}><ShieldCheck size={13} />{warning}</div>
              ))}
              <div className="emailactions">
                <button className="btn secondary" onClick={() => copy(current)}>
                  <ArrowDownToLine size={14} /> Copy draft
                </button>
                {current.status !== 'approved' && (
                  <button className="btn primary" onClick={() => approve(current)}>
                    <Check size={14} /> Approve draft
                  </button>
                )}
              </div>
              <p className="hint"><ShieldCheck size={13} /> Approval does not send the message.</p>
            </div>
          ) : (
            <div className="previewempty">
              <div><Mail /><Sparkles /></div>
              <h3>Your next conversation starts here</h3>
              <p>Select a saved prospect and generate a draft. The preview appears here with review reminders.</p>
              <span /><span /><span />
            </div>
          )}
        </section>
      </div>

      <section className="panel draftlist">
        <div className="panelhead">
          <div><h3>Recent drafts</h3>
            <p>{drafts.filter(d => d.status === 'draft').length} awaiting review · {drafts.filter(d => d.status === 'approved').length} approved for manual use</p>
          </div>
          <small className="previewtag">{drafts.length} TOTAL</small>
        </div>

        {drafts.length ? drafts.map(draft => (
          <div className="draftrow" key={draft.id}>
            <i><Mail size={16} /></i>
            <span><b>{draft.subject}</b>
              <small>{leads.find(item => item.id === draft.lead_id)?.company_name || 'Deleted lead'} · {new Date(draft.created_at).toLocaleDateString()}</small>
            </span>
            <Badge status={draft.status === 'approved' ? 'qualified' : 'new'} />
            <button className="textlink" onClick={() => setCurrent(draft)}>
              Open <ArrowRight size={13} />
            </button>
          </div>
        )) : (
          <Empty title="No drafts yet" body="Choose a prospect above to create your first outreach draft." />
        )}
      </section>
    </div>
  );
}

function Settings({ session, notify }) {
  const [name, setName] = useState(session.user.user_metadata?.full_name || '');
  const [busy, setBusy] = useState(false);

  async function save(event) {
    event.preventDefault();
    setBusy(true);

    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
      if (error) throw error;
      notify('Profile name updated.');
    } catch (error) {
      notify(error.message || 'Could not update profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Header eyebrow="WORKSPACE SETTINGS" title="Settings & setup"
        description="Manage your profile and review the production setup checklist." />

      <div className="settingsgrid">
        <section className="panel settingspanel">
          <div className="panelhead">
            <div><h3>Your profile</h3><p>Used for your workspace sign-off.</p></div>
          </div>
          <form onSubmit={save}>
            <label>Full name
              <input value={name} onChange={e => setName(e.target.value)} maxLength={120} />
            </label>
            <label>Email address
              <input value={session.user.email || ''} disabled />
            </label>
            <button className="btn primary" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />}
              Save profile
            </button>
          </form>
        </section>

        <section className="panel settingspanel">
          <div className="panelhead">
            <div><h3>Launch checklist</h3><p>Complete before inviting public users.</p></div>
            <ShieldCheck />
          </div>
          {[
            'Supabase URL and publishable key configured',
            'Database migration applied and RLS tested',
            'Auth redirect URLs and email confirmation configured',
            'Privacy notice and terms published',
            'Permitted data provider and retention reviewed',
            'Opt-out workflow ready before sending',
          ].map((item, index) => (
            <div className="checkrow" key={item}>
              <i>{index < 2 ? <Check size={12} /> : null}</i>{item}
            </div>
          ))}
        </section>
      </div>

      <div className="securitybanner">
        <ShieldCheck size={19} />
        <div><b>Security note</b>
          <p>Never put service-role keys in browser code. This app uses a publishable/anon key with RLS; server endpoints should verify the signed-in user token.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
