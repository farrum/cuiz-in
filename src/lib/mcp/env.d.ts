// The files under src/lib/mcp are bundled into a Supabase Edge Function (Deno)
// where process.env is available via node compat. This ambient declaration
// keeps the frontend TypeScript build happy without pulling in @types/node.
declare const process: { env: Record<string, string | undefined> };