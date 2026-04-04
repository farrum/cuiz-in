import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminUserId, questions } = await req.json();

    if (!adminUserId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: "adminUserId and questions array are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate admin status
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Not an admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let saved = 0;
    let duplicates = 0;
    let errors = 0;

    for (const q of questions) {
      const { data, error } = await supabase
        .from("quiz_questions")
        .insert({
          question: q.question,
          options: q.options,
          correct_answer: q.correctAnswer || q.correct_answer,
          difficulty: q.difficulty || "medium",
          category: q.category,
          explanation: q.explanation || "",
          points: q.difficulty === "easy" ? 2 : q.difficulty === "medium" ? 3 : 4,
          question_type: q.questionType || q.question_type || "text",
          image_url: q.imageUrl || q.image_url || null,
        })
        .select();

      if (error) {
        if (error.message.includes("duplicate")) {
          duplicates++;
        } else {
          console.error("Error saving question:", error);
          errors++;
        }
      } else {
        saved++;
      }
    }

    return new Response(
      JSON.stringify({ saved, duplicates, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
