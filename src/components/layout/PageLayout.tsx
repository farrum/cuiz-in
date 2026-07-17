import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import NewsTicker from '@/components/NewsTicker';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';

interface PageLayoutProps {
  children: React.ReactNode;
  hidePreFooterAd?: boolean;
  showNewsTicker?: boolean;
  className?: string;
  containerClassName?: string;
}

const isMobile =
  import.meta.env.VITE_PLATFORM === 'mobile' ||
  (() => {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  })() ||
  (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mobile') === '1');

const PageLayout = ({ 
  children, 
  hidePreFooterAd = false, 
  showNewsTicker = false,
  className,
  containerClassName
}: PageLayoutProps) => {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background glass-diamond-bg", className)}>
      {!isMobile && <Header />}
      
      {/* 
        The header is 'fixed' (h-16 / 64px) on desktop web. 
        We only push everything else down if not on mobile.
      */}
      <div className={cn("flex-1 flex flex-col", !isMobile && "pt-16")}>
        {showNewsTicker && <NewsTicker />}

        <main className={cn("flex-1", containerClassName)}>
          {children}
        </main>
      </div>

      {!hidePreFooterAd && !isMobile && (
        <div className="container max-w-4xl mx-auto py-6 hidden md:block">
          <SimpleAdBanner position="footer" slotId="global-prefooter" />
        </div>
      )}

      {!isMobile && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}

      {/* Spacer so mobile bottom nav doesn't overlap content */}
      {!isMobile && <div className="h-20 md:hidden" aria-hidden="true" />}

      {!isMobile && <MobileBottomNav />}
    </div>
  );
};

export default PageLayout;
