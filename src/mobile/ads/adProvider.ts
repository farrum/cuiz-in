import { STORAGE_KEYS } from '@/utils/quizData';

/**
 * Self-contained ad framework for the mobile app.
 *
 * SECURITY NOTE: Per project policy, third-party ad scripts are NOT injected
 * here (the site previously suffered malicious script injections). This module
 * only renders first-party creative objects. Real ad inventory, when wired to a
 * vetted network, should be returned from `fetchLiveAds()` as plain data — never
 * as raw <script> HTML.
 */

export type AdSlot = 'banner' | 'interstitial';

export interface AdCreative {
  id: string;
  slot: AdSlot;
  /** Whether this is a sample/house creative (shown to admins for QA). */
  sample?: boolean;
  headline: string;
  body: string;
  cta: string;
  /** Tailwind gradient classes for the creative background. */
  bg: string;
  /** Optional destination; sample ads have none. */
  href?: string;
}

/** Sample creatives shown to admins so they can preview the ad operation. */
const SAMPLE_BANNERS: AdCreative[] = [
  { id: 'sb1', slot: 'banner', sample: true, headline: 'Your Brand Here', body: 'Reach thousands of quiz players daily', cta: 'Advertise', bg: 'from-indigo-500 to-purple-600' },
  { id: 'sb2', slot: 'banner', sample: true, headline: 'Boost Your Reach', body: 'Premium banner placement on CuizIN', cta: 'Learn more', bg: 'from-emerald-500 to-teal-600' },
  { id: 'sb3', slot: 'banner', sample: true, headline: 'Sponsored Slot', body: 'Engage active, curious minds', cta: 'Get started', bg: 'from-orange-500 to-pink-600' },
];

const SAMPLE_INTERSTITIALS: AdCreative[] = [
  { id: 'si1', slot: 'interstitial', sample: true, headline: 'Full-Screen Ad', body: 'This is how a sponsored full-screen ad appears between questions. Real ads run here when inventory is available.', cta: 'Visit sponsor', bg: 'from-fuchsia-600 via-purple-600 to-indigo-700' },
  { id: 'si2', slot: 'interstitial', sample: true, headline: 'Premium Placement', body: 'Capture player attention with an immersive interstitial. Skippable after a few seconds.', cta: 'Discover', bg: 'from-cyan-600 via-blue-600 to-indigo-700' },
];

/**
 * Returns live (real) ad inventory. Currently returns an empty list because no
 * vetted ad network is wired up yet. When you integrate one, return creative
 * data here (NOT script tags). External users only ever see these.
 */
export function fetchLiveAds(slot: AdSlot): AdCreative[] {
  void slot;
  return [];
}

export function isAdminUser(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_ROLE) === 'admin';
  } catch {
    return false;
  }
}

/**
 * Returns the pool of creatives to display for a slot.
 * - External users: only real inventory (empty until a network is wired up).
 * - Admins: real inventory, falling back to sample creatives for QA.
 */
export function getAdPool(slot: AdSlot): AdCreative[] {
  const live = fetchLiveAds(slot);
  if (live.length > 0) return live;
  if (isAdminUser()) return slot === 'banner' ? SAMPLE_BANNERS : SAMPLE_INTERSTITIALS;
  return [];
}

/** True when there is something to render for this slot for the current user. */
export function hasAd(slot: AdSlot): boolean {
  return getAdPool(slot).length > 0;
}

export function pickAd(slot: AdSlot, index = 0): AdCreative | null {
  const pool = getAdPool(slot);
  if (pool.length === 0) return null;
  return pool[index % pool.length];
}