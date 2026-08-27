import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { resolveImage } from "../_shared/imageResolver.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-version, x-app-platform",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function assertAdmin(adminUserId: string): Promise<boolean> {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", adminUserId).eq("role", "admin").maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { adminUserId, question, correctAnswer, category } = await req.json();
    if (!adminUserId || !question || !correctAnswer) {
      return new Response(JSON.stringify({ error: "adminUserId, question, correctAnswer required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!(await assertAdmin(adminUserId))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = await resolveImage(question, correctAnswer, category || "General");
    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resolve-question-image error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});