import { supabase } from '@/integrations/supabase/client';

const KEY = 'pending_referral_code';

/** Remember the invite code a visitor arrived with (survives Google OAuth round-trip). */
export const storePendingReferral = (code?: string | null) => {
  const clean = (code || '').trim();
  if (!clean) return;
  try {
    localStorage.setItem(KEY, clean);
  } catch {
    // storage unavailable — ignore
  }
};

export const getPendingReferral = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const clearPendingReferral = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};

/**
 * Link the signed-in user to the commander whose link they used.
 * Safe to call repeatedly: the RPC is a no-op if already linked.
 */
export const claimPendingReferral = async (code?: string | null) => {
  const refCode = (code || getPendingReferral() || '').trim();
  if (!refCode) return;

  try {
    const { data, error } = await supabase.rpc('claim_referral', { p_ref_code: refCode });
    if (error) {
      console.error('[Referral] claim failed:', error);
      return;
    }
    const result = data as { success?: boolean; error?: string } | null;
    if (result?.success) {
      clearPendingReferral();
    } else if (result?.error) {
      console.warn('[Referral] not applied:', result.error);
      if (result.error === 'Referrer not found' || result.error === 'You cannot refer yourself') {
        clearPendingReferral();
      }
    }
  } catch (err) {
    console.error('[Referral] claim error:', err);
  }
};
