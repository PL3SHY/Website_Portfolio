/* eslint-disable @typescript-eslint/no-explicit-any */
// Drop-in replacement for the Supabase client (what `supabaseClient.ts` normally exports).
// Everything runs in the browser against the in-memory database in ./engine.

import {
  addListener,
  authAccounts,
  from,
  getDb,
  makeSession,
  readSession,
  uid,
  writeSession,
  type DemoSession,
} from './engine';
import { handleFunction, handleRpc } from './backend';

// ---------- auth ----------
type AuthCb = (event: string, session: DemoSession | null) => void;
const authListeners = new Set<AuthCb>();
const notify = (event: string, session: DemoSession | null) =>
  authListeners.forEach((cb) => setTimeout(() => cb(event, session), 0));

const authError = (message: string, status = 400) => ({ message, status, name: 'AuthApiError' });
const findAccount = (email: string) =>
  authAccounts().find((a) => String(a.email).toLowerCase() === String(email).trim().toLowerCase());

const auth = {
  async getSession() {
    return { data: { session: readSession() }, error: null };
  },
  async getUser() {
    const s = readSession();
    return s
      ? { data: { user: s.user }, error: null }
      : { data: { user: null }, error: { message: 'Auth session missing!', name: 'AuthSessionMissingError', status: 400 } };
  },
  async refreshSession() {
    const s = readSession();
    return { data: { session: s, user: s?.user ?? null }, error: null };
  },
  async setSession() {
    const s = readSession();
    return { data: { session: s, user: s?.user ?? null }, error: null };
  },
  onAuthStateChange(cb: AuthCb) {
    authListeners.add(cb);
    setTimeout(() => cb('INITIAL_SESSION', readSession()), 0);
    return { data: { subscription: { unsubscribe: () => authListeners.delete(cb) } } };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const acct = findAccount(email);
    if (!acct || acct.password !== password) {
      return { data: { user: null, session: null }, error: authError('Invalid login credentials') };
    }
    const session = makeSession(acct);
    writeSession(session);
    notify('SIGNED_IN', session);
    return { data: { user: session.user, session }, error: null };
  },
  async signOut() {
    writeSession(null);
    notify('SIGNED_OUT', null);
    return { error: null };
  },
  async signUp({ email, password, options }: any) {
    if (findAccount(email)) {
      // same shape Supabase uses to say "this email is already registered"
      return { data: { user: { id: uid(), email, identities: [] }, session: null }, error: null };
    }
    const id = uid();
    const acct = { id, email: String(email).trim().toLowerCase(), password };
    authAccounts().push(acct);
    const meta = options?.data ?? {};
    const exists = getDb().users?.some((u) => u.user_id === id);
    if (!exists) {
      await from('users').insert({
        user_id: id,
        email: acct.email,
        first_name: meta.first_name ?? '',
        last_name: meta.last_name ?? '',
        phone: meta.phone ?? '',
        address: meta.address ?? '',
        role: 'client',
        is_active: true,
        has_password: true,
        phone_verified: false,
        address_confirmed: false,
        valid_id_status: 'not_submitted',
      });
    }
    const session = makeSession(acct);
    writeSession(session);
    notify('SIGNED_IN', session);
    return { data: { user: session.user, session }, error: null };
  },
  async updateUser({ password }: any) {
    const s = readSession();
    if (!s) return { data: { user: null }, error: authError('Auth session missing!') };
    if (password) {
      const acct = authAccounts().find((a) => a.id === s.user.id);
      if (acct) acct.password = password;
    }
    return { data: { user: s.user }, error: null };
  },
  async resetPasswordForEmail() {
    return { data: {}, error: null };
  },
  async getUserIdentities() {
    const s = readSession();
    return { data: { identities: s?.user?.identities ?? [] }, error: null };
  },
  async signInWithOAuth() {
    return { data: { provider: null, url: null }, error: authError('Social sign-in is turned off in this demo.') };
  },
  async linkIdentity() {
    return { data: { provider: null, url: null }, error: authError('Linking accounts is turned off in this demo.') };
  },
  async unlinkIdentity() {
    return { data: null, error: authError('Unlinking accounts is turned off in this demo.') };
  },
};

// ---------- storage (files are kept in memory as blob URLs) ----------
const files = new Map<string, string>(); // `${bucket}/${path}` -> url

function bucket(name: string) {
  const urlFor = (path: string) => {
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    return files.get(`${name}/${path}`) ?? `https://placehold.co/800x600?text=${encodeURIComponent(path.split('/').pop() ?? 'file')}`;
  };
  return {
    async upload(path: string, file: any) {
      try {
        if (file instanceof Blob) files.set(`${name}/${path}`, URL.createObjectURL(file));
      } catch {
        /* ignore */
      }
      return { data: { path, id: uid(), fullPath: `${name}/${path}` }, error: null };
    },
    async remove(paths: string[]) {
      for (const p of paths) files.delete(`${name}/${p}`);
      return { data: paths.map((p) => ({ name: p })), error: null };
    },
    getPublicUrl(path: string) {
      return { data: { publicUrl: urlFor(path) } };
    },
    async createSignedUrl(path: string) {
      return { data: { signedUrl: urlFor(path) }, error: null };
    },
    async createSignedUrls(paths: string[]) {
      return { data: paths.map((p) => ({ path: p, signedUrl: urlFor(p), error: null })), error: null };
    },
    async download(path: string) {
      try {
        const res = await fetch(urlFor(path));
        return { data: await res.blob(), error: null };
      } catch {
        return { data: null, error: { message: 'File not available in the demo.' } };
      }
    },
    async list() {
      return { data: [], error: null };
    },
  };
}

// ---------- realtime ----------
class Channel {
  private defs: { filter: any; cb: (p: any) => void }[] = [];
  private offs: Array<() => void> = [];
  constructor(public topic: string) {}
  on(type: string, filter: any, cb: (p: any) => void) {
    if (type === 'postgres_changes') this.defs.push({ filter, cb });
    return this;
  }
  subscribe(cb?: (status: string, err?: unknown) => void) {
    for (const d of this.defs) {
      this.offs.push(addListener({ table: d.filter.table, event: d.filter.event ?? '*', filter: d.filter.filter, cb: d.cb }));
    }
    if (cb) setTimeout(() => cb('SUBSCRIBED'), 0);
    return this;
  }
  unsubscribe() {
    this.offs.forEach((off) => off());
    this.offs = [];
    return Promise.resolve('ok');
  }
  send() {
    return Promise.resolve('ok');
  }
}
const channels = new Set<Channel>();

// ---------- the client ----------
const supabase: any = {
  from,
  rpc(name: string, args?: Record<string, any>) {
    const promise = handleRpc(name, args);
    const thenable: any = {
      then: (a: any, b: any) => promise.then(a, b),
      single: () => thenable,
      maybeSingle: () => thenable,
    };
    return thenable;
  },
  auth,
  functions: {
    async invoke(name: string, opts: { body?: any; headers?: Record<string, string> } = {}) {
      const r = await handleFunction(name, opts.body ?? {}, opts.headers ?? {});
      if (r.status >= 400) {
        const err: any = new Error(r.body?.error ?? 'Request failed');
        err.context = new Response(JSON.stringify(r.body), { status: r.status });
        return { data: null, error: err };
      }
      return { data: r.body, error: null };
    },
  },
  storage: { from: bucket },
  channel(topic: string) {
    const ch = new Channel(topic);
    channels.add(ch);
    return ch;
  },
  removeChannel(ch: Channel) {
    channels.delete(ch);
    return ch.unsubscribe();
  },
  removeAllChannels() {
    const all = [...channels];
    channels.clear();
    return Promise.all(all.map((c) => c.unsubscribe()));
  },
  getChannels() {
    return [...channels];
  },
};

export default supabase;
