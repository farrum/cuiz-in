
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, User, Home } from 'lucide-react';
import { cn } from "@/utils/animations";

const Header: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll event to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300",
        scrolled 
          ? "glass shadow-sm backdrop-blur-md" 
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 animate-fade-in">
          <Award className="w-8 h-8 text-primary" />
          <span className="text-xl font-semibold">QuizPoints</span>
        </Link>
        
        <nav className="flex items-center space-x-1">
          {[
            { path: '/', label: 'Home', icon: <Home className="w-5 h-5" /> },
            { path: '/quiz', label: 'Play Quiz', icon: <Award className="w-5 h-5" /> },
            { path: '/profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
          ].map((item, index) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300",
                location.pathname === item.path
                  ? "text-primary-foreground bg-primary shadow-md"
                  : "text-foreground hover:bg-secondary",
                `animate-slide-up delay-[${index * 100}ms]`
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
