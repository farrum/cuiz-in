import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { resolveImage } from "../_shared/imageResolver.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-app-version, x-app-platform",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { adminUserId, batchSize = 5 } = await req.json();
    if (!adminUserId) {
      return new Response(JSON.stringify({ error: "adminUserId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: adminRow } = await supabase.from("user_roles").select("role").eq("user_id", adminUserId).eq("role", "admin").maybeSingle();
    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find image-type questions whose image is missing OR is a stock/random URL.
    const filterOr = "image_url.is.null,image_url.ilike.%unsplash.com%,image_url.ilike.%picsum.photos%";
    const { data: rows, error } = await supabase
      .from("quiz_questions")
      .select("id, question, correct_answer, category, image_url")
      .eq("question_type", "image")
      .or(filterOr)
      .limit(Math.min(Math.max(Number(batchSize) || 5, 1), 20));
    if (error) throw error;

    let updated = 0, errors = 0;
    for (const r of rows ?? []) {
      try {
        const { imageUrl, source } = await resolveImage(r.question, r.correct_answer, r.category || "General");
        if (imageUrl) {
          const { error: upErr } = await supabase.from("quiz_questions").update({ image_url: imageUrl }).eq("id", r.id);
          if (upErr) { errors++; console.error("update err", upErr); }
          else { updated++; console.log(`updated ${r.id} via ${source}`); }
        } else {
          errors++;
        }
      } catch (e) {
        errors++;
        console.error("resolve err for", r.id, e);
      }
    }

    // remaining count
    const { count } = await supabase
      .from("quiz_questions")
      .select("id", { count: "exact", head: true })
      .eq("question_type", "image")
      .or(filterOr);

    return new Response(JSON.stringify({
      processed: rows?.length ?? 0,
      updated, errors,
      remaining: Math.max((count ?? 0) - updated, 0),
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("backfill error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});