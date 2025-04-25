
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';

interface PageLayoutProps {
  children: React.ReactNode;
  hidePreFooterAd?: boolean;
}

const PageLayout = ({ children, hidePreFooterAd = false }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {children}
      
      {!hidePreFooterAd && (
        <div className="container mx-auto px-4 mb-8">
          <SimpleAdBanner position="bottom" className="w-full" />
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default PageLayout;
