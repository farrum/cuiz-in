
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GooglePlayBadge } from '@/components/app-promo/GooglePlay';

const CallToAction: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="mt-8 p-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white text-center">
      <h2 className="text-2xl font-bold mb-4">Ready to Test Your Knowledge?</h2>
      <p className="mb-6">Join thousands of players who are already competing on CuizIN!</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button 
          size="lg" 
          onClick={() => navigate('/register')} 
          className="bg-white text-blue-600 hover:bg-gray-100"
        >
          Get Started Now
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
        <GooglePlayBadge size="lg" />
      </div>
      <p className="mt-4 text-sm text-white/80">Prefer your phone? Download the CuizIN Android app free on Google Play.</p>
    </div>
  );
};

export default CallToAction;
