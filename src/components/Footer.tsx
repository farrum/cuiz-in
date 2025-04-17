
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-6 border-t border-border mt-auto">
      <div className="container max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold mb-4">About CuizIN</h3>
            <p className="text-sm text-muted-foreground">
              A free quiz platform where users can earn fixed monthly income by completing quizzes,
              challenges, and referring friends. No payment required to start.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li><Link to="/quiz" className="text-muted-foreground hover:text-foreground">Quiz</Link></li>
              <li><Link to="/referral-program" className="text-muted-foreground hover:text-foreground">Referral Program</Link></li>
              <li><Link to="/how-to-play" className="text-muted-foreground hover:text-foreground">How to Play</Link></li>
              <li><Link to="/login" className="text-muted-foreground hover:text-foreground">Login</Link></li>
              <li><Link to="/register" className="text-muted-foreground hover:text-foreground">Register</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Content</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
              <li><Link to="/categories" className="text-muted-foreground hover:text-foreground">Categories</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
              <li><Link to="/disclaimer" className="text-muted-foreground hover:text-foreground">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} Cuiz<span className="text-green-500">IN</span>. All rights reserved.
          </p>
          
          <div className="flex space-x-4">
            <a href="https://facebook.com/cuizin" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              Facebook
            </a>
            <a href="https://twitter.com/cuizin" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              Twitter
            </a>
            <a href="https://instagram.com/cuizin" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
