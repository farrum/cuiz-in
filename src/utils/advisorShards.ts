/**
 * Royal Council advisor shards.
 *
 * Shards are the currency that powers in-quiz lifelines. They are stored
 * server-side on `user_characters.shards_collected` (with a lifetime
 * `shards_purchased` counter) and mirrored into localStorage so the UI can
 * render instantly and guests still get a working balance.
 *
 * Every lifeline use costs SHARD_COST_PER_LIFELINE shards of that advisor.
 */
import { supabase } from '@/integrations/supabase/client';

export type AdvisorId = 'socrates' | 'aryabhata' | 'chanakya' | 'ramanujan';

export type LifelineKind = 'fifty_fifty' | 'skip' | 'audience_poll' | 'extra_time';

export const SHARD_COST_PER_LIFELINE = 10;

export interface AdvisorLifeline {
  id: AdvisorId;
  name: string;
  shortName: string;
  emoji: string;
  kind: LifelineKind;
  ability: string;
  hint: string;
  accent: string;
  quote: string;
}

export const ADVISOR_LIFELINES: AdvisorLifeline[] = [
  {
    id: 'socrates',
    name: 'King Socrates',
    shortName: 'Socrates',
    emoji: '🏛️',
    kind: 'fifty_fifty',
    ability: '50/50',
    hint: 'Removes two wrong answers',
    accent: 'text-cyan-300',
    quote: 'Two falsehoods shall fall away. Choose wisely from what remains.',
  },
  {
    id: 'aryabhata',
    name: 'King Aryabhata',
    shortName: 'Aryabhata',
    emoji: '📐',
    kind: 'skip',
    ability: 'Skip',
    hint: 'Skips to the next question',
    accent: 'text-amber-300',
    quote: 'A wise warrior knows when to retreat. Onward to the next trial.',
  },
  {
    id: 'chanakya',
    name: 'Emperor Chanakya',
    shortName: 'Chanakya',
    emoji: '📜',
    kind: 'audience_poll',
    ability: 'Audience Poll',
    hint: 'Shows how the court voted',
    accent: 'text-rose-300',
    quote: 'Before you act, consider the counsel of the masses.',
  },
  {
    id: 'ramanujan',
    name: 'Prince Ramanujan',
    shortName: 'Ramanujan',
    emoji: '🧠',
    kind: 'extra_time',
    ability: 'Extra Time',
    hint: 'Adds 15 seconds to the clock',
    accent: 'text-purple-300',
    quote: 'Time bends for those who see beyond. Take fifteen seconds more.',
  },
];

export const ADVISOR_IDS = ADVISOR_LIFELINES.map((a) => a.id);

export const SHARDS_UPDATED_EVENT = 'advisorShardsUpdated';

const shardKey = (id: AdvisorId) => `hero_${id}_shards`;
const purchasedKey = (id: AdvisorId) => `hero_${id}_shards_purchased`;

export type ShardBalances = Record<AdvisorId, number>;

const toInt = (value: string | null): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

export const getShardBalance = (id: AdvisorId): number =>
  toInt(localStorage.getItem(shardKey(id)));

export const getShardsPurchased = (id: AdvisorId): number =>
  toInt(localStorage.getItem(purchasedKey(id)));

export const getAllShardBalances = (): ShardBalances =>
  ADVISOR_IDS.reduce((acc, id) => {
    acc[id] = getShardBalance(id);
    return acc;
  }, {} as ShardBalances);

export const getAllShardsPurchased = (): ShardBalances =>
  ADVISOR_IDS.reduce((acc, id) => {
    acc[id] = getShardsPurchased(id);
    return acc;
  }, {} as ShardBalances);

export const notifyShardsUpdated = () => {
  window.dispatchEvent(new CustomEvent(SHARDS_UPDATED_EVENT));
};

const setLocalShards = (id: AdvisorId, balance: number, purchased?: number) => {
  localStorage.setItem(shardKey(id), String(Math.max(0, Math.floor(balance))));
  if (typeof purchased === 'number') {
    localStorage.setItem(purchasedKey(id), String(Math.max(0, Math.floor(purchased))));
  }
};

const migrationKey = (userId: string, id: AdvisorId) => `hero_${id}_shards_migrated_${userId}`;

/**
 * Pull the authoritative balances from the database into the local mirror.
 *
 * Shards that only ever existed on this device (bought before shards were
 * stored server-side, or collected while signed out) are pushed up to the
 * server once per account, so the balance shown always matches what spending
 * checks against.
 */
export const syncAdvisorShards = async (): Promise<ShardBalances> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return getAllShardBalances();

    const userId = session.user.id;
    const { data, error } = await (supabase as any)
      .from('user_characters')
      .select('character_id, shards_collected, shards_purchased')
      .eq('user_id', userId);

    if (error || !data) return getAllShardBalances();

    const serverBalances: Partial<Record<AdvisorId, { shards: number; purchased: number }>> = {};
    (data as any[]).forEach((row) => {
      if (ADVISOR_IDS.includes(row.character_id)) {
        serverBalances[row.character_id as AdvisorId] = {
          shards: row.shards_collected || 0,
          purchased: row.shards_purchased || 0,
        };
      }
    });

    for (const id of ADVISOR_IDS) {
      const server = serverBalances[id] || { shards: 0, purchased: 0 };
      const local = getShardBalance(id);
      const migrated = localStorage.getItem(migrationKey(userId, id)) === '1';

      if (!migrated && local > server.shards) {
        // One-time upload of device-only shards into the account.
        const delta = local - server.shards;
        const { data: res, error: rpcError } = await (supabase as any).rpc(
          'award_character_shards',
          { p_character_id: id, p_amount: delta },
        );
        localStorage.setItem(migrationKey(userId, id), '1');
        if (!rpcError && typeof res?.shards === 'number') {
          setLocalShards(id, res.shards, res.purchased ?? server.purchased);
          continue;
        }
      }

      localStorage.setItem(migrationKey(userId, id), '1');
      setLocalShards(id, server.shards, server.purchased);
    }

    notifyShardsUpdated();
  } catch (e) {
    console.warn('[advisorShards] sync failed', e);
  }
  return getAllShardBalances();
};


/** Credit shards (purchase, reward, quest drop). Persists server-side when signed in. */
export const awardAdvisorShards = async (
  id: AdvisorId,
  amount: number,
): Promise<{ balance: number; error?: string }> => {
  const optimistic = getShardBalance(id) + amount;
  setLocalShards(id, optimistic, getShardsPurchased(id) + amount);
  notifyShardsUpdated();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { balance: optimistic };

    const { data, error } = await (supabase as any).rpc('award_character_shards', {
      p_character_id: id,
      p_amount: amount,
    });
    if (error) return { balance: optimistic, error: error.message };
    if (data?.error) return { balance: optimistic, error: data.error };
    if (typeof data?.shards === 'number') {
      setLocalShards(id, data.shards, data.purchased);
      notifyShardsUpdated();
      return { balance: data.shards };
    }
  } catch (e: any) {
    return { balance: optimistic, error: e?.message };
  }
  return { balance: optimistic };
};

/**
 * Spend shards to fire a lifeline. Server-authoritative for signed-in players;
 * guests fall back to the local mirror so the feature still works offline.
 */
export const spendAdvisorShards = async (
  id: AdvisorId,
  amount: number = SHARD_COST_PER_LIFELINE,
): Promise<{ ok: boolean; balance: number; error?: string }> => {
  const local = getShardBalance(id);
  if (local < amount) {
    return { ok: false, balance: local, error: 'Not enough shards' };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await (supabase as any).rpc('consume_advisor_shards', {
        p_character_id: id,
        p_amount: amount,
      });
      if (error) return { ok: false, balance: local, error: error.message };
      if (data?.error) {
        if (typeof data.shards === 'number') {
          setLocalShards(id, data.shards);
          notifyShardsUpdated();
          return { ok: false, balance: data.shards, error: data.error };
        }
        return { ok: false, balance: local, error: data.error };
      }
      const balance = typeof data?.shards === 'number' ? data.shards : local - amount;
      setLocalShards(id, balance);
      notifyShardsUpdated();
      return { ok: true, balance };
    }
  } catch (e: any) {
    return { ok: false, balance: local, error: e?.message };
  }

  // Guest path
  const balance = local - amount;
  setLocalShards(id, balance);
  notifyShardsUpdated();
  return { ok: true, balance };
};

/** Deterministic-ish audience poll weights favouring the correct answer. */
export const buildAudiencePoll = (
  options: string[],
  correctAnswer: string,
): Record<string, number> => {
  const result: Record<string, number> = {};
  if (options.length === 0) return result;

  const correctShare = 45 + Math.floor(Math.random() * 25); // 45-69%
  const others = options.filter((o) => o !== correctAnswer);
  let remaining = 100 - correctShare;

  others.forEach((opt, i) => {
    const isLast = i === others.length - 1;
    const share = isLast
      ? remaining
      : Math.max(1, Math.floor(Math.random() * (remaining - (others.length - 1 - i))));
    result[opt] = share;
    remaining -= share;
  });

  if (options.includes(correctAnswer)) {
    result[correctAnswer] = correctShare;
  } else if (others.length > 0) {
    result[others[0]] = (result[others[0]] || 0) + correctShare;
  }

  return result;
};
