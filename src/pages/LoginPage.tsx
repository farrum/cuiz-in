import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import UserLogin from '@/components/UserLogin';

const LoginPage: React.FC = () => {
  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Login', '/login')
  ];

  return (
    <PageLayout containerClassName="relative flex flex-col items-center justify-center px-6 pt-8 pb-12">
      <SEO
        title="Login to CuizIN | Access Your Quiz Account"
        description="Login to your CuizIN account to play free quizzes across 10+ categories, climb the leaderboard, earn gems, track your daily streaks, and unlock exclusive rewards."
        canonicalUrl="https://cuiz.in/login"
        keywords={['login', 'sign in', 'CuizIN login', 'quiz account']}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      
      <div className="animated-bg top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/20" />
      <div className="animated-bg bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/20" />
      
      <div className="max-w-3xl w-full mx-auto text-center z-10">
        {/* Visual Breadcrumb */}
        <Breadcrumb className="mb-6 justify-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/"><Home className="h-4 w-4" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Login</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Link>

          <h1 className="text-3xl md:text-4xl font-bold mb-2">Login to CuizIN</h1>
          <p className="text-muted-foreground mb-6">Sign in to continue playing quizzes and earning rewards.</p>

          <SimpleAdBanner position="top" className="mb-8" />
          
          <UserLogin />
          
          <SimpleAdBanner position="bottom" className="mt-8" />
        </div>
      </div>
    </PageLayout>
  );
};

export default LoginPage;
