
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import UserLogin from '@/components/UserLogin';

const LoginPage: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        <div className="animated-bg top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/20" />
        <div className="animated-bg bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/20" />
        
        <div className="max-w-3xl w-full mx-auto text-center z-10">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Home
            </Link>
            
            <UserLogin />
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
};

export default LoginPage;
