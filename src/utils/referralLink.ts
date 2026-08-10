/**
 * Referral links must always point at the public site (cuiz.in) — never at
 * localhost, the Lovable preview host, or the Capacitor `capacitor://` /
 * `http://localhost` origin used inside the native app.
 *
 * On Android the site's asset links/deep links let the app open the URL
 * directly if it is installed; otherwise the browser opens the web
 * registration page with the referral code prefilled.
 */
export const SITE_URL = 'https://cuiz.in';

export const buildReferralLink = (username: string): string =>
  `${SITE_URL}/register?ref=${encodeURIComponent(username || '')}`;

export const buildReferralShareText = (username: string): string =>
  `Join me on CuizIN — play quizzes, win points and climb the leaderboard! Register with my link: ${buildReferralLink(username)}`;
