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
      
      {showNewsTicker && <NewsTicker className="mt-16" />}

      <main className={cn("flex-1", containerClassName)}>
        {children}
      </main>

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
