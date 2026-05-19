
import React from 'react';
import { Star } from 'lucide-react';

const WithdrawalHeader: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <div className="bg-primary/10 p-3 rounded-full">
        <Star className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-medium">Gems Summary</h3>
        <p className="text-sm text-muted-foreground">Track your earned gems</p>
      </div>
    </div>
  );
};

export default WithdrawalHeader;
