# HisabKhata Project Handover

## Project overview

HisabKhata is a bilingual (Bengali/English) bookkeeping dashboard for small
businesses in Bangladesh. The current frontend is a visual Phase 01 preview;
transaction and summary values come from static demo data rather than a
database or live API.

## Architecture and key files

- Frontend: React 19, Vite 8, Tailwind CSS 4, and `lucide-react`.
- `src/main.jsx` mounts the app; `src/App.jsx` composes the dashboard layout,
  navigation, and preview modal.
- `src/context/AppContext.jsx` manages language, theme, navigation, and modal
  state. `src/locales/` contains Bengali and English translations.
- `src/features/dashboard/` contains dashboard cards, quick actions, and the
  recent-activity and due-preview surfaces. `src/lib/demoData.js` supplies
  static sample records.
- Backend: isolated Express 4 service in `backend/src/server.js`; its only API
  route is `GET /api/health`.
- The frontend and backend are not currently connected. No database, user
  authentication, authorization, or customer/sales endpoints are implemented.

## Verified phase and implementation status

- The backend README marks Phase 01 as the current scaffold. It lists MongoDB,
  user/store schemas, inventory, and ledger models under planned Phase 02, and
  statements/PDF generation under planned Phase 03.
- The frontend currently demonstrates the dashboard, theme/language
  preferences, navigation, and preview interactions. It is not a persistent
  bookkeeping application.
- The root dependency conflict was fixed by aligning `esbuild` with Vite 8's
  peer requirement. The root `package-lock.json` was generated to lock the
  resolved install.

## Verification performed

Environment at verification: Node.js 22.15.0 and npm 11.13.0.

- `npm install` — passed after the esbuild version change.
- `npm run build` — passed; Vite produced the production bundle.
- `npm run dev` — Vite started, and `http://127.0.0.1:3000` returned HTTP 200.
- `npm --prefix backend start` — backend started, and
  `http://127.0.0.1:5001/api/health` returned HTTP 200 with status `ok`.
- `npm run lint` — failed: it invokes `tsc --noEmit`, but the repository has no
  `tsconfig.json`; TypeScript printed command help and exited unsuccessfully.
- No test script or test files were found in the project manifests/current
  project structure.

## Known issues and constraints

- The root `lint` script does not match this JavaScript/JSX project as currently
  configured. Decide on a suitable lint/type-check setup before treating lint
  as a valid check.
- `README.md` still describes the project as an AI Studio app and instructs
  developers to configure `GEMINI_API_KEY`; no Gemini API usage or frontend
  connection to the backend was found in `src/` or `backend/src/`.
- `npm run clean` uses `rm -rf`, which may not work in the documented Windows
  environment; this script has not been tested.
- `.env.example` contains placeholders only. Do not replace or expose actual
  local environment values. Backend startup succeeded without requiring
  secrets.
- `package.json` and the new `package-lock.json` are uncommitted changes from
  the dependency fix. Preserve them.

## Exact next steps

1. Repair the lint/check workflow so it accurately supports the existing
   JavaScript/JSX project, then verify the command.
2. Clarify the product and data requirements for Phase 02 before selecting or
   configuring a database and designing auth/data models.
3. Implement the backend models and API in the documented phase order, then
   connect the frontend only to implemented backend behavior; replace demo
   values as the corresponding real workflows become available.
4. Add focused tests for backend routes and any implemented bookkeeping
   workflows.

## Resume commands

From the repository root:

```powershell
npm install
npm run dev
```

Run the backend separately from the root:

```powershell
npm --prefix backend start
```

The frontend defaults to port 3000 and the backend defaults to port 5001.
