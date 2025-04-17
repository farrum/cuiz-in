
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import MobileNav from './MobileNav';
import { useRouteChangeListener } from '@/hooks/useRouteChangeListener';
import { Button } from './ui/button';
import { STORAGE_KEYS } from '@/utils/quizData';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkLoginStatus = () => {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      setIsLoggedIn(!!userId);
    };

    checkLoginStatus();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('storage', checkLoginStatus);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  useRouteChangeListener(() => {
    setShowMobileNav(false);
  });

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/95 backdrop-blur-sm border-b' : 'bg-transparent'
      }`}
    >
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold">Cuiz<span className="text-green-500">IN</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className={`text-sm ${location.pathname === '/' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
            Home
          </Link>
          <Link to="/quiz" className={`text-sm ${location.pathname === '/quiz' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
            Quiz
          </Link>
          <Link to="/categories" className={`text-sm ${location.pathname === '/categories' || location.pathname.startsWith('/categories/') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
            Categories
          </Link>
          <Link to="/blog" className={`text-sm ${location.pathname === '/blog' || location.pathname.startsWith('/blog/') ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
            Blog
          </Link>
          <Link to="/faq" className={`text-sm ${location.pathname === '/faq' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
            FAQ
          </Link>

          {isLoggedIn ? (
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild size="sm">
                <Link to="/referral">Referral</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/profile">Profile</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden focus:outline-none"
          onClick={() => setShowMobileNav(!showMobileNav)}
          aria-label="Toggle menu"
        >
          {showMobileNav ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {showMobileNav && <MobileNav isLoggedIn={isLoggedIn} />}
    </header>
  );
};

export default Header;
