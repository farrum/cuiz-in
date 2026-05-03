import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUsername = Deno.env.get('ADMIN_USERNAME');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!adminUsername || !adminPassword || !supabaseUrl || !supabaseServiceKey || !anonKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const adminEmail = `${adminUsername.toLowerCase()}@cuiz.in`;

    const logLogin = async (successful: boolean) => {
      await supabaseAdmin.from('login_logs').insert({
        username: username,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        device: req.headers.get('user-agent') || 'unknown',
        login_time: new Date().toISOString(),
        successful,
      });
    };

    if (username !== adminUsername || password !== adminPassword) {
      await logLogin(false);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== Provision a real Supabase Auth user for the admin (idempotent) =====
    // Find or create the auth user
    let authUserId: string | null = null;
    {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === adminEmail);
      if (existing) {
        authUserId = existing.id;
        // Make sure password matches the current ADMIN_PASSWORD (rotation-safe)
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: adminPassword,
          email_confirm: true,
        });
      } else {
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { username: adminUsername, display_name: 'Admin' },
        });
        if (createErr || !created?.user) {
          console.error('[admin-auth] createUser failed:', createErr);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to provision admin user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        authUserId = created.user.id;
      }
    }

    // Make sure a profile row exists for this auth user with admin flag
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, username, is_admin')
      .eq('id', authUserId)
      .maybeSingle();

    if (!existingProfile) {
      await supabaseAdmin.from('profiles').insert({
        id: authUserId,
        username: adminUsername,
        display_name: 'Admin',
        email: adminEmail,
        is_admin: true,
        auth_migrated: true,
      });
    } else if (!existingProfile.is_admin) {
      await supabaseAdmin
        .from('profiles')
        .update({ is_admin: true, email: adminEmail })
        .eq('id', authUserId);
    }

    // Ensure user_roles has 'admin' for this user
    const { data: existingRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', authUserId)
      .eq('role', 'admin')
      .maybeSingle();
    if (!existingRole) {
      await supabaseAdmin.from('user_roles').insert({ user_id: authUserId, role: 'admin' });
    }

    // Now sign in via password grant to get real tokens
    const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) {
      console.error('[admin-auth] token grant failed:', tokenJson);
      await logLogin(false);
      return new Response(
        JSON.stringify({ success: false, error: 'Could not establish admin session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await logLogin(true);

    return new Response(
      JSON.stringify({
        success: true,
        adminUserId: authUserId,
        adminUsername,
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token,
        expires_in: tokenJson.expires_in,
        token_type: tokenJson.token_type,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-auth function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
