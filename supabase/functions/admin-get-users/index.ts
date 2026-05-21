import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';

    // Parse body
    let body: any = {};
    try { body = await req.json(); } catch { /* empty body is fine */ }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Determine admin user ID: try Supabase Auth first, then legacy fallback
    let adminUserId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        adminUserId = user.id;
      }
    }

    // Legacy fallback: accept adminUserId from body but validate it server-side
    if (!adminUserId && body.adminUserId) {
      adminUserId = body.adminUserId;
    }

    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No valid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate admin role server-side using service role key (secure)
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all users with service role (bypasses RLS)
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, display_name, phone, gems_balance, provider, profile_picture, suspended, created_at, email')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Database error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: usersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mappedUsers = (users || []).map((user: any) => ({
      ...user,
      gems: user.gems_balance || 0,
    }));

    return new Response(
      JSON.stringify({ users: mappedUsers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in admin-get-users:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
