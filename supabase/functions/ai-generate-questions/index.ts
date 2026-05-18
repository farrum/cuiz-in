import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  explanation: string;
  isIndiaSpecific: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const {
      adminUserId,
      category,
      subCategory = "",
      amount = 10,
      difficulty = "mixed",
      indiaPercent = 30,
      model = "google/gemini-2.5-flash",
    } = await req.json();

    if (!adminUserId || !category) {
      return new Response(JSON.stringify({ error: "adminUserId and category are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const n = Math.min(Math.max(parseInt(String(amount), 10) || 10, 1), 50);
    const indiaPct = Math.min(Math.max(parseInt(String(indiaPercent), 10) || 0, 0), 100);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate admin
    const { data: adminRole } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", adminUserId).eq("role", "admin").maybeSingle();
    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Unauthorized: Not an admin" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const indiaCount = Math.round((n * indiaPct) / 100);
    const subCatLine = subCategory ? `Sub-topic focus: ${subCategory}.` : "";
    const diffLine = difficulty === "mixed"
      ? "Vary difficulty across easy, medium, hard."
      : `All questions should be ${difficulty} difficulty.`;

    const systemPrompt = `You are an expert quiz writer creating high-quality multiple-choice trivia questions. Every question must have exactly 4 options with only ONE clearly correct answer. Questions must be factually accurate, unambiguous, and self-contained. Provide a one-to-two sentence explanation citing the relevant fact. Do not produce duplicate questions. Avoid offensive, political, or adult content. Use plain text only — no HTML, markdown, emojis, or quotes around options.`;

    const userPrompt = `Generate exactly ${n} unique multiple-choice quiz questions.
Category: ${category}
${subCatLine}
${diffLine}

At least ${indiaCount} of the ${n} questions MUST be India-specific (about Indian history, geography, culture, sports, cinema, politics, science, current affairs, languages, food, festivals, or notable Indian people). Mark these with isIndiaSpecific: true. The remaining questions should be globally relevant and have isIndiaSpecific: false.

Return ONLY valid JSON matching this exact schema:
{
  "questions": [
    {
      "question": "string",
      "options": ["string","string","string","string"],
      "correctAnswer": "string (must exactly match one of options)",
      "difficulty": "easy" | "medium" | "hard",
      "category": "${category}",
      "explanation": "string",
      "isIndiaSpecific": boolean
    }
  ]
}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Lovable workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "AI generation failed", detail: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResp.json();
    const content: string = aiData?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { questions?: GeneratedQuestion[] } = {};
    try { parsed = JSON.parse(content); } catch (e) {
      console.error("JSON parse error:", e, content);
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const raw = Array.isArray(parsed.questions) ? parsed.questions : [];
    // Validate & normalize
    const validQuestions = raw.filter((q) =>
      q && typeof q.question === "string" && q.question.trim().length > 5 &&
      Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.correctAnswer === "string" &&
      q.options.map((o) => String(o).trim()).includes(String(q.correctAnswer).trim())
    ).map((q) => ({
      question: q.question.trim(),
      options: q.options.map((o) => String(o).trim()),
      correctAnswer: String(q.correctAnswer).trim(),
      difficulty: (["easy","medium","hard"].includes(q.difficulty) ? q.difficulty : "medium") as "easy"|"medium"|"hard",
      category,
      explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
      isIndiaSpecific: Boolean(q.isIndiaSpecific),
    }));

    if (validQuestions.length === 0) {
      return new Response(JSON.stringify({ error: "No valid questions generated. Try again." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert into DB, skipping duplicates by exact question match
    let saved = 0, duplicates = 0, errors = 0;
    const indiaSaved = { count: 0 };
    for (const q of validQuestions) {
      const { data: existing } = await supabase
        .from("quiz_questions").select("id").eq("question", q.question).maybeSingle();
      if (existing) { duplicates++; continue; }

      const { error } = await supabase.from("quiz_questions").insert({
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        difficulty: q.difficulty,
        category: q.category,
        explanation: q.explanation,
        points: q.difficulty === "easy" ? 2 : q.difficulty === "medium" ? 3 : 4,
        question_type: "text",
      });
      if (error) {
        console.error("Insert error:", error);
        errors++;
      } else {
        saved++;
        if (q.isIndiaSpecific) indiaSaved.count++;
      }
    }

    return new Response(JSON.stringify({
      saved, duplicates, errors,
      generated: validQuestions.length,
      indiaSpecific: indiaSaved.count,
      requestedIndiaMin: indiaCount,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});