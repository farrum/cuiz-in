// Every leadership rank (medieval + legacy names) that may open the team dashboard.
export const LEADERSHIP_PRIORITY = ['admin', 'king', 'baron', 'team_leader', 'teamleader', 'knight', 'officer', 'junior_team_leader'] as const;

export const isLeadershipRole = (role?: string | null): boolean =>
  !!role && role !== 'admin' && (LEADERSHIP_PRIORITY as readonly string[]).includes(role);

/** Highest role from user_roles rows, keeping medieval ranks intact. */
export const resolveHighestRole = (roles?: Iterable<string | null | undefined> | null): string => {
  const set = new Set(Array.from(roles || []).filter(Boolean) as string[]);
  for (const r of LEADERSHIP_PRIORITY) {
    if (set.has(r)) return r === 'teamleader' ? 'team_leader' : r;
  }
  return 'player';
};
