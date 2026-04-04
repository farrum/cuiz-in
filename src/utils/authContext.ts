/**
 * Auth context utilities - DEPRECATED
 * All authentication now goes through Supabase Auth.
 * These functions are kept as no-ops for backward compatibility.
 */

export const setUserContext = async (_userId: string): Promise<void> => {
  // No-op: Supabase Auth session handles RLS automatically
};

export const clearUserContext = async (): Promise<void> => {
  // No-op: Use supabase.auth.signOut() instead
};
