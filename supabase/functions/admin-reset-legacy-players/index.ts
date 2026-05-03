import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const NEW_PASSWORD = '!12345@ABc';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const adminUsername = Deno.env.get('ADMIN_USERNAME');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');

    // Authorize: either an admin Supabase JWT, OR the admin username/password in body
    const body = await req.json().catch(() => ({} as any));
    const authHeader = req.headers.get('Authorization');
    const admin = createClient(supabaseUrl, serviceKey);

    let isAuthorized = false;
    if (body?.username && body?.password
        && body.username === adminUsername && body.password === adminPassword) {
      isAuthorized = true;
    } else if (authHeader?.startsWith('Bearer ')) {
      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: claims } = await callerClient.auth.getClaims(token);
      if (claims?.claims?.sub) {
        const { data: roleRow } = await admin
          .from('user_roles')
          .select('role')
          .eq('user_id', claims.claims.sub)
          .eq('role', 'admin')
          .maybeSingle();
        if (roleRow) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch all legacy player profiles (exclude the admin profile itself)
    const { data: profiles, error: profErr } = await admin
      .from('profiles')
      .select('id, username, email, is_admin')
      .ilike('username', 'player%');
    if (profErr) {
      return new Response(JSON.stringify({ error: profErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const results: Array<{ username: string; status: string; detail?: string }> = [];

    // Build a set of existing auth users by id (paginate through admin.listUsers)
    const authById = new Map<string, { id: string; email?: string }>();
    let page = 1;
    while (true) {
      const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (!list?.users?.length) break;
      for (const u of list.users) authById.set(u.id, { id: u.id, email: u.email ?? undefined });
      if (list.users.length < 1000) break;
      page++;
    }

    for (const p of profiles ?? []) {
      // Skip the admin profile (current admin)
      if (p.is_admin) {
        results.push({ username: p.username, status: 'skipped_admin' });
        continue;
      }

      const desiredEmail = (p.email && p.email.includes('@'))
        ? p.email
        : `${p.username.toLowerCase().replace(/\s+/g, '')}@cuiz.local`;

      const existingAuth = authById.get(p.id);
      try {
        if (existingAuth) {
          const { error: updErr } = await admin.auth.admin.updateUserById(p.id, {
            password: NEW_PASSWORD,
            email: existingAuth.email || desiredEmail,
            email_confirm: true,
          });
          if (updErr) throw updErr;
        } else {
          // Profile id may not be a valid uuid (legacy ids like "066otqbbqac7")
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.id);
          if (!isUuid) {
            results.push({ username: p.username, status: 'skipped_non_uuid_id' });
            continue;
          }
          const { error: createErr } = await admin.auth.admin.createUser({
            id: p.id,
            email: desiredEmail,
            password: NEW_PASSWORD,
            email_confirm: true,
            user_metadata: { username: p.username, display_name: p.username },
          });
          if (createErr) throw createErr;
        }

        await admin
          .from('profiles')
          .update({ email: desiredEmail, auth_migrated: true })
          .eq('id', p.id);

        results.push({ username: p.username, status: 'reset' });
      } catch (e: any) {
        results.push({ username: p.username, status: 'error', detail: e?.message ?? String(e) });
      }
    }

    const summary = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1; return acc;
    }, {});

    return new Response(JSON.stringify({ success: true, password: NEW_PASSWORD, summary, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[admin-reset-legacy-players] error:', err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});