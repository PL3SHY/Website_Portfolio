# Commerciales Flores: portfolio demo

This folder is the source of the interactive demo shown on the portfolio site (the "try it live" popup
on the Commerciales Flores card).

**What it is:** the front end of the Commerciales Flores rental-management project (a Software Engineering I
team project, front end built by my teammates, who agreed to its use here), running on sample data. The real
Supabase backend is replaced by a small in-memory one, so everything runs in the browser and nothing is real.

**My additions** are in `src/demo/`:

| File | What it does |
|---|---|
| `engine.ts` | An in-memory database that understands the part of the Supabase query API this app uses, plus fake realtime updates and a computed customer overview |
| `backend.ts` | Ports of the real payment (`create-payment-and-ledger`) and refund (`issue-refund`) functions, plus simple stand-ins for the other server functions |
| `mockSupabase.ts` | The stand-in Supabase client: login, storage, realtime, function calls |
| `seed.ts` | Made-up sample data (people, spaces, bookings, payments, tickets, content) |
| `install.ts` | Answers the app's few raw `fetch` calls to the backend |
| `enter.ts` | Entering the demo as the sample client or admin, and resetting the data (used by the entry page and the "Reset demo" buttons in the portal headers) |

The login and sign-up pages are replaced by `src/pages/demo/DemoEntry.tsx`.

**Rebuild** (from the portfolio root): `npm run demo:build`. This builds the demo and copies it to
`public/demos/commerciales-flores`, which is what the site serves.

The original, unmodified project is the team's repository: https://github.com/averageCoder-byte/Comerciales-Flores

Note: README.md and SETUP.md in this folder are the original project's own documents (unchanged).

## Differences from the original project

- Left out of the demo: the admin **Promos**, **Content** and **Profile** pages (they are not needed to show the system and made the admin menu too wide for the popup).
- Added: **Switch to client / admin** and **Reset demo** buttons in the portal headers, and the entry page instead of login and sign-up.
- Fixed in the copy: the **Block / Unblock** button in the admin inquiries chat never changed state, because the contact list did not carry over the "messaging blocked" flag (`src/pages/admin/Inquiries.tsx`). The original project has the same bug.
