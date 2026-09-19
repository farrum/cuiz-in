import React from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAdvisorShards } from '@/hooks/useAdvisorShards';
import {
  ADVISOR_LIFELINES,
  AdvisorId,
  SHARD_COST_PER_LIFELINE,
  type LifelineKind,
} from '@/utils/advisorShards';

export interface AdvisorLifelineBarProps {
  /** Fires after the shards have been successfully spent. */
  onUse: (kind: LifelineKind, advisorId: AdvisorId) => void;
  /** Lifelines already used on the current question. */
  used?: AdvisorId[];
  /** Kinds this play mode cannot support (e.g. extra time with no clock). */
  unsupported?: LifelineKind[];
  disabled?: boolean;
  /** Dark medieval styling for the mobile story screens. */
  variant?: 'light' | 'dark';
  className?: string;
}

/**
 * Royal Council lifeline bar. Each advisor's power costs
 * SHARD_COST_PER_LIFELINE shards of that advisor, spent server-side.
 */
export const AdvisorLifelineBar: React.FC<AdvisorLifelineBarProps> = ({
  onUse,
  used = [],
  unsupported = [],
  disabled = false,
  variant = 'light',
  className,
}) => {
  const { toast } = useToast();
  const { balances, spend, spending } = useAdvisorShards();

  const handleClick = async (advisorId: AdvisorId, kind: LifelineKind, name: string) => {
    if (disabled || spending) return;

    if ((balances[advisorId] || 0) < SHARD_COST_PER_LIFELINE) {
      toast({
        title: 'Not enough shards',
        description: `${name} needs ${SHARD_COST_PER_LIFELINE} shards. Forge more from the Royal Council.`,
        variant: 'destructive',
      });
      return;
    }

    const res = await spend(advisorId);
    if (!res.ok) {
      toast({
        title: 'Counsel refused',
        description: res.error || 'Could not spend those shards. Try again.',
        variant: 'destructive',
      });
      return;
    }
    onUse(kind, advisorId);
  };

  const isDark = variant === 'dark';

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider mb-2',
          isDark ? 'text-amber-200/70' : 'text-muted-foreground',
        )}
      >
        <span>🏰 Royal Council</span>
        <span className={cn('ml-auto font-bold', isDark ? 'text-amber-300/80' : 'text-amber-600')}>
          {SHARD_COST_PER_LIFELINE} shards per use
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ADVISOR_LIFELINES.map((advisor) => {
          const balance = balances[advisor.id] || 0;
          const alreadyUsed = used.includes(advisor.id);
          const notSupported = unsupported.includes(advisor.kind);
          const affordable = balance >= SHARD_COST_PER_LIFELINE;
          const isDisabled = disabled || alreadyUsed || notSupported || !affordable || !!spending;

          return (
            <button
              key={advisor.id}
              type="button"
              disabled={isDisabled}
              onClick={() => handleClick(advisor.id, advisor.kind, advisor.shortName)}
              title={
                notSupported
                  ? 'Not available in this mode'
                  : alreadyUsed
                  ? 'Already used on this question'
                  : `${advisor.hint} · ${SHARD_COST_PER_LIFELINE} shards`
              }
              className={cn(
                'rounded-xl px-2 py-2 border text-center transition-all active:scale-95',
                isDark
                  ? 'bg-black/35 border-amber-700/30'
                  : 'bg-card border-border hover:border-primary/40',
                isDisabled && 'opacity-45 cursor-not-allowed active:scale-100',
              )}
            >
              <span className="block text-base leading-none">{advisor.emoji}</span>
              <span
                className={cn(
                  'block text-[10px] font-black mt-1 leading-tight',
                  isDark ? advisor.accent : 'text-foreground',
                )}
              >
                {advisor.ability}
              </span>
              <span
                className={cn(
                  'block text-[9px] font-semibold mt-0.5',
                  affordable
                    ? isDark
                      ? 'text-amber-200/70'
                      : 'text-muted-foreground'
                    : 'text-destructive',
                )}
              >
                {alreadyUsed ? 'Used' : notSupported ? 'N/A here' : `${balance} shards`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdvisorLifelineBar;
