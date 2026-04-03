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
    const authHeader = req.headers.get('Authorization') ?? '';

    const body = await req.json();
    const { reportType, limit } = body;

    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Determine admin user ID
    let adminUserId: string | null = null;

    if (authHeader.startsWith('Bearer ')) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) adminUserId = user.id;
    }

    // Legacy fallback: accept adminUserId from body but validate server-side
    if (!adminUserId && body.adminUserId) {
      adminUserId = body.adminUserId;
    }

    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: No valid session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different report types
    if (reportType === 'top-players') {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, username, points')
        .order('points', { ascending: false })
        .limit(limit || 10);

      if (profilesError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch top players' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ players: profiles || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (reportType === 'daily-top-performers') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const { data: dailyData, error: dailyError } = await supabaseAdmin
        .from('daily_points')
        .select('user_id, points')
        .eq('date', today)
        .order('points', { ascending: false })
        .limit(10);

      if (dailyError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch daily performers' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!dailyData || dailyData.length === 0) {
        return new Response(
          JSON.stringify({ performers: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userIds = dailyData.map(d => d.user_id);
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const usernameMap: Record<string, string> = {};
      profiles?.forEach(profile => {
        usernameMap[profile.id] = profile.username;
      });

      const performers = dailyData.map((item, index) => ({
        userId: item.user_id,
        username: usernameMap[item.user_id] || 'Unknown User',
        points: Number(item.points),
        rank: index + 1
      }));

      return new Response(
        JSON.stringify({ performers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (reportType === 'monthly-top-performers') {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

      const { data: monthlyData, error: monthlyError } = await supabaseAdmin
        .from('monthly_points')
        .select('user_id, points')
        .eq('month', currentMonth)
        .order('points', { ascending: false })
        .limit(10);

      if (monthlyError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch monthly performers' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!monthlyData || monthlyData.length === 0) {
        return new Response(
          JSON.stringify({ performers: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userIds = monthlyData.map(d => d.user_id);
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const usernameMap: Record<string, string> = {};
      profiles?.forEach(profile => {
        usernameMap[profile.id] = profile.username;
      });

      const performers = monthlyData.map((item, index) => ({
        userId: item.user_id,
        username: usernameMap[item.user_id] || 'Unknown User',
        points: Number(item.points),
        rank: index + 1
      }));

      return new Response(
        JSON.stringify({ performers }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid report type' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in admin-get-reports:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
