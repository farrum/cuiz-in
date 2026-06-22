import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Subject {
  subject: string;
  wiki_query: string;
  is_person_or_object: boolean;
  image_prompt: string;
}

async function extractSubject(question: string, correctAnswer: string, category: string): Promise<Subject> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You extract the single most visually-representative subject for a quiz question and generate a highly detailed prompt for DALL-E 3. Return a concrete real-world entity (person, object, place, animal, logo, landmark) that can be photographed. Prefer the correct answer when it is a concrete entity; otherwise pick the main entity referenced in the question." },
        { role: "user", content: `Question: ${question}\nCorrect answer: ${correctAnswer}\nCategory: ${category}` },
      ],
      tools: [{
        type: "function",
        function: {
          name: "set_subject",
          description: "Return the imaging subject and prompt details",
          parameters: {
            type: "object",
            properties: {
              subject: { type: "string", description: "1-4 words, concrete entity to depict" },
              wiki_query: { type: "string", description: "Best Wikipedia search query for this entity" },
              is_person_or_object: { type: "boolean", description: "true if it's a real person, place, animal, landmark, product, or logo" },
              image_prompt: { type: "string", description: "A detailed description of the subject or scene for DALL-E 3. Be descriptive, specify visual characteristics, medium (professional reference photograph), composition, lighting, background, and explicitly state NO text, watermarks, or labels." },
            },
            required: ["subject", "wiki_query", "is_person_or_object", "image_prompt"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "set_subject" } },
    }),
  });
  if (!resp.ok) throw new Error(`subject extraction failed: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  const parsed = typeof args === "string" ? JSON.parse(args) : args;
  return {
    subject: String(parsed?.subject ?? correctAnswer).trim(),
    wiki_query: String(parsed?.wiki_query ?? correctAnswer).trim(),
    is_person_or_object: Boolean(parsed?.is_person_or_object),
    image_prompt: String(parsed?.image_prompt || "").trim(),
  };
}

async function wikiImage(query: string): Promise<string | null> {
  const ua = "CuizIN/1.0 (https://cuiz.in)";
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`;
  const sr = await fetch(searchUrl, { headers: { "User-Agent": ua } });
  if (!sr.ok) return null;
  const sd = await sr.json();
  const title = sd?.query?.search?.[0]?.title;
  if (!title) return null;

  const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=original&format=json&titles=${encodeURIComponent(title)}&origin=*`;
  const ir = await fetch(imgUrl, { headers: { "User-Agent": ua } });
  if (!ir.ok) return null;
  const id = await ir.json();
  const pages = id?.query?.pages ?? {};
  for (const k of Object.keys(pages)) {
    const src: string | undefined = pages[k]?.original?.source;
    if (src && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(src) && !/\.svg(\?|$)/i.test(src)) {
      return src;
    }
  }
  return null;
}

async function uploadToSupabase(b64: string): Promise<string | null> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const fileName = `${crypto.randomUUID()}.png`;
  const { error: upErr } = await supabase.storage.from("question-images").upload(fileName, bytes, {
    contentType: "image/png",
    upsert: false,
  });
  if (upErr) {
    console.error("upload failed:", upErr);
    return null;
  }
  const { data: pub } = supabase.storage.from("question-images").getPublicUrl(fileName);
  return pub.publicUrl;
}

async function generateAiImage(prompt: string): Promise<string | null> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-image-2",
        prompt,
        size: "1024x1024",
        quality: "low",
        n: 1,
      }),
    });
    if (!resp.ok) {
      console.error("ai image gen failed:", resp.status, await resp.text());
      return null;
    }
    const data = await resp.json();
    const b64: string | undefined = data?.data?.[0]?.b64_json;
    if (b64) return uploadToSupabase(b64);
  } catch (e) {
    console.error("ai gen exception", e);
  }
  return null;
}

export async function resolveImage(question: string, correctAnswer: string, category: string): Promise<{ imageUrl: string | null; source: string }> {
  let subj: Subject | null = null;
  try { subj = await extractSubject(question, correctAnswer, category); }
  catch (e) { console.error("subject extract error", e); }

  // 1. Prioritize AI generation using the custom, context-aware prompt from Gemini
  if (subj?.image_prompt) {
    try {
      const aiUrl = await generateAiImage(subj.image_prompt);
      if (aiUrl) return { imageUrl: aiUrl, source: "ai" };
    } catch (e) { console.error("ai gen error", e); }
  }

  // 2. Fallback to Wikipedia lookup if AI generation failed
  const queries = [subj?.wiki_query, subj?.subject, correctAnswer].filter(Boolean) as string[];
  for (const q of queries) {
    try {
      const url = await wikiImage(q);
      if (url) return { imageUrl: url, source: "wikipedia" };
    } catch (e) { console.error("wiki error", q, e); }
  }

  // 3. Last resort AI generation using basic prompt fallback
  const subjectText = subj?.subject || correctAnswer || question;
  const styleHint = subj?.is_person_or_object ? "professional portrait photograph" : "high-quality reference photograph";
  const fallbackPrompt = `A clear, educational, photo-realistic ${styleHint} of ${subjectText}. Centered subject, well-lit, neutral background, no text, no watermark.`;
  try {
    const aiUrl = await generateAiImage(fallbackPrompt);
    if (aiUrl) return { imageUrl: aiUrl, source: "ai" };
  } catch (e) { console.error("ai gen fallback error", e); }

  return { imageUrl: null, source: "none" };
}