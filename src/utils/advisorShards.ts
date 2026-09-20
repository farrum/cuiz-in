/**
 * Royal Council advisor shards.
 *
 * Shards are the currency that powers in-quiz lifelines. They are stored
 * server-side on `user_characters.shards_collected` (with lifetime
 * `shards_purchased` and `shards_spent` counters) and mirrored into localStorage
 * so the UI can render instantly and guests still get a working balance.
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
const historyKey = (userId?: string) => `cuizin_shard_history_${userId || 'guest'}`;

export type ShardBalances = Record<AdvisorId, number>;

export interface ShardTransaction {
  id: string;
  userId: string;
  username?: string;
  characterId: AdvisorId;
  amount: number; // positive = earned/purchased, negative = spent
  actionType: 'purchase' | 'quest_bounty' | 'lifeline_fifty_fifty' | 'lifeline_audience_poll' | 'lifeline_skip' | 'lifeline_extra_time' | 'sync_migration' | string;
  balanceAfter: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface UserShardHolding {
  userId: string;
  username: string;
  displayName: string;
  socrates: number;
  aryabhata: number;
  chanakya: number;
  ramanujan: number;
  totalCollected: number;
  totalPurchased: number;
  totalSpent: number;
}

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

export const clearLocalShardCache = () => {
  ADVISOR_IDS.forEach((id) => {
    localStorage.removeItem(shardKey(id));
    localStorage.removeItem(purchasedKey(id));
  });
  notifyShardsUpdated();
};

const setLocalShards = (id: AdvisorId, balance: number, purchased?: number) => {
  localStorage.setItem(shardKey(id), String(Math.max(0, Math.floor(balance))));
  if (typeof purchased === 'number') {
    localStorage.setItem(purchasedKey(id), String(Math.max(0, Math.floor(purchased))));
  }
};

const migrationKey = (userId: string, id: AdvisorId) => `hero_${id}_shards_migrated_${userId}`;

/** Record a shard transaction to both remote database and local storage */
export const recordShardTransaction = async (
  characterId: AdvisorId,
  amount: number,
  actionType: string,
  balanceAfter: number,
  metadata: Record<string, any> = {}
): Promise<ShardTransaction> => {
  let userId = 'guest';
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      userId = session.user.id;
    }
  } catch {
    // Guest fallback
  }

  const tx: ShardTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId,
    characterId,
    amount,
    actionType,
    balanceAfter,
    metadata,
    createdAt: new Date().toISOString(),
  };

  // 1. Save to local storage mirror
  try {
    const key = historyKey(userId);
    const existing: ShardTransaction[] = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift(tx);
    // Keep last 100 entries locally
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.warn('[advisorShards] failed to append local history', e);
  }

  // 2. Persist to server if signed in
  if (userId !== 'guest') {
    try {
      await (supabase as any)
        .from('shard_transactions')
        .insert({
          user_id: userId,
          character_id: characterId,
          amount,
          action_type: actionType,
          balance_after: balanceAfter,
          metadata,
        });
    } catch {
      // Table may not exist yet or RPC already logged it; silent fallback
    }
  }

  return tx;
};

/**
 * Fetch shard history for a specific user (or the signed-in user).
 * Merges server ledger with local history for immediate display.
 */
export const getShardHistory = async (targetUserId?: string): Promise<ShardTransaction[]> => {
  let effectiveUserId = targetUserId;
  if (!effectiveUserId) {
    const { data: { session } } = await supabase.auth.getSession();
    effectiveUserId = session?.user?.id || 'guest';
  }

  // Read local history first
  const localHistory: ShardTransaction[] = JSON.parse(
    localStorage.getItem(historyKey(effectiveUserId)) || '[]'
  );

  if (effectiveUserId === 'guest') {
    return localHistory;
  }

  try {
    const { data, error } = await (supabase as any)
      .from('shard_transactions')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && Array.isArray(data) && data.length > 0) {
      const serverTxs: ShardTransaction[] = data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        characterId: row.character_id as AdvisorId,
        amount: row.amount,
        actionType: row.action_type,
        balanceAfter: row.balance_after,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));
      // Merge unique transactions by id
      const combined = [...serverTxs];
      localHistory.forEach((loc) => {
        if (!combined.some((s) => s.id === loc.id || (s.characterId === loc.characterId && s.createdAt === loc.createdAt))) {
          combined.push(loc);
        }
      });
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return combined;
    }
  } catch (e) {
    console.warn('[advisorShards] remote history fetch fallback to local', e);
  }

  // If no transactions found yet, check user_characters to provide lifetime overview
  if (localHistory.length === 0 && effectiveUserId !== 'guest') {
    try {
      const { data } = await (supabase as any)
        .from('user_characters')
        .select('*')
        .eq('user_id', effectiveUserId);

      if (data && Array.isArray(data)) {
        const synthetic: ShardTransaction[] = [];
        data.forEach((row) => {
          if (row.shards_purchased > 0) {
            synthetic.push({
              id: `init_p_${row.character_id}`,
              userId: effectiveUserId!,
              characterId: row.character_id as AdvisorId,
              amount: row.shards_purchased,
              actionType: 'purchase',
              balanceAfter: row.shards_collected,
              createdAt: row.created_at || new Date().toISOString(),
            });
          }
          if (row.shards_spent > 0) {
            synthetic.push({
              id: `init_s_${row.character_id}`,
              userId: effectiveUserId!,
              characterId: row.character_id as AdvisorId,
              amount: -row.shards_spent,
              actionType: 'lifeline_use',
              balanceAfter: row.shards_collected,
              createdAt: row.created_at || new Date().toISOString(),
            });
          }
        });
        return synthetic;
      }
    } catch {
      // ignore
    }
  }

  return localHistory;
};

/**
 * Fetch all users' advisor shard holdings (for Admin view)
 */
export const getAllUsersShardHoldings = async (): Promise<UserShardHolding[]> => {
  try {
    const [charsRes, profsRes] = await Promise.all([
      (supabase as any).from('user_characters').select('*'),
      supabase.from('profiles').select('id, username, display_name'),
    ]);

    if (!charsRes.data || !Array.isArray(charsRes.data)) return [];

    const profMap = new Map<string, { username: string; displayName: string }>();
    (profsRes.data || []).forEach((p: any) => {
      profMap.set(p.id, {
        username: p.username || 'Unknown',
        displayName: p.display_name || p.username || 'Unknown',
      });
    });

    const userMap = new Map<string, UserShardHolding>();

    charsRes.data.forEach((row: any) => {
      const uId = row.user_id;
      if (!userMap.has(uId)) {
        const prof = profMap.get(uId) || { username: 'Player', displayName: 'Player' };
        userMap.set(uId, {
          userId: uId,
          username: prof.username,
          displayName: prof.displayName,
          socrates: 0,
          aryabhata: 0,
          chanakya: 0,
          ramanujan: 0,
          totalCollected: 0,
          totalPurchased: 0,
          totalSpent: 0,
        });
      }

      const holding = userMap.get(uId)!;
      const charId = row.character_id as AdvisorId;
      if (charId in holding) {
        (holding as any)[charId] = row.shards_collected || 0;
      }
      holding.totalCollected += row.shards_collected || 0;
      holding.totalPurchased += row.shards_purchased || 0;
      holding.totalSpent += row.shards_spent || 0;
    });

    return Array.from(userMap.values()).sort((a, b) => b.totalCollected - a.totalCollected);
  } catch (err) {
    console.error('[advisorShards] failed to get all users shard holdings', err);
    return [];
  }
};

/**
 * Fetch recent shard transactions across all players (for Admin view)
 */
export const getAllShardTransactions = async (limit = 100): Promise<ShardTransaction[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from('shard_transactions')
      .select('*, profiles(username, display_name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data)) {
      return data.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        username: row.profiles?.display_name || row.profiles?.username || row.user_id?.slice(0, 8),
        characterId: row.character_id as AdvisorId,
        amount: row.amount,
        actionType: row.action_type,
        balanceAfter: row.balance_after,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));
    }
  } catch (err) {
    console.warn('[advisorShards] could not fetch admin transactions from table', err);
  }
  return [];
};

/**
 * Pull the authoritative balances from the database into the local mirror.
 *
 * Shards that only ever existed on this device (bought before shards were
 * stored server-side, or collected while signed out) are pushed up to the
 * server once per account, so the balance shown always matches what spending
 * checks against.
 */
export const syncAdvisorShards = async (targetUserId?: string): Promise<ShardBalances> => {
  try {
    let userId = targetUserId;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
    }

    if (!userId) return getAllShardBalances();

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
          void recordShardTransaction(id, delta, 'sync_migration', res.shards);
          continue;
        } else {
          // Direct table upsert fallback
          try {
            await (supabase as any)
              .from('user_characters')
              .upsert({
                user_id: userId,
                character_id: id,
                shards_collected: local,
                shards_purchased: (server.purchased || 0) + delta,
                level: 0,
              }, { onConflict: 'user_id, character_id' });
            setLocalShards(id, local, (server.purchased || 0) + delta);
            void recordShardTransaction(id, delta, 'sync_migration', local);
            continue;
          } catch {
            // Ignore fallback failure
          }
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
  reason: string = 'purchase'
): Promise<{ balance: number; error?: string }> => {
  const optimistic = getShardBalance(id) + amount;
  setLocalShards(id, optimistic, getShardsPurchased(id) + amount);
  notifyShardsUpdated();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      void recordShardTransaction(id, amount, reason, optimistic);
      return { balance: optimistic };
    }

    const { data, error } = await (supabase as any).rpc('award_character_shards', {
      p_character_id: id,
      p_amount: amount,
    });
    if (error || data?.error) {
      // Direct table upsert fallback for signed-in player
      try {
        const { data: existingChar } = await (supabase as any)
          .from('user_characters')
          .select('shards_collected, shards_purchased')
          .eq('user_id', session.user.id)
          .eq('character_id', id)
          .maybeSingle();

        const newCollected = (existingChar?.shards_collected || 0) + amount;
        const newPurchased = (existingChar?.shards_purchased || 0) + amount;

        const { error: upsertErr } = await (supabase as any)
          .from('user_characters')
          .upsert({
            user_id: session.user.id,
            character_id: id,
            shards_collected: newCollected,
            shards_purchased: newPurchased,
            level: 0,
          }, { onConflict: 'user_id, character_id' });

        if (!upsertErr) {
          setLocalShards(id, newCollected, newPurchased);
          notifyShardsUpdated();
          void recordShardTransaction(id, amount, reason, newCollected);
          return { balance: newCollected };
        }
      } catch (fbErr) {
        console.warn('[advisorShards] direct upsert fallback failed', fbErr);
      }
      void recordShardTransaction(id, amount, reason, optimistic);
      return { balance: optimistic, error: error?.message || data?.error };
    }
    if (typeof data?.shards === 'number') {
      setLocalShards(id, data.shards, data.purchased);
      notifyShardsUpdated();
      void recordShardTransaction(id, amount, reason, data.shards);
      return { balance: data.shards };
    }
  } catch (e: any) {
    void recordShardTransaction(id, amount, reason, optimistic);
    return { balance: optimistic, error: e?.message };
  }
  void recordShardTransaction(id, amount, reason, optimistic);
  return { balance: optimistic };
};

/**
 * Spend shards to fire a lifeline. Server-authoritative for signed-in players;
 * guests fall back to the local mirror so the feature still works offline.
 */
export const spendAdvisorShards = async (
  id: AdvisorId,
  amount: number = SHARD_COST_PER_LIFELINE,
  actionType?: string
): Promise<{ ok: boolean; balance: number; error?: string }> => {
  const local = getShardBalance(id);
  if (local < amount) {
    return { ok: false, balance: local, error: 'Not enough shards' };
  }

  const defaultAction =
    id === 'socrates'
      ? 'lifeline_fifty_fifty'
      : id === 'chanakya'
      ? 'lifeline_audience_poll'
      : id === 'aryabhata'
      ? 'lifeline_skip'
      : 'lifeline_extra_time';
  const effectiveAction = actionType || defaultAction;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data, error } = await (supabase as any).rpc('consume_advisor_shards', {
        p_character_id: id,
        p_amount: amount,
      });
      if (error || data?.error) {
        // Direct table update fallback for authenticated player
        try {
          const { data: existingChar } = await (supabase as any)
            .from('user_characters')
            .select('shards_collected, shards_spent')
            .eq('user_id', session.user.id)
            .eq('character_id', id)
            .maybeSingle();

          const currentShards = existingChar ? (existingChar.shards_collected || 0) : local;
          if (currentShards < amount) {
            return { ok: false, balance: currentShards, error: 'Not enough shards' };
          }
          const remaining = currentShards - amount;
          const spent = (existingChar?.shards_spent || 0) + amount;
          const { error: updErr } = await (supabase as any)
            .from('user_characters')
            .upsert({
              user_id: session.user.id,
              character_id: id,
              shards_collected: remaining,
              shards_spent: spent,
            }, { onConflict: 'user_id, character_id' });

          if (!updErr) {
            setLocalShards(id, remaining);
            notifyShardsUpdated();
            void recordShardTransaction(id, -amount, effectiveAction, remaining);
            return { ok: true, balance: remaining };
          }
        } catch (fbErr) {
          console.warn('[advisorShards] direct spend fallback failed', fbErr);
        }
        return { ok: false, balance: local, error: error?.message || data?.error };
      }
      const balance = typeof data?.shards === 'number' ? data.shards : local - amount;
      setLocalShards(id, balance);
      notifyShardsUpdated();
      void recordShardTransaction(id, -amount, effectiveAction, balance);
      return { ok: true, balance };
    }
  } catch (e: any) {
    return { ok: false, balance: local, error: e?.message };
  }

  // Guest path
  const balance = local - amount;
  setLocalShards(id, balance);
  notifyShardsUpdated();
  void recordShardTransaction(id, -amount, effectiveAction, balance);
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
