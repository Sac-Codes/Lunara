# Lunara

**A calm, personal space for daily reflection, journaling, and self-awareness.**

**Live app:** [Open Lunara](https://lunara-hljzhw3kz-sac6.vercel.app/login)

**Release marker:** `v1.0.0` Git tag

Lunara helps people record how a day feels, write private reflections, revisit patterns over time, and explore Bhagavad Gita wisdom. The app is designed for personal reflection; it is not medical or mental-health care.

> **Version note:** The repository contains a `v1.0.0` Git tag. The private app package still reports version `0.0.0` in [package.json](./package.json); it is not published as an npm package.

## Contents

- [Features](#features)
- [Application architecture](#application-architecture)
- [Technology](#technology)
- [Repository layout](#repository-layout)
- [Run locally](#run-locally)
- [Available scripts](#available-scripts)
- [Routes](#routes)
- [Data, privacy, and authorization](#data-privacy-and-authorization)
- [Database migrations](#database-migrations)
- [Progressive Web App and offline behavior](#progressive-web-app-and-offline-behavior)
- [Deployment](#deployment)
- [Validation and known limitations](#validation-and-known-limitations)
- [Contributing](#contributing)
- [License](#license)

## Features

### Member experience

- **Daily check-ins** for mood, energy, other reflection measures, and optional notes.
- **Private journals** with dated entries and tags.
- **Calendar and insights** for revisiting check-ins and observing personal patterns.
- **Wisdom library** with published Bhagavad Gita passages and related explanations.
- **Saved wisdom** bookmarks that belong to the individual account.
- **Affirmations** and personal favorites.
- **In-app notifications** and notification preferences.
- **Profile and appearance settings**, including light and dark themes.
- **Responsive layouts** for desktop and mobile, with an installable PWA experience.

Authenticated check-ins, journals, preferences, bookmarks, and notifications use the configured Supabase project. Shared Wisdom and affirmation content is stored separately from personal bookmarks.

### Administration

The Admin workspace provides an account directory, selected-account record viewing and export, shared-content management, notifications, and an audit log. Admin routes are protected by the verified account role, while database policies and functions enforce access to protected data.

Current product limits:

- The authenticated directory is capped at **500 accounts**. Search and role filtering apply to the accounts loaded by the directory.
- The authenticated client does not provide production invitations, account suspension, role editing, email addresses, or last-sign-in details.
- Admin check-in parameter and workspace configuration controls are Preview-only.
- Admin notification broadcasts use the loaded directory, so they are subject to its 500-account cap. Notifications are in-app; web push delivery is not implemented.

### Preview Member

Preview Member is a simulated experience for trying the interface without creating a real account. Its sample users and demo records are kept in browser-local state/storage and do not become Supabase accounts or shared cloud content. Preview data is separate from authenticated users' cloud data.

## Application architecture

```text
Browser
├── React application and route guards
├── AuthProvider ─────────────── Supabase Auth
├── Feature services ─────────── Supabase client
│                               └── PostgreSQL, RLS, database functions/triggers
└── PWA service worker ───────── cached application assets and web fonts
```

- Authentication uses Supabase email/password sessions. The app loads a user's role from the database rather than trusting a client-supplied role.
- Feature services separate Supabase operations from the React pages and provider state.
- Private records are scoped to their owner by database policies. Admin record-view and export operations are designed to authorize and write an audit event before returning data.
- Preview Member uses simulated identity and local demo data. It does not write to Supabase.

## Technology

The application is built with:

- React 19 and TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Supabase JavaScript client, Supabase Auth, and PostgreSQL
- Recharts and Lucide icons
- `vite-plugin-pwa` and Workbox

Vite 8 requires Node.js `^20.19.0` or `>=22.12.0`. The app uses a browser-safe Supabase publishable/anon key; a service-role key must never be placed in frontend environment variables.

## Repository layout

```text
.
├── public/                 PWA icons and public assets
├── src/
│   ├── assets/             Artwork and other bundled assets
│   ├── components/         Shared UI and route guards
│   ├── data/               Bundled content and Preview datasets
│   ├── hooks/              Reusable React hooks
│   ├── layouts/            Member and Admin application shells
│   ├── lib/                Supabase client and shared utilities
│   ├── pages/              Member and Admin routes
│   ├── providers/          Authentication and application state
│   ├── services/           Authenticated data access
│   └── types/              Domain and database types
├── supabase/
│   └── migrations/         Ordered PostgreSQL schema and policy changes
├── .env.example
├── package.json
├── vercel.json
└── vite.config.ts
```

## Run locally

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- A Supabase project for authenticated/cloud features

### Setup

```bash
git clone https://github.com/Sac-Codes/Lunara.git
cd Lunara
npm ci
```

Create a local `.env.local` file in the repository root:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key

# Optional. Use the app origin, without a route such as /login.
VITE_APP_URL=http://localhost:3000
```

Then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add the local and deployed app URLs to the Supabase Auth redirect allow list as appropriate for the project.

The two `VITE_SUPABASE_*` variables are required for cloud authentication and data. `VITE_APP_URL` is optional; when omitted, auth redirects use the current browser origin. Vite variables are included in browser code, so only use the Supabase publishable/anon key here—never a service-role or other secret key.

The checked-in [.env.example](./.env.example) also contains legacy Gemini/API template variables that the current application source does not consume. The active app configuration is listed above. `.env.local` is ignored by Git.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 3000. |
| `npm run lint` | Run TypeScript checking with `tsc --noEmit`; this is not an ESLint command. |
| `npm run build` | Create the production build in `dist/`. |
| `npm run preview` | Serve the production build locally for a preview. |
| `npm run clean` | Remove `dist/` and `server.js`. The script uses `rm -rf`, which may require a Unix-like shell on Windows. |

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Sign in, create an account, or enter Preview Member. |
| `/` | Home and daily reflection overview. |
| `/check-in` | Create or review check-ins. |
| `/journal` | Personal journal entries. |
| `/calendar` | Calendar view of recorded days. |
| `/insights` | Personal reflection summaries. |
| `/wisdom` | Shared Wisdom library and personal bookmarks. |
| `/notifications` | In-app notification inbox and preferences. |
| `/settings` | Profile, appearance, and personal preferences. |
| `/admin/*` | Role-protected Admin workspace. |

Unauthenticated users are sent to login for protected routes. Users without the verified Admin role cannot enter the Admin workspace.

## Data, privacy, and authorization

- Authenticated personal records are stored in the configured Supabase project and protected by PostgreSQL row-level security (RLS).
- `saved_wisdom` represents a user's personal bookmark relationship; it is not the shared Wisdom library.
- Shared Wisdom and affirmations have their own content tables. Member visibility is intended to be limited to published content, while verified Admins can manage drafts and shared content.
- The source and migrations implement fixed-purpose, audited Admin operations for selected-user record viewing and export preparation. Audit metadata records action/resource information rather than journal prose or check-in notes.
- Preview Member uses local demo state/storage and is not a cloud account.

These are implementation details, not confirmation of the live Supabase project's current migration state. See [SECURITY-REVIEW.md](./SECURITY-REVIEW.md) and check the target project's migration history and Auth/RLS configuration before relying on production Admin protections.

## Database migrations

The ordered SQL files are in [supabase/migrations](./supabase/migrations/):

1. `20261127000001_initial_schema.sql` — initial application schema.
2. `20261127000002_rls_and_security.sql` — row-level security and foundational policies.
3. `20261127000003_admin_read_access.sql` — initial verified-Admin access policies.
4. `20261127000004_shared_wisdom_library.sql` — shared Wisdom content.
5. `20261127000005_admin_audit_and_affirmations.sql` — audit and affirmation database support.
6. `20261127000006_admin_audit_integrity_and_wisdom_visibility.sql` — audited Admin access and published-only member Wisdom visibility.

Migrations are not applied by the Vite build or Vercel deployment. The latest repository security review records migrations `000005` and `000006` as **not applied at the time of that review**, and live database behavior as unverified. Check the actual Supabase migration history before applying anything; apply only the missing migrations, in order, through the project's approved database workflow. Do not infer the live schema from files present in this repository.

## Progressive Web App and offline behavior

The PWA includes an installable manifest, an auto-updating service worker, cached application build assets, and runtime caching for Google Fonts. The app also shows online/offline status.

This is **not full offline data access or offline synchronization**. Authenticated reads and writes depend on Supabase connectivity; personal cloud records are not made available offline by the service worker. Preview data is local to the browser.

## Deployment

The current hosted app is available at [lunara-hljzhw3kz-sac6.vercel.app/login](https://lunara-hljzhw3kz-sac6.vercel.app/login). [vercel.json](./vercel.json) provides an SPA rewrite so client-side routes can load directly. The production build output is `dist/`.

For a Vercel deployment:

1. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Vercel project environment settings.
2. Set `VITE_APP_URL` to the deployed app origin if an explicit auth redirect origin is needed (for example, `https://lunara-hljzhw3kz-sac6.vercel.app`, without `/login`).
3. Configure the matching URLs in Supabase Auth.
4. Verify database migrations and RLS separately; deploying frontend assets does not deploy SQL migrations.

## Validation and known limitations

- There is no `test` script or automated test suite in the current package configuration.
- `npm run lint` is a TypeScript check, not a full lint-rule suite.
- Production cloud behavior depends on the external Supabase project's configuration and applied migrations; a successful frontend build does not verify live database security.
- The current Admin account directory is limited to 500 records. Account invitations, suspension, role editing, and account-status/last-login details are not available in the authenticated client.
- Some Admin parameter/configuration controls remain Preview-only. A few screens also retain prototype-oriented explanatory copy even where authenticated data services exist.
- The build has previously completed with non-blocking Vite config-loader and large-chunk warnings; those warnings do not establish or invalidate database behavior.
- No root `LICENSE` file is present. No license for reuse should be assumed.

## Contributing

Before proposing a change, confirm its scope and preserve the separation between Preview data and authenticated Supabase data. For code changes, run:

```bash
npm run lint
npm run build
git diff --check
```

Please include a concise description of the change and any relevant manual verification steps in a pull request.

## License

This repository does not currently contain a root license file. Contact the repository owner regarding permissions to use or redistribute the project.
