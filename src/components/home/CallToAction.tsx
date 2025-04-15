
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, DollarSign, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';

const CallToAction: React.FC = () => {
  const navigate = useNavigate();
  const currencyDisplay = useCurrencyDisplay();
  
  return (
    <div className="mt-12 p-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl text-white text-center">
      <h2 className="text-2xl font-bold mb-4">Ready to Start Earning?</h2>
      <p className="mb-2">Join thousands of users who are already earning rewards through CuizIN!</p>
      <p className="mb-6 text-xl">
        Earn up to {currencyDisplay.symbol}
        {(8000 * currencyDisplay.exchangeRate).toFixed(2)} {currencyDisplay.code} monthly!
      </p>
      <Button 
        size="lg" 
        onClick={() => navigate('/register')} 
        className="bg-white text-blue-600 hover:bg-gray-100"
      >
        Get Started Now
        <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
};

export default CallToAction;
