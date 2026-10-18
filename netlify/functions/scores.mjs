// Rage Queue global leaderboard. Netlify Function (v3.0) + Netlify Blobs.
//   GET  /api/scores            -> { rows: top 50 all-time }
//   GET  /api/scores?seed=12345 -> { rows: top 50 for that seed }
//   GET  /api/scores?daily=1 -> { rows: today's top 5, day, seed, resetAt }
// Daily refreshes at 00:00 UTC with a NEW day-keyed leaderboard.
//   POST /api/scores            -> submit { id,name,score,t,d,c,e,seed,hell,mp }
// Honour-system board: the server checks that a score is plausible, not that it was earned.
// CORS is open so the itch.io build (served from itch's CDN) can read and post scores.
import { getStore } from '@netlify/blobs';

export const config = { path: '/api/scores' };

const KEEP_ALL = 100, KEEP_SEED = 50, KEEP_DAILY = 50, SHOW = 50;
const MAX_SEED = 0x3fffffff + 1;
const ENDS = new Set(['id', 'thursday', 'offline', 'bfg', 'lunch', 'dnf']);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400'
};

const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { ...CORS, 'content-type': 'application/json', 'cache-control': 'no-store' }
});
const int = (v, lo, hi) => { v = Math.round(Number(v)); return Number.isFinite(v) && v >= lo && v <= hi ? v : null; };

// Mirror the deterministic browser seed algorithm exactly, but trust server UTC.
function h32(...args) {
  let h = 2166136261;
  for (const a of args) {
    for (const ch of String(a)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    h ^= 0x9e; h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12;
  return h >>> 0;
}
const utcDay = () => new Date().toISOString().slice(0, 10);
const dailySeed = day => h32('daily', day) % MAX_SEED;
const nextUtcMidnight = day => Date.parse(day + 'T00:00:00Z') + 86400000;

function clean(b) {
  if (!b || typeof b !== 'object') return null;
  const name = String(b.name ?? '').replace(/[^\p{L}\p{N} _.\-!?']/gu, '').trim().slice(0, 12) || 'Citizen';
  const score = int(b.score, 100, 100000), t = int(b.t, 600, 60 * 60 * 60 * 3), d = int(b.d, 0, 5000), c = int(b.c, 0, 5000), seed = int(b.seed, 0, 0x3fffffff);
  const id = String(b.id ?? '').replace(/[^\w\-]/g, '').slice(0, 40);
  if ([score, t, d, c, seed].includes(null) || !id) return null;
  const e = ENDS.has(b.e) ? b.e : 'id';
  if (e === 'dnf') return null;
  return { id, name, score, t, d, c, e, seed, hell: !!b.hell, mp: !!b.mp, at: Date.now() };
}

async function put(store, key, row, keep) {
  const cur = (await store.get(key, { type: 'json' })) || [];
  if (cur.some(r => r.id === row.id)) return cur;
  cur.push(row);
  cur.sort((a, b) => b.score - a.score || a.t - b.t);
  const top = cur.slice(0, keep);
  await store.setJSON(key, top);
  return top;
}

export default async (req) => {
  // Browsers send this "preflight" before a cross-site POST with a JSON body.
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  const store = getStore({ name: 'rq-scores', consistency: 'strong' });
  try {
    if (req.method === 'GET') {
      const sp = new URL(req.url).searchParams;
      if (sp.get('daily') === '1') {
        const day = utcDay(), seed = dailySeed(day);
        const rows = (await store.get('daily-' + day, { type: 'json' })) || [];
        return J({ rows: rows.slice(0, 5), day, seed, resetAt: new Date(nextUtcMidnight(day)).toISOString() });
      }
      let key = 'all';
      if (sp.has('seed')) { const s = int(sp.get('seed'), 0, 0x3fffffff); if (s === null) return J({ error: 'bad seed' }, 400); key = 'seed-' + s; }
      const rows = (await store.get(key, { type: 'json' })) || [];
      return J({ rows: rows.slice(0, SHOW) });
    }
    if (req.method === 'POST') {
      if (Number(req.headers.get('content-length') || 0) > 2000) return J({ error: 'too big' }, 413);
      let body; try { body = await req.json(); } catch { return J({ error: 'bad json' }, 400); }
      const row = clean(body);
      if (!row) return J({ error: 'rejected' }, 400);
      const all = await put(store, 'all', row, KEEP_ALL);
      const sd = await put(store, 'seed-' + row.seed, row, KEEP_SEED);
      // Scores for other/random seeds never enter the daily board. Yesterday's
      // scores remain archived under yesterday's key, not today's board.
      const day = utcDay();
      let dailyRank = null;
      if (row.seed === dailySeed(day)) {
        const daily = await put(store, 'daily-' + day, row, KEEP_DAILY);
        dailyRank = daily.findIndex(r => r.id === row.id) + 1;
      }
      return J({ ok: true, rank: all.findIndex(r => r.id === row.id) + 1, seedRank: sd.findIndex(r => r.id === row.id) + 1, dailyRank });
    }
    return J({ error: 'method' }, 405);
  } catch (err) {
    return J({ error: 'store unavailable' }, 503);
  }
};
