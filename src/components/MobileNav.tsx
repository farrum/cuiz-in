
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Home, User, Award, Gift, LogIn, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';

const MobileNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = localStorage.getItem(STORAGE_KEYS.USER_NAME) !== null;
  const isAdmin = localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };
  
  const closeMenu = () => {
    setIsOpen(false);
  };
  
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    closeMenu();
    window.location.href = '/';
  };
  
  return (
    <div className="md:hidden">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMenu} 
        className="z-50 relative"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>
      
      {/* Slide-in menu */}
      <div 
        className={`fixed inset-0 bg-background z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full pt-16 px-6">
          <div className="space-y-1 flex-1">
            <Link 
              to="/" 
              className="flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors"
              onClick={closeMenu}
            >
              <Home className="mr-3 h-5 w-5" />
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/quiz" 
                  className="flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors"
                  onClick={closeMenu}
                >
                  <Award className="mr-3 h-5 w-5" />
                  Quiz
                </Link>
                
                <Link 
                  to="/profile" 
                  className="flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors"
                  onClick={closeMenu}
                >
                  <User className="mr-3 h-5 w-5" />
                  Profile
                </Link>
                
                <Link 
                  to="/referral" 
                  className="flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors"
                  onClick={closeMenu}
                >
                  <Gift className="mr-3 h-5 w-5" />
                  Referrals
                </Link>
                
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    className="flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors"
                    onClick={closeMenu}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    Admin
                  </Link>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full text-left p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors text-red-500"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors"
                  onClick={closeMenu}
                >
                  <LogIn className="mr-3 h-5 w-5" />
                  Login
                </Link>
                
                <Link 
                  to="/register" 
                  className="flex items-center p-3 text-lg rounded-md hover:bg-secondary/50 transition-colors"
                  onClick={closeMenu}
                >
                  <User className="mr-3 h-5 w-5" />
                  Register
                </Link>
              </>
            )}
          </div>
          
          <div className="py-4 border-t">
            <p className="text-xs text-center text-muted-foreground">© 2023 Quiz Points</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
