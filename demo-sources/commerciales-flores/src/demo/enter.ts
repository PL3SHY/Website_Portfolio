// Shared by the demo entry page, the landing page header and the floating demo bar:
// sign in as one of the two sample accounts, or reset all sample data.

import { authAccounts, makeSession, resetDb, writeSession } from './engine';

export type DemoRole = 'client' | 'admin';

const TARGETS: Record<DemoRole, { email: string; route: string }> = {
  client: { email: 'client@demo.test', route: '#/client/dashboard' },
  admin: { email: 'admin@demo.test', route: '#/admin/dashboard' },
};

// The app remembers the signed-in person in this tab and refuses to continue as someone else, so
// when switching roles everything except the demo database is cleared first.
function clearAppState() {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (!key.startsWith('cf-demo-db')) sessionStorage.removeItem(key);
    }
  } catch {
    /* sessionStorage unavailable: nothing to clear */
  }
}

export function enterAs(role: DemoRole) {
  const { email, route } = TARGETS[role];
  const account = authAccounts().find((a) => a.email === email);
  if (!account) return;
  clearAppState();
  writeSession(makeSession(account));
  window.location.hash = route;
  window.location.reload();
}

export function resetDemo() {
  resetDb();
  clearAppState();
  writeSession(null);
  window.location.hash = '#/';
  window.location.reload();
}

// Used by the "Reset demo" buttons in the portal headers.
export function confirmAndReset() {
  if (window.confirm('Reset all demo data back to the start?')) resetDemo();
}
