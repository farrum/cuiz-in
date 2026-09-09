
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Play, Users, User, FileText, Shield, Lock, Map, UserPlus, Book, HelpCircle, Grid2X2, Search, Compass, Layers, ShieldCheck, Library, CheckCircle } from 'lucide-react';
import { AppDownloadCard } from '@/components/app-promo/GooglePlay';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  // Static category links — important for crawler depth & internal linking SEO
  const seoCategories: { name: string; slug: string }[] = [
    { name: 'General Knowledge', slug: 'general-knowledge' },
    { name: 'History', slug: 'history' },
    { name: 'Geography', slug: 'geography' },
    { name: 'Science & Nature', slug: 'science-nature' },
    { name: 'Entertainment', slug: 'entertainment' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Cricket', slug: 'cricket' },
    { name: 'Arts & Literature', slug: 'arts-and-literature' },
    { name: 'Mythology', slug: 'mythology' },
    { name: 'Films', slug: 'entertainment-film' },
    { name: 'Television', slug: 'entertainment-television' },
    { name: 'Music', slug: 'entertainment-music' },
    { name: 'Video Games', slug: 'entertainment-video-games' },
    { name: 'Computers', slug: 'science-computers' },
  ];
  
  return (
    <footer className="py-12 border-t border-amber-800/40 bg-[#16120E] text-amber-100/80 shadow-2xl relative" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto px-4">
        {/* Google Play app promo */}
        <AppDownloadCard className="mb-8" />

        {/* SEO: Static category link grid for crawler depth */}
        <nav aria-label="Quiz categories" className="mb-8 pb-8 border-b border-amber-800/30">
          <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 font-cinzel mb-4">
            👑 Browse Realm Knowledge Categories
          </h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2 text-xs" role="list">
            <li>
              <Link to="/gk-quiz" className="text-amber-300 hover:underline font-bold">
                GK Quiz
              </Link>
            </li>
            <li>
              <Link to="/cricket-quiz" className="text-amber-300 hover:underline font-bold">
                Cricket Quiz
              </Link>
            </li>
            <li>
              <Link to="/bollywood-quiz" className="text-amber-300 hover:underline font-bold">
                Bollywood Quiz
              </Link>
            </li>
            {seoCategories.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`/categories/${c.slug}`}
                  className="text-amber-200/60 hover:text-amber-300 transition-colors font-medium"
                >
                  {c.name} Quiz
                </Link>
              </li>
            ))}
            <li>
              <Link to="/categories" className="text-amber-400 hover:underline font-bold">
                View all categories →
              </Link>
            </li>
          </ul>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* First Column - Navigation Links */}
          <nav className="space-y-3" aria-label="Quick links">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 font-cinzel mb-4">
              Citadel Portals
            </h3>
            <ul className="space-y-2 text-xs" role="list">
              <li>
                <Link to="/" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Home className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Citadel Home
                </Link>
              </li>
              <li>
                <Link to="/quiz" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Play className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Play Quiz &amp; Quests
                </Link>
              </li>
              <li>
                <Link to="/referral" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Users className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Squad &amp; Covenant
                </Link>
              </li>
              <li>
                <Link to="/referral-program" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <UserPlus className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Recruitment Program
                </Link>
              </li>
              <li>
                <Link to="/minigames" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Play className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Mini-Games Arcade
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <User className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Royal Crest &amp; Profile
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Second Column - Content Pages */}
          <nav className="space-y-3" aria-label="Resources">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 font-cinzel mb-4">
              Archives &amp; Decrees
            </h3>
            <ul className="space-y-2 text-xs" role="list">
              <li>
                <Link to="/blog" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Book className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Chronicles (Blog)
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <HelpCircle className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Scholar FAQ
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Grid2X2 className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Quiz Categories
                </Link>
              </li>
              <li>
                <Link to="/browse" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Search className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Browse Questions
                </Link>
              </li>
              <li>
                <Link to="/gk-questions" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Search className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  GK Questions &amp; Answers
                </Link>
              </li>
              <li>
                <Link to="/editorial-policy" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <ShieldCheck className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Editorial Policy
                </Link>
              </li>
              <li>
                <Link to="/our-sources" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Library className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Scholarly Sources
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <FileText className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-amber-200/65 hover:text-amber-300 flex items-center transition-colors">
                  <Lock className="w-3.5 h-3.5 mr-2 text-amber-500" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Third Column - Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 font-cinzel mb-4">
              About The Citadel
            </h3>
            <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
              CuizIN is a completely free realm quiz platform. Scholars and warriors can earn rewards, unlock legendary councillors, and conquer historic dynasties. No deposit or payment is ever required to play.
            </p>
            <p className="text-xs text-amber-200/70">
              <Link to="/referral-program" className="text-amber-400 font-bold hover:underline">
                Recruit squadmates and build your alliance
              </Link> to forge recurring gems together.
            </p>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-10 pt-4 border-t border-amber-800/30">
          <p className="text-center text-xs text-amber-200/50">
            © {currentYear} Cuiz<span className="text-amber-400 font-black">IN</span>. All rights reserved across the Realms.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
