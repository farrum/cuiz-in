import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LoginRequest = {
  identifier: string;
  password: string;
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, password } = (await req.json()) as Partial<LoginRequest>;

    if (!identifier || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Identifier and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY");
      return new Response(
        JSON.stringify({ success: false, error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let email = identifier;
    let resolvedUsername: string | null = null;

    // If user typed username, resolve to email via service role (profiles table has RLS)
    if (!identifier.includes("@")) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("email, suspended, username")
        .eq("username", identifier)
        .maybeSingle();

      if (profileError || !profile?.email) {
        // Avoid revealing whether username exists
        await supabaseAdmin.from("login_logs").insert({
          username: identifier,
          ip_address: req.headers.get("x-forwarded-for") || "unknown",
          device: req.headers.get("user-agent") || "unknown",
          login_time: new Date().toISOString(),
          successful: false,
        });

        return new Response(
          JSON.stringify({ success: false, error: "Invalid login credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (profile.suspended) {
        return new Response(
          JSON.stringify({ success: false, error: "Account suspended" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      email = profile.email;
      resolvedUsername = profile.username;
    }

    // Exchange credentials for tokens
    const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const tokenJson = await tokenRes.json().catch(() => ({}));

    if (!tokenRes.ok) {
      await supabaseAdmin.from("login_logs").insert({
        username: resolvedUsername || identifier,
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        device: req.headers.get("user-agent") || "unknown",
        login_time: new Date().toISOString(),
        successful: false,
      });

      // Return code (when present) so the client can show better messages
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid login credentials",
          code: tokenJson?.error_code || tokenJson?.code || tokenJson?.error,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Optional: block suspended users even for email logins
    const userId = tokenJson?.user?.id as string | undefined;
    if (userId) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("suspended")
        .eq("id", userId)
        .maybeSingle();

      if (p?.suspended) {
        return new Response(
          JSON.stringify({ success: false, error: "Account suspended" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    await supabaseAdmin.from("login_logs").insert({
      username: resolvedUsername || identifier,
      ip_address: req.headers.get("x-forwarded-for") || "unknown",
      device: req.headers.get("user-agent") || "unknown",
      login_time: new Date().toISOString(),
      successful: true,
    });

    return new Response(
      JSON.stringify({
        success: true,
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token,
        expires_in: tokenJson.expires_in,
        token_type: tokenJson.token_type,
        user: tokenJson.user,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in auth-login function:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
