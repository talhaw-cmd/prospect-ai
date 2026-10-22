# Prospect AI

**An intelligent workspace for business prospect discovery, lead management, qualification, and personalized outreach.**

Prospect AI brings prospect research and outreach preparation into one workspace. Discover business records from public OpenStreetMap data, organize prospects in a centralized lead workspace, review transparent fit scores, and prepare personalized outreach drafts before using them.

The project emphasizes evidence-based prospecting, practical lead management, and human-reviewed communication.

## Overview

Finding potential customers involves more than collecting company names. Useful prospecting requires organizing business information, assessing how well a business fits a target market, and preparing relevant communication.

Prospect AI aims to simplify this workflow by combining business discovery, lead management, qualification, and outreach preparation in one application.

## Features

### Business Discovery
- Search for business records using a target industry, country, and city.
- Retrieve supported business records from OpenStreetMap-based sources.
- Configure a target customer profile and service offering.
- Set a requested discovery limit of 10, 25, or 50 leads.
- Save newly discovered prospects to your workspace.
- Report saved records and skipped duplicates.

*Discovery coverage and available business details depend on public data availability and the configured backend provider.*

### Lead Management
- Add, edit, and delete prospect records.
- Store company names, websites, industries, locations, contact details, and research notes.
- Organize leads by status.
- Search and filter prospects.
- Import leads from CSV files.
- Export filtered lead records to CSV.
- Review lead information in a centralized workspace.

### Lead Qualification
- Calculate a transparent fit score from available prospect information.
- Consider industry, location, website, contact details, and research notes.
- Display score information to help prioritize records.

**Important:** Fit scores represent profile completeness and configured target matching. They do not establish buying intent or guarantee conversion.

### Outreach Drafts
- Select a saved prospect.
- Specify your service offer, sender name, and preferred tone.
- Generate an outreach draft.
- Review the subject and message body.
- Copy drafts for manual use.
- Mark drafts as approved for manual use.

Prospect AI does not automatically send emails. Drafts should be reviewed and verified before external use.

### Authentication and Data Protection
- Supabase-based authentication.
- User-specific records supported by Row Level Security (RLS).
- Authenticated backend endpoints.
- Environment-based configuration for credentials.

Security depends on correct Supabase policies, backend authorization, and deployment configuration.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite |
| Routing | React Router |
| Icons | Lucide React |
| CSV processing | Papa Parse |
| Backend | Node.js, Express |
| Database | Supabase |
| Authentication | Supabase Auth |
| Business discovery | OpenStreetMap-based public data sources |

## Application Workflow

1. **Sign in:** Access your personal workspace.
2. **Define your target:** Choose the industry, country, city, and service offering.
3. **Discover prospects:** Search available public business records.
4. **Save and organize:** Store new records and manage existing leads.
5. **Qualify:** Review fit scores and verify business information.
6. **Prepare outreach:** Generate a draft based on known prospect details.
7. **Review and approve:** Edit the draft and decide whether to use it manually.

## Getting Started

### Prerequisites

Install the following before running the application:

- Node.js (use a version compatible with the project's `package.json`).
- npm.
- A Supabase project.
- Git.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/prospect-ai.git
cd prospect-ai
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Install dependencies

If the project uses a root package that installs and runs both frontend and backend:

```bash
npm install
```

If the frontend and backend have separate `package.json` files, install dependencies in each corresponding directory instead.

### 3. Configure environment variables

Create a local `.env` file using the project's `.env.example` as a reference.

Configure the variables required by your application:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the exact variable names expected by your source code. If your project uses a different publishable-key setup, follow its configuration.

**Never commit `.env`, service-role keys, private API keys, or access tokens.** Frontend variables prefixed with `VITE_` are exposed to browser code and must never contain secrets.

### 4. Configure Supabase

1. Create or open your Supabase project.
2. Apply the SQL schema and migrations included in the repository, if available.
3. Configure the required tables, relationships, and Row Level Security policies.
4. Configure authentication and email confirmation settings.
5. Verify that authenticated users can access only their own records.

The application may require tables for leads, lead searches, and outreach drafts. Use the actual schema and migrations provided by the project.

### 5. Start the application

Use the scripts defined in your `package.json`. For example, if the root package defines a combined start script:

```bash
npm run start
```

If frontend and backend run separately, start each using its configured npm script.

Open the local frontend URL shown in your terminal. Check the backend health endpoint if one is configured; the development backend in this project uses `/api/health`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase URL used by the frontend |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable/anon key used by the frontend |
| `SUPABASE_URL` | Supabase URL used by the backend |
| `SUPABASE_ANON_KEY` | Supabase anon key used by the backend |

Additional variables may be required depending on the discovery provider, deployment environment, or future integrations. Check `.env.example` and the application source before deployment.

## Data Sources and Limitations

- Business discovery depends on available public business records.
- Not every business has a website, email address, or complete contact information.
- Duplicate detection depends on the identifiers available to the application.
- Fit scores are prioritization aids, not verified sales predictions.
- Outreach drafts may need editing and factual verification.
- Public data availability, rate limits, and provider policies may affect search results.

Use business data responsibly, respect applicable privacy and data-protection laws, and honor opt-out requests when conducting outreach.

## Security Notes

- Keep private credentials in environment variables.
- Never expose Supabase service-role keys in frontend code.
- Enable and test Row Level Security for user-owned data.
- Validate and authorize all backend requests.
- Review authentication, rate limiting, CORS, and database policies before production deployment.
- Do not send outreach without appropriate review and permission where required.

## Project Status

Prospect AI is an evolving project. Features and integrations may change as discovery quality, qualification, usability, and deployment are improved.

Check the repository's source code and configuration for the current implementation status of individual features.

## Contributing

Contributions, bug reports, and improvement suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Submit a pull request describing the change.

## License

No license has been specified yet. Unless a license is added to this repository, the default copyright rules apply and reuse or redistribution is not automatically permitted.

## Author

**Talha Rauf**

GitHub: [@talhaw-cmd](https://github.com/talhaw-cmd)

---

Built to make prospect research more organized, qualification more transparent, and outreach more thoughtful.