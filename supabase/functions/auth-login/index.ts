import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, password } = await req.json();
    console.log("[auth-login] Login attempt for:", identifier);

    if (!identifier || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Identifier and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("[auth-login] Missing env vars");
      return new Response(
        JSON.stringify({ success: false, error: "Server not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const logLogin = async (usernameToLog: string, successful: boolean) => {
      await supabaseAdmin.from("login_logs").insert({
        username: usernameToLog,
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        device: req.headers.get("user-agent") || "unknown",
        login_time: new Date().toISOString(),
        successful,
      });
    };

    let email = identifier;
    let resolvedUsername: string | null = null;

    // If not an email, resolve username to email
    if (!identifier.includes("@")) {
      console.log("[auth-login] Resolving username to email");
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, suspended, username")
        .eq("username", identifier)
        .maybeSingle();

      if (profileError || !profile) {
        console.log("[auth-login] Username not found:", identifier);
        await logLogin(identifier, false);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid login credentials" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (profile.suspended) {
        console.log("[auth-login] Account suspended:", identifier);
        return new Response(
          JSON.stringify({ success: false, error: "Account suspended" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!profile.email) {
        console.log("[auth-login] Profile missing email, fetching from auth.users:", identifier);
        const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        const authEmail = authUser?.user?.email;
        if (authUserError || !authEmail) {
          console.log("[auth-login] No auth email for username:", identifier, authUserError);
          await logLogin(identifier, false);
          return new Response(
            JSON.stringify({ success: false, error: "Account needs to be re-registered with an email address" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        // Backfill profile email for future logins
        await supabaseAdmin.from("profiles").update({ email: authEmail }).eq("id", profile.id);
        profile.email = authEmail;
      }

      email = profile.email;
      resolvedUsername = profile.username;
      console.log("[auth-login] Resolved to email:", email);
    }

    // Authenticate via Supabase Auth
    console.log("[auth-login] Authenticating via Supabase Auth");
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
      console.log("[auth-login] Auth failed:", tokenJson?.error || tokenJson?.msg);
      await logLogin(resolvedUsername || identifier, false);
      const code = tokenJson?.error_code || tokenJson?.code || tokenJson?.error;
      const msg =
        code === "invalid_credentials"
          ? "Invalid email/username or password. Use Forgot Password if you need to set a new password."
          : "Invalid login credentials";
      return new Response(
        JSON.stringify({
          success: false,
          error: msg,
          code,
        }),
        // Credential rejection is an expected application result. Returning a
        // successful transport response lets functions.invoke expose the JSON
        // body instead of turning it into a FunctionsHttpError/runtime error.
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check suspension for email logins
    const userId = tokenJson?.user?.id as string | undefined;
    if (userId) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("suspended")
        .eq("id", userId)
        .maybeSingle();

      if (p?.suspended) {
        console.log("[auth-login] Account suspended (post-auth check):", userId);
        return new Response(
          JSON.stringify({ success: false, error: "Account suspended" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    await logLogin(resolvedUsername || identifier, true);
    console.log("[auth-login] Login successful for:", resolvedUsername || identifier);

    return new Response(
      JSON.stringify({
        success: true,
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token,
        expires_in: tokenJson.expires_in,
        token_type: tokenJson.token_type,
        user: tokenJson.user,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[auth-login] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
