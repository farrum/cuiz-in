import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_categories",
  title: "List quiz categories",
  description: "List the available CuizIN quiz categories with the number of questions in each.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("category")
      .limit(10000);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      if (!row.category) continue;
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    }
    const categories = Array.from(counts, ([category, questionCount]) => ({
      category,
      questionCount,
    })).sort((a, b) => b.questionCount - a.questionCount);
    return {
      content: [{ type: "text", text: JSON.stringify(categories) }],
      structuredContent: { categories },
    };
  },
});