import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    // Validate input
    if (!username || !password) {
      console.log('Missing username or password');
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get admin credentials from secrets
    const adminUsername = Deno.env.get('ADMIN_USERNAME');
    const adminPassword = Deno.env.get('ADMIN_PASSWORD');

    if (!adminUsername || !adminPassword) {
      console.error('Admin credentials not configured in secrets');
      return new Response(
        JSON.stringify({ success: false, error: 'Admin authentication not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate credentials
    if (username !== adminUsername || password !== adminPassword) {
      console.log('Invalid admin credentials provided');
      
      // Log failed attempt
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabaseAdmin.from('login_logs').insert({
        username: username,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        device: req.headers.get('user-agent') || 'unknown',
        login_time: new Date().toISOString(),
        successful: false
      });

      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin credentials validated successfully');

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Find admin user in profiles
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username')
      .eq('is_admin', true)
      .limit(1)
      .single();

    if (profileError || !adminProfile) {
      console.error('No admin profile found:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful login
    await supabaseAdmin.from('login_logs').insert({
      username: username,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      device: req.headers.get('user-agent') || 'unknown',
      login_time: new Date().toISOString(),
      successful: true
    });

    console.log('Admin login successful for user:', adminProfile.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminUserId: adminProfile.id,
        adminUsername: adminProfile.username
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
