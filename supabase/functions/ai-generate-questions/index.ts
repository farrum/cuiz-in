import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { resolveImage } from "../_shared/imageResolver.ts";

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
  isImageQuestion?: boolean;
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
      imagePercent = 0,
      model = "google/gemini-2.5-flash",
    } = await req.json();

    if (!adminUserId || !category) {
      return new Response(JSON.stringify({ error: "adminUserId and category are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const n = Math.min(Math.max(parseInt(String(amount), 10) || 10, 1), 50);
    const indiaPct = Math.min(Math.max(parseInt(String(indiaPercent), 10) || 0, 0), 100);
    const imagePct = Math.min(Math.max(parseInt(String(imagePercent), 10) || 0, 0), 100);

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
    const imageCount = Math.round((n * imagePct) / 100);
    const subCatLine = subCategory ? `Sub-topic focus: ${subCategory}.` : "";
    const diffLine = difficulty === "mixed"
      ? "Vary difficulty across easy, medium, hard."
      : `All questions should be ${difficulty} difficulty.`;

    const systemPrompt = `You are an expert quiz writer creating high-quality multiple-choice trivia questions. Every question must have exactly 4 options with only ONE clearly correct answer. Questions must be factually accurate, unambiguous, and self-contained. Provide a one-to-two sentence explanation citing the relevant fact. Do not produce duplicate questions. Avoid offensive, political, or adult content. Use plain text only — no HTML, markdown, emojis. CRITICAL JSON RULE: never use the double-quote character (") anywhere inside any string value (question, options, correctAnswer, explanation). If you must quote a word or phrase, use single quotes (') instead. Using double quotes inside text breaks the JSON and is forbidden.`;

    const userPrompt = `Generate exactly ${n} unique multiple-choice quiz questions.
Category: ${category}
${subCatLine}
${diffLine}

At least ${indiaCount} of the ${n} questions MUST be India-specific (about Indian history, geography, culture, sports, cinema, politics, science, current affairs, languages, food, festivals, or notable Indian people). Mark these with isIndiaSpecific: true. The remaining questions should be globally relevant and have isIndiaSpecific: false.

At least ${imageCount} of the ${n} questions MUST be "image questions" — questions about a single, concrete, visually-recognizable subject (a person, place, landmark, animal, object, logo, flag, or artwork) where the correct answer is that depictable subject, so a representative image can be shown. Phrase these so an image of the subject makes sense (e.g. "Which monument is this?", "Identify this scientist", "Which animal is shown?"). Mark these with isImageQuestion: true; all other questions have isImageQuestion: false.

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
      "isIndiaSpecific": boolean,
      "isImageQuestion": boolean
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
    try {
      parsed = JSON.parse(content);
    } catch (_e) {
      // The model sometimes emits unescaped double quotes inside string values
      // (e.g. a phrase like the "Three Khans"), which makes the whole response
      // invalid JSON and previously failed the entire run. Repair stray inner
      // quotes and retry before giving up.
      try {
        parsed = JSON.parse(repairJsonQuotes(content));
      } catch (e2) {
        console.error("JSON parse error (even after repair):", e2, content);
        return new Response(JSON.stringify({ error: "AI returned invalid JSON" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
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
      isImageQuestion: Boolean(q.isImageQuestion),
    }));

    if (validQuestions.length === 0) {
      return new Response(JSON.stringify({ error: "No valid questions generated. Try again." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert into DB, skipping duplicates by exact question match
    let saved = 0, duplicates = 0, errors = 0;
    const indiaSaved = { count: 0 };
    let imagesResolved = 0;
    // Ensure we resolve images for at least imageCount questions even if the
    // model under-marked them: top up from the remaining questions.
    const flagged = validQuestions.filter((q) => q.isImageQuestion);
    if (flagged.length < imageCount) {
      for (const q of validQuestions) {
        if (flagged.length >= imageCount) break;
        if (!q.isImageQuestion) { q.isImageQuestion = true; flagged.push(q); }
      }
    }
    // 1. Dedup check (parallel) to find which questions are new.
    const dupChecks = await Promise.all(validQuestions.map(async (q) => {
      const { data: existing } = await supabase
        .from("quiz_questions").select("id").eq("question", q.question).maybeSingle();
      return Boolean(existing);
    }));
    const newQuestions = validQuestions.filter((_, i) => {
      if (dupChecks[i]) { duplicates++; return false; }
      return true;
    });

    // 2. Resolve images (bounded concurrency) only for the new questions we
    //    plan to keep, up to imageCount. Image generation is the slow step, so
    //    running it sequentially for many questions would exceed the function
    //    time limit; cap concurrency to stay within limits while staying fast.
    const imageTargets = newQuestions.filter((q) => q.isImageQuestion).slice(0, imageCount);
    const imageMap = new Map<GeneratedQuestion, string>();
    const CONCURRENCY = 4;
    for (let i = 0; i < imageTargets.length; i += CONCURRENCY) {
      const batch = imageTargets.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (q) => {
        try {
          const r = await resolveImage(q.question, q.correctAnswer, q.category);
          if (r.imageUrl) { imageMap.set(q, r.imageUrl); imagesResolved++; }
        } catch (e) {
          console.error("image resolve failed for question:", q.question, e);
        }
      }));
    }

    // 3. Insert all new questions (parallel).
    await Promise.all(newQuestions.map(async (q) => {
      const imageUrl = imageMap.get(q) ?? null;
      const { error } = await supabase.from("quiz_questions").insert({
        question: q.question,
        options: q.options,
        correct_answer: q.correctAnswer,
        difficulty: q.difficulty,
        category: q.category,
        explanation: q.explanation,
        points: q.difficulty === "easy" ? 2 : q.difficulty === "medium" ? 3 : 4,
        question_type: imageUrl ? "image" : "text",
        image_url: imageUrl,
      });
      if (error) {
        console.error("Insert error:", error);
        errors++;
      } else {
        saved++;
        if (q.isIndiaSpecific) indiaSaved.count++;
      }
    }));

    return new Response(JSON.stringify({
      saved, duplicates, errors,
      generated: validQuestions.length,
      indiaSpecific: indiaSaved.count,
      requestedIndiaMin: indiaCount,
      imagesResolved,
      requestedImageMin: imageCount,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});