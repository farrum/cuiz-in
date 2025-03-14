
import React from 'react';
import Header from '@/components/Header';
import AdminRedirect from '@/components/admin/AdminLogin';

const AdminLoginPage: React.FC = () => {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-12">
        <AdminRedirect />
      </div>
      
      <footer className="py-6 border-t border-border mt-auto">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} QuizPoints. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
};

export default AdminLoginPage;
