/**
 * Helpers for guarding Postgres `uuid` columns against local/sample question
 * ids such as "q1", "sci-004" or "food-drink-001".
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_RE.test(value.trim());

/** Returns the value when it is a valid uuid, otherwise null. */
export const asUuidOrNull = (value: unknown): string | null =>
  isUuid(value) ? (value as string).trim() : null;
