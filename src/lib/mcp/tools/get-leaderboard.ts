import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_leaderboard",
  title: "Get monthly leaderboard",
  description:
    "Get the CuizIN monthly points leaderboard. Defaults to the current month; pass a month like '2026-07'.",
  inputSchema: {
    month: z.string().describe("Month in YYYY-MM format. Omit for the current month.").optional(),
    limit: z.number().int().positive().describe("Number of top players to return (default 20).").optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ month, limit }, ctx) => {
    const supabase = supabaseForUser(ctx);
    const args: Record<string, unknown> = { _limit: Math.min(limit ?? 20, 100) };
    if (month) args._month = month;
    const { data, error } = await supabase.rpc("get_monthly_leaderboard", args);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const leaderboard = (data ?? []).map((r: Record<string, unknown>, i: number) => ({
      rank: i + 1,
      username: r.username,
      displayName: r.display_name,
      points: r.points,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(leaderboard) }],
      structuredContent: { leaderboard },
    };
  },
});