import React from 'react';
import { cn } from '@/lib/utils';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.geologon.cuiz';

interface HouseBannerProps {
  /** 'banner' = wide strip, 'box' = 300x250-ish sidebar/interstitial block. */
  variant?: 'banner' | 'box';
  className?: string;
}

const PROMOS = [
  {
    title: 'Get CuizIN on Google Play',
    body: 'Play offline-friendly quizzes, daily mini-games and keep your streak alive.',
    cta: 'Install the app',
    href: PLAY_STORE_URL,
  },
  {
    title: 'Daily Challenge is live',
    body: 'A fresh themed quiz every day with double gem rewards.',
    cta: 'Play today’s challenge',
    href: '/quiz',
  },
  {
    title: 'Invite friends, earn together',
    body: 'Build your squad and collect recurring gems from every recruit.',
    cta: 'Open referrals',
    href: '/referral',
  },
];

/**
 * In-house promo shown when the ad network returns no creative, so pages never
 * carry a blank ad band.
 */
const HouseBanner: React.FC<HouseBannerProps> = ({ variant = 'banner', className }) => {
  const promo = React.useMemo(
    () => PROMOS[Math.floor(Math.random() * PROMOS.length)],
    []
  );

  const isExternal = promo.href.startsWith('http');

  return (
    <a
      href={promo.href}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(
        'group block w-full rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/40',
        variant === 'banner'
          ? 'flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'
          : 'flex flex-col gap-2 p-4',
        className
      )}
      data-house-banner="true"
    >
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          From CuizIN
        </p>
        <p className="text-sm font-semibold leading-snug">{promo.title}</p>
        <p className="text-xs text-muted-foreground leading-snug">{promo.body}</p>
      </div>
      <span className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
        {promo.cta}
      </span>
    </a>
  );
};

export default HouseBanner;
