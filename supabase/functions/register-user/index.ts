import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RegisterSchema = z.object({
  username: z.string().trim().min(3).max(50),
  displayName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(1).max(30),
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
      return new Response(JSON.stringify({ error: "Server not configured" }), {
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

    const { data: existingUsername } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", normalizedUsername)
      .maybeSingle();

    if (existingUsername) {
      return new Response(JSON.stringify({ error: "Username already exists" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ensureProfileAndRole = async (userId: string) => {
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
        throw profileError;
      }

      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "player")
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "player" });

        if (roleError) {
          throw roleError;
        }
      }
    };

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
      const message = createError.message.toLowerCase();
      const alreadyExists = message.includes("already been registered") || message.includes("already registered") || message.includes("already exists");

      if (!alreadyExists) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: listedUsers, error: listError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (listError) {
        return new Response(JSON.stringify({ error: listError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const existingUser = listedUsers.users.find((user) => user.email?.toLowerCase() === normalizedEmail);

      if (!existingUser) {
        return new Response(JSON.stringify({ error: "Email already registered" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", existingUser.id)
        .maybeSingle();

      if (existingProfile) {
        return new Response(JSON.stringify({ error: "Email already registered" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: {
          username: normalizedUsername,
          display_name: normalizedDisplayName,
          phone: normalizedPhone,
        },
      });

      if (updateError || !updatedUser.user) {
        return new Response(JSON.stringify({ error: updateError?.message || "Failed to recover existing account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = updatedUser.user.id;
    } else if (createdUser.user) {
      userId = createdUser.user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Failed to create user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await ensureProfileAndRole(userId);

    return new Response(JSON.stringify({ success: true, user: { id: userId, email: normalizedEmail } }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("register-user error:", message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
