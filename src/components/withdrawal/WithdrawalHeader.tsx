
import React from 'react';
import { IndianRupee } from 'lucide-react';

const WithdrawalHeader: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 mb-6">
      <div className="bg-primary/10 p-3 rounded-full">
        <IndianRupee className="w-6 h-6 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-medium">Cash Withdrawal</h3>
        <p className="text-sm text-muted-foreground">Convert your points to cash</p>
      </div>
    </div>
  );
};

export default WithdrawalHeader;
