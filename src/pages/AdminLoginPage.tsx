
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import AdminLogin from '@/components/admin/AdminLogin';

const AdminLoginPage: React.FC = () => {
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
            
            <AdminLogin />
          </div>
        </div>
      </div>
      
      <footer className="py-6 border-t border-border mt-auto">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cuiz<span className="text-green-500">IN</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
};

export default AdminLoginPage;
