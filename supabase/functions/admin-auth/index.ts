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
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';

    if (!normalizedUsername || typeof password !== 'string' || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminUsername = Deno.env.get('ADMIN_USERNAME');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!adminUsername || !adminPassword || !supabaseUrl || !supabaseServiceKey || !anonKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const adminEmail = `${normalizedUsername.toLowerCase()}@cuiz.in`;

    const logLogin = async (successful: boolean) => {
      await supabaseAdmin.from('login_logs').insert({
        username: normalizedUsername,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        device: req.headers.get('user-agent') || 'unknown',
        login_time: new Date().toISOString(),
        successful,
      });
    };

    // Prefer the real Supabase credential. This keeps admin auth aligned with
    // the rest of the app and avoids resetting the password on every login.
    const { data: passwordLogin } = await supabaseAuth.auth.signInWithPassword({
      email: adminEmail,
      password,
    });

    if (passwordLogin.session?.user) {
      const { data: role } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', passwordLogin.session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!role) {
        await supabaseAuth.auth.signOut();
        await logLogin(false);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await logLogin(true);
      return new Response(
        JSON.stringify({
          success: true,
          adminUserId: passwordLogin.session.user.id,
          adminUsername: normalizedUsername,
          access_token: passwordLogin.session.access_token,
          refresh_token: passwordLogin.session.refresh_token,
          expires_in: passwordLogin.session.expires_in,
          token_type: passwordLogin.session.token_type,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Backward-compatible bootstrap: accept the configured admin credential,
    // then mint a Supabase session without changing the Auth password. A login
    // rejection is a normal response (HTTP 200), so the client can display it
    // without surfacing an Edge Function runtime error.
    if (normalizedUsername.toLowerCase() !== adminUsername.trim().toLowerCase() || password !== adminPassword) {
      await logLogin(false);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Mint a one-time server-generated sign-in token. This avoids the race
    // caused by changing a password and immediately requesting a token.
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: adminEmail,
    });
    const hashedToken = linkData?.properties?.hashed_token;
    if (linkError || !hashedToken) {
      console.error('[admin-auth] session link failed:', linkError);
      await logLogin(false);
      return new Response(
        JSON.stringify({ success: false, error: 'Could not establish admin session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: verified, error: verifyError } = await supabaseAuth.auth.verifyOtp({
      type: 'magiclink',
      token_hash: hashedToken,
    });
    if (verifyError || !verified.session) {
      console.error('[admin-auth] session verification failed:', verifyError);
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
        adminUsername: normalizedUsername,
        access_token: verified.session.access_token,
        refresh_token: verified.session.refresh_token,
        expires_in: verified.session.expires_in,
        token_type: verified.session.token_type,
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
