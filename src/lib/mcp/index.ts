import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import getMyQuizStats from "./tools/get-my-quiz-stats";
import listCategories from "./tools/list-categories";
import getQuizQuestions from "./tools/get-quiz-questions";
import getLeaderboard from "./tools/get-leaderboard";

// Direct supabase.co issuer, built from the project ref (see knowledge). Vite
// inlines VITE_SUPABASE_PROJECT_ID as a literal, so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "cuizin-mcp",
  title: "CuizIN MCP",
  version: "0.1.0",
  instructions:
    "Tools for CuizIN, a points-based quiz game. Use get_my_profile and get_my_quiz_stats for the signed-in player's own data, list_categories and get_quiz_questions to browse quiz content (correct answers are never exposed), and get_leaderboard for monthly rankings.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getMyProfile, getMyQuizStats, listCategories, getQuizQuestions, getLeaderboard],
});