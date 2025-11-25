import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminUserId, reportType, limit } = await req.json();

    if (!adminUserId) {
      return new Response(
        JSON.stringify({ error: 'Admin user ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate admin status
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .single();

    if (roleError || !adminRole) {
      console.error('Admin validation failed:', roleError);
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
        console.error('Error fetching top players:', profilesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch top players', details: profilesError.message }),
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
        console.error('Error fetching daily performers:', dailyError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch daily performers', details: dailyError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!dailyData || dailyData.length === 0) {
        return new Response(
          JSON.stringify({ performers: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get usernames
      const userIds = dailyData.map(d => d.user_id);
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch profiles', details: profilesError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
        console.error('Error fetching monthly performers:', monthlyError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch monthly performers', details: monthlyError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!monthlyData || monthlyData.length === 0) {
        return new Response(
          JSON.stringify({ performers: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get usernames
      const userIds = monthlyData.map(d => d.user_id);
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch profiles', details: profilesError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
