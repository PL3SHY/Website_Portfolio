/* eslint-disable @typescript-eslint/no-explicit-any */
// A small in-memory stand-in for the Supabase database, used by the portfolio demo.
// It understands the slice of the Supabase query API that this app uses (select / insert /
// update / delete / upsert, filters, ordering, ranges, single rows, embedded relations) and it
// can notify "realtime" subscribers. All data lives in memory (and the tab's sessionStorage), so
// every visitor gets their own private copy that can be reset at any time.

import { buildSeed } from './seed';

export type Row = Record<string, any>;
export type Db = Record<string, Row[]>;

const DB_KEY = 'cf-demo-db-v1';
export const SESSION_KEY = 'cf-demo-session-v1';

// ---------- tiny storage wrapper (sessionStorage may be unavailable) ----------
const memory: Record<string, string> = {};
export const store = {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return memory[key] ?? null;
    }
  },
  set(key: string, value: string) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      memory[key] = value;
    }
  },
  del(key: string) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      delete memory[key];
    }
  },
};

export const uid = (): string =>
  (globalThis.crypto as any)?.randomUUID?.() ??
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

const clone = <T,>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

// ---------- the database ----------
function load(): Db {
  const raw = store.get(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* fall through to a fresh seed */
    }
  }
  return buildSeed();
}

let db: Db = load();

function persist() {
  store.set(DB_KEY, JSON.stringify(db));
}

export function getDb(): Db {
  return db;
}

export function resetDb() {
  db = buildSeed();
  persist();
}

// primary key column of each table
const PK: Record<string, string> = {
  users: 'user_id',
  audit_log: 'audit_id',
  parking_slots: 'slot_id',
  support_tickets: 'ticket_id',
  promotions: 'promo_id',
  unit_taxonomy_options: 'option_id',
  site_content: 'content_id',
  app_settings: 'key',
  account_deletion_requests: 'id',
  email_change_requests: 'id',
  guest_parking_requests: 'request_id',
  properties: 'property_id',
  ledger: 'ledger_id',
  media: 'media_id',
};
export const pkOf = (table: string): string =>
  PK[table] ?? table.replace(/ies$/, 'y').replace(/s$/, '') + '_id';

// tables whose rows get a human-friendly public_id when inserted without one
const PUBLIC_PREFIX: Record<string, string> = {
  users: 'USR',
  reservations: 'RES',
  payments: 'PAY',
  ledger: 'LED',
  support_tickets: 'TKT',
  audit_log: 'AUD',
  parking_slots: 'SLT',
  units: 'UNT',
  guest_parking_requests: 'GPR',
};
let publicCounter = 1000 + Math.floor(Math.random() * 500);
const makePublicId = (prefix: string) => `${prefix}-${String(++publicCounter).padStart(5, '0')}`;

// ---------- realtime ----------
type Listener = {
  table: string;
  event: string;
  filter?: string;
  cb: (payload: any) => void;
};
const listeners = new Set<Listener>();

export function addListener(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function passesFilter(filter: string | undefined, row: Row | null) {
  if (!filter) return true;
  if (!row) return false;
  const m = /^([\w]+)=eq\.(.*)$/.exec(filter);
  if (!m) return true;
  return String(row[m[1]]) === m[2];
}

function emit(table: string, eventType: 'INSERT' | 'UPDATE' | 'DELETE', next: Row | null, prev: Row | null) {
  for (const l of [...listeners]) {
    if (l.table !== table) continue;
    if (l.event !== '*' && l.event !== eventType) continue;
    if (!passesFilter(l.filter, next ?? prev)) continue;
    const payload = {
      schema: 'public',
      table,
      commit_timestamp: new Date().toISOString(),
      eventType,
      new: next ? clone(next) : {},
      old: prev ? clone(prev) : {},
      errors: null,
    };
    setTimeout(() => l.cb(payload), 0);
  }
}

// ---------- value helpers ----------
function getVal(row: Row, col: string): any {
  if (!col.includes('->')) return row[col];
  const [head, ...rest] = col.split(/->>?/);
  let cur: any = row[head];
  for (const k of rest) {
    if (cur == null) return null;
    cur = cur[k];
  }
  return cur ?? null;
}

const isNum = (v: any) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && /^-?\d+(\.\d+)?$/.test(v.trim()));

function compare(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (isNum(a) && isNum(b)) return Number(a) - Number(b);
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

const looseEq = (a: any, b: any) => {
  if (b === null || b === undefined) return a === null || a === undefined;
  if (typeof a === 'boolean' || typeof b === 'boolean') return String(a) === String(b);
  return String(a) === String(b);
};

function likeToRegex(pattern: string, caseInsensitive: boolean) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.');
  return new RegExp(`^${escaped}$`, caseInsensitive ? 'i' : '');
}

function parseListValue(v: string): string[] {
  const inner = v.trim().replace(/^\(/, '').replace(/\)$/, '');
  return inner.split(',').map((s) => s.trim().replace(/^"(.*)"$/, '$1'));
}

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

// one PostgREST condition such as  status.eq.pending  ->  predicate
function conditionToPredicate(cond: string): (r: Row) => boolean {
  const and = /^and\((.*)\)$/s.exec(cond);
  if (and) {
    const preds = splitTopLevel(and[1]).map(conditionToPredicate);
    return (r) => preds.every((p) => p(r));
  }
  const m = /^([^.]+)\.(not\.)?([a-z]+)\.(.*)$/s.exec(cond);
  if (!m) return () => true;
  const [, col, neg, op, rawVal] = m;
  const test = opPredicate(op, rawVal);
  return (r) => {
    const res = test(getVal(r, col));
    return neg ? !res : res;
  };
}

function opPredicate(op: string, val: any): (v: any) => boolean {
  switch (op) {
    case 'eq':
      return (v) => looseEq(v, val === 'null' ? null : val);
    case 'neq':
      return (v) => !looseEq(v, val === 'null' ? null : val);
    case 'gt':
      return (v) => v != null && compare(v, val) > 0;
    case 'gte':
      return (v) => v != null && compare(v, val) >= 0;
    case 'lt':
      return (v) => v != null && compare(v, val) < 0;
    case 'lte':
      return (v) => v != null && compare(v, val) <= 0;
    case 'is':
      return (v) =>
        val === 'null' || val === null ? v == null : val === 'true' || val === true ? v === true : v === false;
    case 'in': {
      const list = Array.isArray(val) ? val.map(String) : parseListValue(String(val));
      return (v) => list.includes(String(v));
    }
    case 'like':
    case 'ilike': {
      const re = likeToRegex(String(val), op === 'ilike');
      return (v) => v != null && re.test(String(v));
    }
    case 'cs':
    case 'contains':
      return (v) => containsValue(v, val);
    default:
      return () => true;
  }
}

function containsValue(v: any, want: any): boolean {
  if (typeof want === 'string' && want.startsWith('{') && want.endsWith('}')) want = parseListValue(want.slice(1, -1));
  if (Array.isArray(v) && Array.isArray(want)) return want.every((w) => v.some((x) => String(x) === String(w)));
  if (v && typeof v === 'object' && want && typeof want === 'object') {
    return Object.entries(want).every(([k, x]) => JSON.stringify((v as any)[k]) === JSON.stringify(x));
  }
  return false;
}

// ---------- select projection (columns + embedded relations) ----------
type Embed = { alias: string; table: string; cols: string };

function parseSelect(sel: string | null | undefined): { cols: string[] | null; embeds: Embed[] } {
  if (!sel || sel.trim() === '*') return { cols: null, embeds: [] };
  const items = splitTopLevel(sel);
  const cols: string[] = [];
  const embeds: Embed[] = [];
  let star = false;
  for (const it of items) {
    const m = /^(?:(\w+):)?(\w+)(?:![\w]+)?\s*\(([\s\S]*)\)$/.exec(it);
    if (m) {
      embeds.push({ alias: m[1] ?? m[2], table: m[2], cols: m[3] });
    } else if (it === '*') {
      star = true;
    } else {
      cols.push(it.replace(/\s+/g, ' ').split(':').pop()!.trim());
    }
  }
  return { cols: star ? null : cols, embeds };
}

function pick(row: Row, cols: string[] | null): Row {
  if (!cols) return clone(row);
  const out: Row = {};
  for (const c of cols) if (c in row) out[c] = clone(row[c]);
  return out;
}

function resolveEmbeds(table: string, row: Row, embeds: Embed[]): Row {
  const out: Row = {};
  for (const e of embeds) {
    const other = db[e.table] ?? [];
    const otherPk = pkOf(e.table);
    const thisPk = pkOf(table);
    let related: Row[];
    if (otherPk in row && row[otherPk] != null && otherPk !== thisPk) {
      related = other.filter((o) => String(o[otherPk]) === String(row[otherPk]));
    } else {
      related = other.filter((o) => String(o[thisPk]) === String(row[thisPk]));
    }
    const sub = parseSelect(e.cols);
    out[e.alias] = related.map((r) => pick(r, sub.cols));
  }
  return out;
}


// ---------- derived views ----------
// `admin_customer_overview` is a database view in the real project: customer profiles plus a few
// computed flags. Here it is computed from the live tables each time it is read.
function computeCustomerOverview(): Row[] {
  const today = new Date().toISOString().slice(0, 10);
  const reservations = db.reservations ?? [];
  const requests = db.account_deletion_requests ?? [];
  return (db.users ?? [])
    .filter((u) => u.role === 'client')
    .map((u) => {
      const mine = reservations.filter((r) => r.user_id === u.user_id);
      const live = mine.filter((r) => ['approved', 'confirmed'].includes(r.status));
      const active = live.find((r) => String(r.start_date).slice(0, 10) <= today && String(r.end_date).slice(0, 10) >= today);
      const upcoming = mine.some((r) => ['pending', 'approved', 'confirmed'].includes(r.status) && String(r.start_date).slice(0, 10) > today);
      const unpaid = mine.some(
        (r) =>
          ['approved', 'confirmed', 'overdue', 'completed'].includes(r.status) &&
          Number(r.amount_due ?? r.total_amount ?? 0) - Number(r.paid_amount ?? 0) > 0.005
      );
      const deletion = [...requests].filter((q) => q.user_id === u.user_id).sort((a, b) => compare(b.requested_at, a.requested_at))[0];
      return {
        ...u,
        has_active_occupancy: Boolean(active),
        active_unit_name: active?.title ?? null,
        active_unit_type: active?.unit_type ?? null,
        active_since: active?.start_date ?? null,
        has_upcoming_reservation: upcoming,
        has_unpaid_balance: unpaid,
        deletion_status: deletion?.status ?? null,
        deletion_request_reason: deletion?.request_reason ?? null,
      };
    });
}

// ---------- the query builder ----------
type Result = { data: any; error: any; count?: number | null; status?: number; statusText?: string };

class Builder implements PromiseLike<Result> {
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private selectCols: string | null = null;
  private selectOpts: any = {};
  private payload: any = null;
  private upsertOpts: any = {};
  private filters: ((r: Row) => boolean)[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private limitN: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private mode: 'many' | 'single' | 'maybe' = 'many';

  constructor(private table: string) {}

  select(cols?: string, opts?: any) {
    this.selectCols = cols ?? '*';
    this.selectOpts = opts ?? {};
    return this;
  }
  insert(rows: any) {
    this.op = 'insert';
    this.payload = rows;
    return this;
  }
  update(patch: any) {
    this.op = 'update';
    this.payload = patch;
    return this;
  }
  upsert(rows: any, opts?: any) {
    this.op = 'upsert';
    this.payload = rows;
    this.upsertOpts = opts ?? {};
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }

  private addOp(col: string, op: string, val: any, negate = false) {
    const test = opPredicate(op, val);
    this.filters.push((r) => (negate ? !test(getVal(r, col)) : test(getVal(r, col))));
    return this;
  }
  eq(col: string, val: any) {
    return this.addOp(col, 'eq', val);
  }
  neq(col: string, val: any) {
    return this.addOp(col, 'neq', val);
  }
  gt(col: string, val: any) {
    return this.addOp(col, 'gt', val);
  }
  gte(col: string, val: any) {
    return this.addOp(col, 'gte', val);
  }
  lt(col: string, val: any) {
    return this.addOp(col, 'lt', val);
  }
  lte(col: string, val: any) {
    return this.addOp(col, 'lte', val);
  }
  in(col: string, vals: any[]) {
    return this.addOp(col, 'in', vals);
  }
  is(col: string, val: any) {
    return this.addOp(col, 'is', val);
  }
  like(col: string, val: string) {
    return this.addOp(col, 'like', val);
  }
  ilike(col: string, val: string) {
    return this.addOp(col, 'ilike', val);
  }
  contains(col: string, val: any) {
    return this.addOp(col, 'contains', val);
  }
  not(col: string, op: string, val: any) {
    return this.addOp(col, op, val, true);
  }
  match(obj: Record<string, any>) {
    for (const [k, v] of Object.entries(obj)) this.eq(k, v);
    return this;
  }
  filter(col: string, op: string, val: any) {
    return this.addOp(col, op, val);
  }
  or(expr: string) {
    const preds = splitTopLevel(expr).map(conditionToPredicate);
    this.filters.push((r) => preds.some((p) => p(r)));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }
  single() {
    this.mode = 'single';
    return this;
  }
  maybeSingle() {
    this.mode = 'maybe';
    return this;
  }
  returns() {
    return this;
  }
  abortSignal() {
    return this;
  }

  // ---- execution ----
  private finish(rows: Row[], count?: number | null): Result {
    const parsed = parseSelect(this.selectCols);
    const out = rows.map((r) => ({ ...pick(r, parsed.cols), ...resolveEmbeds(this.table, r, parsed.embeds) }));
    if (this.mode === 'single') {
      if (out.length !== 1) {
        return {
          data: null,
          error: {
            code: 'PGRST116',
            message: 'JSON object requested, multiple (or no) rows returned',
            details: `The result contains ${out.length} rows`,
            hint: null,
          },
        };
      }
      return { data: out[0], error: null, count };
    }
    if (this.mode === 'maybe') {
      if (out.length > 1) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: null, hint: null },
        };
      }
      return { data: out[0] ?? null, error: null, count };
    }
    return { data: out, error: null, count };
  }

  private run(): Result {
    const rows = this.table === 'admin_customer_overview' ? computeCustomerOverview() : (db[this.table] ??= []);
    const matches = () => rows.filter((r) => this.filters.every((f) => f(r)));

    if (this.op === 'insert' || this.op === 'upsert') {
      const list: Row[] = Array.isArray(this.payload) ? this.payload : [this.payload];
      const created: Row[] = [];
      const now = new Date().toISOString();
      const pk = pkOf(this.table);
      for (const incoming of list) {
        const conflictCols: string[] = (this.upsertOpts.onConflict ?? pk).split(',').map((s: string) => s.trim());
        if (this.op === 'upsert') {
          const existing = rows.find((r) => conflictCols.every((c) => looseEq(r[c], incoming[c])));
          if (existing) {
            const prev = clone(existing);
            Object.assign(existing, clone(incoming));
            created.push(existing);
            emit(this.table, 'UPDATE', existing, prev);
            continue;
          }
        }
        if (this.table === 'users' && incoming.email) {
          const dupe = rows.find((r) => String(r.email).toLowerCase() === String(incoming.email).toLowerCase());
          if (dupe) {
            return {
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint "users_email_key"', details: null, hint: null },
            };
          }
        }
        const row: Row = { ...clone(incoming) };
        if (row[pk] === undefined && pk !== 'key') row[pk] = uid();
        if (row.created_at === undefined) row.created_at = now;
        const prefix = PUBLIC_PREFIX[this.table];
        if (prefix && row.public_id === undefined) row.public_id = makePublicId(prefix);
        rows.push(row);
        created.push(row);
        emit(this.table, 'INSERT', row, null);
      }
      persist();
      return this.selectCols === null ? { data: null, error: null, status: 201 } : this.finish(created);
    }

    if (this.op === 'update') {
      const targets = matches();
      for (const row of targets) {
        const prev = clone(row);
        Object.assign(row, clone(this.payload));
        if ('updated_at' in prev && !('updated_at' in this.payload)) row.updated_at = new Date().toISOString();
        emit(this.table, 'UPDATE', row, prev);
      }
      persist();
      return this.selectCols === null ? { data: null, error: null, status: 204 } : this.finish(targets);
    }

    if (this.op === 'delete') {
      const targets = matches();
      db[this.table] = rows.filter((r) => !targets.includes(r));
      for (const row of targets) emit(this.table, 'DELETE', null, row);
      persist();
      return this.selectCols === null ? { data: null, error: null, status: 204 } : this.finish(targets);
    }

    // select
    let found = matches();
    const total = found.length;
    for (const o of [...this.orders].reverse()) {
      found = [...found].sort((a, b) => (o.asc ? 1 : -1) * compare(getVal(a, o.col), getVal(b, o.col)));
    }
    if (this.rangeFrom !== null && this.rangeTo !== null) found = found.slice(this.rangeFrom, this.rangeTo + 1);
    if (this.limitN !== null) found = found.slice(0, this.limitN);
    if (this.selectOpts?.head) {
      return { data: null, error: null, count: total };
    }
    return this.finish(found, this.selectOpts?.count ? total : null);
  }

  then<R1 = Result, R2 = never>(
    onfulfilled?: ((value: Result) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    return Promise.resolve()
      .then(() => this.run())
      .then(onfulfilled, onrejected);
  }
}

export function from(table: string) {
  return new Builder(table);
}

// ---------- auth session helpers (used by the mock client and the demo bar) ----------
export type DemoSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: 'bearer';
  user: Row;
};

export function buildAuthUser(account: Row): Row {
  const profile = (db.users ?? []).find((u) => u.user_id === account.id);
  return {
    id: account.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: account.email,
    email_confirmed_at: new Date().toISOString(),
    created_at: profile?.created_at ?? new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { first_name: profile?.first_name ?? '', last_name: profile?.last_name ?? '' },
    identities: [{ provider: 'email', identity_id: account.id }],
  };
}

export function makeSession(account: Row): DemoSession {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: `demo-token-${account.id}`,
    refresh_token: `demo-refresh-${account.id}`,
    expires_in: 86400,
    expires_at: now + 86400,
    token_type: 'bearer',
    user: buildAuthUser(account),
  };
}

export function readSession(): DemoSession | null {
  const raw = store.get(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function writeSession(s: DemoSession | null) {
  if (s) store.set(SESSION_KEY, JSON.stringify(s));
  else store.del(SESSION_KEY);
}

export function authAccounts(): Row[] {
  return (db.__auth_users ??= []);
}
