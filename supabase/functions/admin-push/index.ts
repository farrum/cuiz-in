import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-app-version, x-app-platform',
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const LEADER_ROLES = ['admin', 'king', 'baron', 'team_leader', 'teamleader', 'knight', 'officer', 'junior_team_leader'];

const b64url = (buf: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof buf === 'string' ? new TextEncoder().encode(buf) : new Uint8Array(buf as ArrayBuffer);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

let cachedToken: { token: string; exp: number } | null = null;
async function googleAccessToken(sa: { client_email: string; private_key: string }) {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claim}`));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claim}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`Google token failed [${res.status}]: ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

async function allRows<T>(q: (from: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await q(from);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  try {
    const authHeader = (req.headers.get('Authorization') ?? '').trim();
    const token = authHeader.replace(/^bearer\s+/i, '').trim();
    if (!token) return json({ error: 'Not signed in. Please sign in again as an admin.' }, 401);
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: 'Your session expired. Please sign in again.' }, 401);
    const { data: role } = await admin.from('user_roles').select('role').eq('user_id', u.user.id).eq('role', 'admin').maybeSingle();
    if (!role) return json({ error: 'Admin access required' }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? '');
    const segment = String(body.segment ?? 'all');
    const days = Math.max(1, Math.min(365, Number(body.days) || 1));

    // Resolve target tokens for a segment
    const tokens = await allRows<{ user_id: string; token: string; platform: string }>((f) =>
      admin.from('push_tokens').select('user_id, token, platform').range(f, f + 999));
    let targets = tokens;
    if (segment === 'infantry') {
      const roles = await allRows<{ user_id: string; role: string }>((f) =>
        admin.from('user_roles').select('user_id, role').in('role', LEADER_ROLES).range(f, f + 999));
      const refs = await allRows<{ referred_id: string }>((f) =>
        admin.from('user_referrals').select('referred_id').range(f, f + 999));
      const excluded = new Set([...roles.map((r) => r.user_id), ...refs.map((r) => r.referred_id)]);
      targets = tokens.filter((t) => !excluded.has(t.user_id));
    } else if (segment === 'inactive') {
      const cutoff = new Date(Date.now() - days * 86400_000).toISOString();
      const active = await allRows<{ id: string }>((f) =>
        admin.from('profiles').select('id').gte('last_seen_at', cutoff).range(f, f + 999));
      const activeSet = new Set(active.map((p) => p.id));
      targets = tokens.filter((t) => !activeSet.has(t.user_id));
    } else if (segment === 'web' || segment === 'app') {
      targets = tokens.filter((t) => (segment === 'app' ? t.platform !== 'web' : t.platform === 'web'));
    } else if (segment === 'me') {
      targets = tokens.filter((t) => t.user_id === u.user!.id);
    }

    if (action === 'audience') {
      return json({ devices: targets.length, users: new Set(targets.map((t) => t.user_id)).size, totalDevices: tokens.length });
    }
    if (action !== 'send') return json({ error: 'Unknown action' }, 400);

    const title = String(body.title ?? '').trim().slice(0, 120);
    const text = String(body.body ?? '').trim().slice(0, 300);
    const link = String(body.url ?? '/').slice(0, 300);
    if (!title || !text) return json({ error: 'Title and message are required' }, 400);

    const raw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!raw) return json({ error: 'Push is not configured: FIREBASE_SERVICE_ACCOUNT secret is missing.' }, 500);
    const sa = JSON.parse(raw);
    const access = await googleAccessToken(sa);
    const path = link.startsWith('http') ? link : `https://cuiz.in${link.startsWith('/') ? '' : '/'}${link}`;

    let sent = 0, failed = 0;
    const stale: string[] = [];
    const errors: string[] = [];
    for (let i = 0; i < targets.length; i += 50) {
      await Promise.all(targets.slice(i, i + 50).map(async (t) => {
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: {
            token: t.token,
            notification: { title, body: text },
            data: { url: link },
            webpush: { fcm_options: { link: path }, notification: { icon: 'https://cuiz.in/icon-192.png' } },
            android: { priority: 'HIGH' },
          } }),
        });
        if (res.ok) { sent++; return; }
        failed++;
        const err = await res.text();
        if (res.status === 404 || err.includes('UNREGISTERED') || err.includes('INVALID_ARGUMENT')) stale.push(t.token);
        else if (errors.length < 5) errors.push(`[${res.status}] ${err.slice(0, 200)}`);
      }));
    }
    if (stale.length) await admin.from('push_tokens').delete().in('token', stale);
    return json({ sent, failed, removedStale: stale.length, errors });
  } catch (e) {
    console.error('admin-push error', e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
