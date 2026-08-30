/**
 * Anonymous / guest activity tracking.
 * Best-effort, fire-and-forget. Never throws, never blocks gameplay.
 * Events are sent to the `track-guest-event` edge function which records
 * them server-side (guests cannot write to the table directly).
 */

import { supabase } from '@/integrations/supabase/client';
import { isUserLoggedIn } from '@/utils/guestPlayService';
import { asUuidOrNull } from '@/utils/uuid';

const SESSION_KEY = 'cuizin_guest_session_id';

type GuestEventType = 'page_view' | 'answer' | 'limit_reached' | 'registered';

interface GuestEventPayload {
  event_type: GuestEventType;
  path?: string;
  question_id?: string;
  correct?: boolean;
  points?: number;
}

/** Get (or create) a stable anonymous session id stored in localStorage. */
export const getGuestSessionId = (): string => {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        (crypto?.randomUUID?.() ??
          `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `g_${Date.now().toString(36)}`;
  }
};

/**
 * Send a guest event. Silently ignored for logged-in users (except
 * `registered`, which intentionally closes the funnel for the prior guest).
 */
export const trackGuestEvent = (payload: GuestEventPayload): void => {
  try {
    if (payload.event_type !== 'registered' && isUserLoggedIn()) return;

    const event = {
      session_id: getGuestSessionId(),
      event_type: payload.event_type,
      path: payload.path ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      question_id: asUuidOrNull(payload.question_id),
      correct: payload.correct,
      points: payload.points,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    };

    // Fire-and-forget; swallow all errors.
    supabase.functions
      .invoke('track-guest-event', { body: { events: [event] } })
      .catch(() => {});
  } catch {
    // never throw
  }
};

/** Convenience helper for page-view tracking. */
export const trackGuestPageView = (path?: string): void => {
  trackGuestEvent({ event_type: 'page_view', path });
};