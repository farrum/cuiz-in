import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeHex } from "https://deno.land/std@0.220.0/encoding/hex.ts";
import { crypto } from "https://deno.land/std@0.220.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type LoginRequest = {
  identifier: string;
  password: string;
};

// MD5 hash for legacy password verification
async function md5Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  return encodeHex(new Uint8Array(hashBuffer));
}

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

    const logFailedLogin = async (usernameToLog: string) => {
      await supabaseAdmin.from("login_logs").insert({
        username: usernameToLog,
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        device: req.headers.get("user-agent") || "unknown",
        login_time: new Date().toISOString(),
        successful: false,
      });
    };

    const logSuccessfulLogin = async (usernameToLog: string) => {
      await supabaseAdmin.from("login_logs").insert({
        username: usernameToLog,
        ip_address: req.headers.get("x-forwarded-for") || "unknown",
        device: req.headers.get("user-agent") || "unknown",
        login_time: new Date().toISOString(),
        successful: true,
      });
    };

    let email = identifier;
    let resolvedUsername: string | null = null;
    let legacyProfile: { id: string; username: string; password_hash: string | null; suspended: boolean; auth_migrated: boolean } | null = null;

    // If user typed username, resolve to profile via service role (profiles table has RLS)
    if (!identifier.includes("@")) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, suspended, username, password_hash, auth_migrated")
        .eq("username", identifier)
        .maybeSingle();

      if (profileError || !profile) {
        await logFailedLogin(identifier);
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

      // Check if this is a legacy user (no email, not migrated to Supabase Auth)
      if (!profile.email && !profile.auth_migrated && profile.password_hash) {
        legacyProfile = {
          id: profile.id,
          username: profile.username,
          password_hash: profile.password_hash,
          suspended: profile.suspended ?? false,
          auth_migrated: profile.auth_migrated ?? false,
        };
      } else if (!profile.email) {
        // No email and no password_hash - can't authenticate
        await logFailedLogin(identifier);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid login credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } else {
        email = profile.email;
        resolvedUsername = profile.username;
      }
    }

    // Legacy authentication path (MD5 password hash)
    if (legacyProfile) {
      const hashedPassword = await md5Hash(password);
      
      if (hashedPassword !== legacyProfile.password_hash) {
        await logFailedLogin(legacyProfile.username);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid login credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Legacy user authenticated successfully
      await logSuccessfulLogin(legacyProfile.username);

      return new Response(
        JSON.stringify({
          success: true,
          legacy: true,
          user_id: legacyProfile.id,
          username: legacyProfile.username,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Modern authentication path (Supabase Auth)
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
      await logFailedLogin(resolvedUsername || identifier);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid login credentials",
          code: tokenJson?.error_code || tokenJson?.code || tokenJson?.error,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Block suspended users even for email logins
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

    await logSuccessfulLogin(resolvedUsername || identifier);

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
