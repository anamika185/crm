# Personal CRM

A personal, local-first sales CRM. It runs entirely on your own machine — no login, no accounts,
no cloud. Data is stored in a local SQLite database file.

## Start the app

One command:

```bash
npm start
```

Then open **http://localhost:5173** in your browser.

On the very first run, `npm start` installs dependencies and builds the app automatically, so it
may take a minute. After that it starts in seconds. The app launches pre-loaded with realistic
sample data, so every screen looks alive immediately.

The app is a dev-container / VS Code friendly local web server. If you're running it inside a
container, make sure port **5173** is mapped to your host computer, then open
`http://localhost:5173` on the host.

## What's inside

Five sections in the main navigation:

- **Dashboard** — how sales are going: deals won per month, revenue won per month, a pipeline
  visualization with expected revenue, recent activity, and upcoming / overdue follow-up tasks.
- **Organizations** — the companies you do business with. Search, add, edit, delete, and open each
  one to see its contacts and deals.
- **Contacts** — the people you deal with. Search, filter by status (lead / qualified / customer),
  add, edit, delete. Open a contact to see their organization and an activity timeline.
- **Deals** — the potential sales you're working on. Stage, value, probability and close date for
  each. Add, edit, delete, search.
- **Pipeline** — your sales pipeline as a board, one column per stage
  (New → Qualified → Proposal → Negotiation → Won → Lost). Drag a deal card between columns to
  change its stage; column totals and expected revenue update automatically.

From any contact or deal you can log an activity (note, call or email) and optionally give it a
follow-up due date. Due-dated activities appear as tasks on the dashboard and can be marked done.

## Development

```bash
npm install        # install dependencies
npm run dev        # run the app in dev mode (hot reload) — http://localhost:5173
npm run build      # type-check and build for production
npm run typecheck  # type-check only
npm test           # run the unit tests
```

`npm run dev` runs the Vite dev server on **5173** and the API server on **3001** (the dev server
proxies `/api` requests to it). `npm start` runs a single production server on **5173** that serves
both the UI and the API.

## Where data lives

All records are stored in a local SQLite database file at `data/crm.sqlite`. It's created and
seeded with sample data the first time the app runs. Deleting that file resets the app to its
factory sample data.

## Tech

Vite + React + TypeScript, Express, SQLite (better-sqlite3), TanStack Table, @dnd-kit, Recharts,
Lucide icons. Unit tests use Vitest with Testing Library.