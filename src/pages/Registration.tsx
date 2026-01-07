
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UserRegistrationForm from '@/components/UserRegistrationForm';
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

const Registration: React.FC = () => {
  const location = useLocation();
  
  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Register', '/register')
  ];

  return (
    <main className="min-h-screen flex flex-col">
      <SEO
        title="Create Account | Join CuizIN Free Quiz Platform"
        description="Register for a free CuizIN account and start earning rewards by playing quizzes. No deposit required - play and earn today!"
        canonicalUrl="https://cuiz.in/register"
        keywords={['register', 'sign up', 'create account', 'CuizIN registration', 'free quiz account']}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        {/* Animated backgrounds */}
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
                <BreadcrumbPage>Register</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
            
            <UserRegistrationForm />
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
};

export default Registration;
