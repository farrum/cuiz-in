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

export type AdSlot = 'banner' | 'interstitial' | 'feed';

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
  badge?: string;
  emoji?: string;
}

/** House banners shown to all users until a real ad network is wired up. */
const HOUSE_BANNERS: AdCreative[] = [
  { id: 'hb1', slot: 'banner', headline: 'Climb the Leaderboard', body: 'Answer daily to earn gems & rank up', cta: 'Play now', bg: 'from-indigo-500 to-purple-600' },
  { id: 'hb2', slot: 'banner', headline: 'Daily Challenge Live', body: 'Fresh questions every day on CuizIN', cta: 'Take it', bg: 'from-emerald-500 to-teal-600' },
  { id: 'hb3', slot: 'banner', headline: 'Invite Friends', body: 'Challenge your friends to a quiz duel', cta: 'Share', bg: 'from-orange-500 to-pink-600' },
  { id: 'hb4', slot: 'banner', headline: 'Beat Your Streak', body: 'Keep your answer streak alive today', cta: 'Continue', bg: 'from-sky-500 to-blue-600' },
  { id: 'hb5', slot: 'banner', headline: 'Explore Categories', body: 'Science, History, Music & more', cta: 'Browse', bg: 'from-fuchsia-500 to-rose-600' },
];

/** In-feed native sponsored cards rendered between sections on the mobile hub. */
export const HOUSE_FEED_ADS: AdCreative[] = [
  {
    id: 'hfeed-1',
    slot: 'feed',
    headline: 'Unlock Kingdom Mystery Chests',
    body: 'Roll dice, flip coins & win up to 500 bonus gems in the Royal Tavern.',
    cta: 'Visit Tavern',
    bg: 'from-amber-600 via-amber-700 to-yellow-800',
    href: '/minigames',
    badge: 'FEATURED',
    emoji: '👑'
  },
  {
    id: 'hfeed-2',
    slot: 'feed',
    headline: 'Form Your Knowledge Squad',
    body: 'Recruit teammates & earn recurring daily gems from every battle they win.',
    cta: 'Squad Hub',
    bg: 'from-indigo-600 via-purple-700 to-violet-800',
    href: '/team-dashboard',
    badge: 'RECRUIT',
    emoji: '⚔️'
  },
  {
    id: 'hfeed-3',
    slot: 'feed',
    headline: 'Conquer Empire Quests',
    body: 'Unlock legendary campaign stages, earn star crowns & ascend the throne.',
    cta: 'March On',
    bg: 'from-emerald-600 via-teal-700 to-cyan-800',
    href: '/empire-quests',
    badge: 'CAMPAIGN',
    emoji: '🛡️'
  },
  {
    id: 'hfeed-4',
    slot: 'feed',
    headline: 'Daily Challenge Streak',
    body: 'Answer today’s curated lore questions for 2× rewards and streak glory.',
    cta: 'Play Daily',
    bg: 'from-rose-600 via-red-600 to-amber-700',
    href: '/daily',
    badge: 'HOT',
    emoji: '🔥'
  }
];

const SAMPLE_INTERSTITIALS: AdCreative[] = [
  { id: 'si1', slot: 'interstitial', sample: true, headline: 'Full-Screen Ad', body: 'This is how a sponsored full-screen ad appears between questions. Real ads run here when inventory is available.', cta: 'Visit sponsor', bg: 'from-fuchsia-600 via-purple-600 to-indigo-700' },
  { id: 'si2', slot: 'interstitial', sample: true, headline: 'Premium Placement', body: 'Capture player attention with an immersive interstitial. Skippable after a few seconds.', cta: 'Discover', bg: 'from-cyan-600 via-blue-600 to-indigo-700' },
];

export function getFeedAd(index = 0): AdCreative {
  return HOUSE_FEED_ADS[index % HOUSE_FEED_ADS.length];
}

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
  if (slot === 'banner') return HOUSE_BANNERS;
  if (isAdminUser()) return SAMPLE_INTERSTITIALS;
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