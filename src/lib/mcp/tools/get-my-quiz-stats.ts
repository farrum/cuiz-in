import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_quiz_stats",
  title: "Get my quiz stats",
  description:
    "Summarize the signed-in player's quiz performance: total questions attempted, correct answers, accuracy, and points earned. Optionally limit to a recent window of days.",
  inputSchema: {
    days: z
      .number()
      .int()
      .positive()
      .describe("Only count answers from the last N days. Omit for all-time stats.")
      .optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("quiz_answers")
      .select("correct, points_earned, answered_at")
      .eq("user_id", ctx.getUserId());
    if (days) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      query = query.gte("answered_at", since);
    }
    const { data, error } = await query.limit(10000);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const attempted = rows.length;
    const correct = rows.filter((r) => r.correct).length;
    const pointsEarned = rows.reduce((sum, r) => sum + (r.points_earned ?? 0), 0);
    const stats = {
      window: days ? `last ${days} days` : "all time",
      attempted,
      correct,
      incorrect: attempted - correct,
      accuracyPct: attempted ? Math.round((correct / attempted) * 1000) / 10 : 0,
      pointsEarned,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(stats) }],
      structuredContent: stats,
    };
  },
});