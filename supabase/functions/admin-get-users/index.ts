import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-app-version, x-app-platform',
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
      // Fallback: decode the JWT payload if getUser() failed (e.g. network/key issue)
      if (!adminUserId) {
        try {
          const payload = JSON.parse(
            atob(authHeader.replace('Bearer ', '').split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
          );
          if (payload?.sub && payload?.exp * 1000 > Date.now()) {
            adminUserId = payload.sub as string;
          }
        } catch (_) { /* ignore */ }
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
      .select('id, username, display_name, phone, points, profile_picture, suspended, created_at, email, auth_migrated')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Database error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: usersError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Today's activity (India time): total attempts, quest attempts, gems earned today
    const activityMap: Record<string, { total: number; quest: number; gems: number }> = {};
    try {
      const { data: counts, error: countsError } = await supabaseAdmin.rpc('admin_get_user_activity_today');
      if (countsError) {
        console.warn('admin_get_user_activity_today error:', countsError.message);
      } else if (counts) {
        for (const row of counts as any[]) {
          if (row?.user_id) {
            activityMap[row.user_id] = {
              total: Number(row.questions_total) || 0,
              quest: Number(row.questions_quest) || 0,
              gems: Number(row.gems_today) || 0,
            };
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching today activity in edge function:', err);
    }

    const mappedUsers = (users || []).map((user: any) => {
      const activity = activityMap[user.id];
      return {
        ...user,
        gems: user.points || 0,
        gems_balance: user.points || 0,
        questions_today: activity?.total || 0,
        questions_quest_today: activity?.quest || 0,
        gems_today: activity?.gems || 0,
      };
    });

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
