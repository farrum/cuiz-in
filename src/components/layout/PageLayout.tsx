
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  hidePreFooterAd?: boolean;
}

const PageLayout = ({ children, hidePreFooterAd = false }: PageLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {children}
      
      {/* ADS DISABLED FOR SECURITY - all ad rendering removed sitewide */}
      
      <Footer />
    </div>
  );
};

export default PageLayout;
