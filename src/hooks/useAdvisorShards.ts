import { useCallback, useEffect, useState } from 'react';
import {
  AdvisorId,
  ShardBalances,
  SHARDS_UPDATED_EVENT,
  SHARD_COST_PER_LIFELINE,
  getAllShardBalances,
  getAllShardsPurchased,
  spendAdvisorShards,
  syncAdvisorShards,
} from '@/utils/advisorShards';

/**
 * Live view of the player's advisor shard balances, kept in sync with the
 * database and with any other component that awards or spends shards.
 */
export const useAdvisorShards = () => {
  const [balances, setBalances] = useState<ShardBalances>(() => getAllShardBalances());
  const [purchased, setPurchased] = useState<ShardBalances>(() => getAllShardsPurchased());
  const [spending, setSpending] = useState<AdvisorId | null>(null);

  const refresh = useCallback(() => {
    setBalances(getAllShardBalances());
    setPurchased(getAllShardsPurchased());
  }, []);

  useEffect(() => {
    void syncAdvisorShards().then(refresh);

    const handler = () => refresh();
    window.addEventListener(SHARDS_UPDATED_EVENT, handler);
    window.addEventListener('profileUpdated', handler);
    return () => {
      window.removeEventListener(SHARDS_UPDATED_EVENT, handler);
      window.removeEventListener('profileUpdated', handler);
    };
  }, [refresh]);

  const spend = useCallback(
    async (id: AdvisorId, amount: number = SHARD_COST_PER_LIFELINE) => {
      setSpending(id);
      try {
        const res = await spendAdvisorShards(id, amount);
        refresh();
        return res;
      } finally {
        setSpending(null);
      }
    },
    [refresh],
  );

  return { balances, purchased, spend, spending, refresh, cost: SHARD_COST_PER_LIFELINE };
};
