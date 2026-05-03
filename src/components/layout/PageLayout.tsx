import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import NewsTicker from '@/components/NewsTicker';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  hidePreFooterAd?: boolean;
  showNewsTicker?: boolean;
  className?: string;
  containerClassName?: string;
}

const PageLayout = ({ 
  children, 
  hidePreFooterAd = false, 
  showNewsTicker = false,
  className,
  containerClassName
}: PageLayoutProps) => {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background", className)}>
      <Header />
      
      {/* 
        The header is 'fixed' (h-16 / 64px). 
        We need to push everything else down so it's not hidden behind it.
      */}
      <div className="flex-1 flex flex-col pt-16">
        {showNewsTicker && <NewsTicker />}

        <main className={cn("flex-1", containerClassName)}>
          {children}
        </main>
      </div>

      {!hidePreFooterAd && (
        <div className="container max-w-4xl mx-auto py-6">
          <SimpleAdBanner position="footer" slotId="global-prefooter" />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PageLayout;
