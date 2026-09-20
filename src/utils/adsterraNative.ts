export const ADSTERRA_NATIVE_CONTAINER_ID =
  'container-b6b3b267c8adb2049f83eee731786d86';

export const ADSTERRA_NATIVE_CODE = `<script async="async" data-cfasync="false" src="https://pl29639942.profitableratecpmnetwork.com/b6b3b267c8adb2049f83eee731786d86/invoke.js"></script>
<div id="${ADSTERRA_NATIVE_CONTAINER_ID}"></div>`;

const ADSTERRA_CODE_PATTERN =
  /(?:atOptions|highperformanceformat\.com|highrevenueformat\.com|profitableratecpmnetwork\.com)/i;

export const isAdsterraCode = (content: string): boolean =>
  ADSTERRA_CODE_PATTERN.test(content);

export const isAdsterraNativeCode = (content: string): boolean =>
  content.includes(ADSTERRA_NATIVE_CONTAINER_ID);

/**
 * Upgrades stale device-cached Adsterra units to the current native unit.
 * The database remains the source of truth for whether a slot is active.
 */
export const normalizeAdsterraCode = (content: string): string =>
  isAdsterraCode(content) ? ADSTERRA_NATIVE_CODE : content;