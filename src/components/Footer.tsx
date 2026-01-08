
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Play, Users, User, FileText, Shield, Lock, Map, UserPlus, Book, HelpCircle, Grid2X2, Search } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-8 border-t border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* First Column - Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="text-muted-foreground hover:text-foreground flex items-center">
                  <Play className="w-4 h-4 mr-2" />
                  Play Quiz
                </Link>
              </li>
              <li>
                <Link to="/referral" className="text-muted-foreground hover:text-foreground flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Referral Dashboard
                </Link>
              </li>
              <li>
                <Link to="/referral-program" className="text-muted-foreground hover:text-foreground flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Referral Program
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-muted-foreground hover:text-foreground flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Second Column - Content Pages */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground flex items-center">
                  <Book className="w-4 h-4 mr-2" />
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground flex items-center">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-muted-foreground hover:text-foreground flex items-center">
                  <Grid2X2 className="w-4 h-4 mr-2" />
                  Quiz Categories
                </Link>
              </li>
              <li>
                <Link to="/browse" className="text-muted-foreground hover:text-foreground flex items-center">
                  <Search className="w-4 h-4 mr-2" />
                  Browse Questions
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className="text-muted-foreground hover:text-foreground flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Game Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="/sitemap.xml" className="text-muted-foreground hover:text-foreground flex items-center">
                  <Map className="w-4 h-4 mr-2" />
                  Sitemap
                </a>
              </li>
            </ul>
          </div>
          
          {/* Third Column - Summary */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold mb-4">About CuizIN</h3>
            <p className="text-muted-foreground">
              CuizIN is a completely free quiz platform. Players can earn a fixed monthly income 
              by completing assigned tasks and maintaining active play. No payment is required to start 
              playing and earning rewards.
            </p>
            <p className="text-muted-foreground">
              <Link to="/referral-program" className="text-primary hover:underline">
                Refer friends and build your team
              </Link> to increase your monthly earnings.
            </p>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} Cuiz<span className="text-green-500">IN</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
