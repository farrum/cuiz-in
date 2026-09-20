
import React from 'react';
import { Crown, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GooglePlayBadge } from '@/components/app-promo/GooglePlay';

const CallToAction: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-5xl mx-auto my-8 p-8 md:p-12 scroll-paper rounded-3xl text-center border-2 border-amber-600/40 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-600/30 text-amber-900 text-xs font-black font-cinzel mb-4 shadow-sm">
        <Crown className="w-4 h-4 text-amber-600" />
        <span>Ascend to the Curia Regis</span>
      </div>

      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-4 font-cinzel text-amber-950 drop-shadow-sm">
        Ready to Conquer the Realm of Knowledge?
      </h2>
      <p className="max-w-xl mx-auto mb-8 text-sm sm:text-base text-amber-900/80 font-semibold leading-relaxed">
        Join thousands of scholars and knights competing for imperial glory, daily bounties, and legendary advisor ranks!
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
        <button 
          type="button"
          onClick={() => navigate('/register')} 
          className="btn-royal-gold text-sm font-black px-8 py-4 rounded-xl uppercase tracking-wider flex items-center justify-center cursor-pointer shadow-xl w-full sm:w-auto"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Embark On Thy Quest Now
          <ArrowRight className="ml-2 w-4 h-4" />
        </button>
        <GooglePlayBadge size="lg" />
      </div>

      <p className="mt-6 text-xs font-bold text-amber-900/60">
        Play seamlessly on web or download the free CuizIN Android app on Google Play.
      </p>
    </div>
  );
};

export default CallToAction;
