import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-version, x-app-platform",
};

const RegisterSchema = z.object({
  username: z.string().trim().min(3).max(50),
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  password: z.string().min(6).max(128),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { username, displayName, email, phone, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.trim();
    const normalizedDisplayName = displayName.trim();
    const normalizedPhone = phone.trim();

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Check if username or email is already represented in profiles.
    // Supabase intentionally obscures repeated public signups, so duplicates
    // must be rejected explicitly rather than presented as a new account.
    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", normalizedUsername)
      .maybeSingle();

    if (existingUsername) {
      return new Response(JSON.stringify({ error: "This username is already taken. Please choose another." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    if (existingEmail) {
      return new Response(JSON.stringify({ error: "An account with this email already exists. Please log in or reset your password." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Try to create the user in Auth
    let userId: string | null = null;
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        username: normalizedUsername,
        display_name: normalizedDisplayName,
        phone: normalizedPhone,
      },
    });

    if (createError) {
      const isDuplicate = createError.message.toLowerCase().includes("already registered")
        || createError.message.toLowerCase().includes("already exists");
      return new Response(JSON.stringify({
        error: isDuplicate
          ? "An account with this email already exists. Please log in or reset your password."
          : createError.message,
      }), {
        status: isDuplicate ? 409 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      userId = createdUser.user?.id || null;
    }

    if (!userId) {
      throw new Error("User creation failed - no ID returned");
    }

    // 3. Ensure profile and roles (Wait a moment for triggers to fire)
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        username: normalizedUsername,
        display_name: normalizedDisplayName,
        phone: normalizedPhone,
        email: normalizedEmail,
        auth_migrated: true,
      }, { onConflict: "id" });

    if (profileError) {
      console.error("Profile upsert error:", profileError);
      // We don't fail here because the trigger might have already done it
    }

    // Ensure role
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    if (!role) {
      await supabase.from("user_roles").insert({ user_id: userId, role: "infantry" });
    }

    // 4. Get tokens for auto-login
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    if (anonKey) {
      try {
        const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: "POST",
          headers: { apikey: anonKey, "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });

        if (tokenRes.ok) {
          const tokenJson = await tokenRes.json();
          accessToken = tokenJson.access_token;
          refreshToken = tokenJson.refresh_token;
        }
      } catch (e) {
        console.error("Token fetch error:", e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      user: { id: userId, email: normalizedEmail },
      access_token: accessToken,
      refresh_token: refreshToken,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
