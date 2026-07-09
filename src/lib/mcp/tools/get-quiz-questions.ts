import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_quiz_questions",
  title: "Get quiz questions",
  description:
    "Fetch CuizIN quiz questions with their answer options. Correct answers are never returned. Optionally filter by category and difficulty.",
  inputSchema: {
    category: z.string().describe("Filter by category name (see list_categories).").optional(),
    difficulty: z.string().describe("Filter by difficulty, e.g. easy, medium, hard.").optional(),
    limit: z.number().int().positive().describe("Max questions to return (default 10).").optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ category, difficulty, limit }, ctx) => {
    const supabase = supabaseForUser(ctx);
    // Never select correct_answer or explanation — quiz integrity.
    let query = supabase
      .from("quiz_questions")
      .select("id, question, options, category, difficulty, image_url, points, question_type");
    if (category) query = query.eq("category", category);
    if (difficulty) query = query.eq("difficulty", difficulty);
    const { data, error } = await query.limit(Math.min(limit ?? 10, 50));
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const questions = data ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify(questions) }],
      structuredContent: { questions },
    };
  },
});