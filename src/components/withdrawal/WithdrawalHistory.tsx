
import React from 'react';
import { WithdrawalRequest } from '@/types/withdrawal';

interface WithdrawalHistoryProps {
  withdrawals: WithdrawalRequest[];
}

const WithdrawalHistory: React.FC<WithdrawalHistoryProps> = ({ withdrawals }) => {
  if (withdrawals.length === 0) return null;

  return (
    <div className="mt-8">
      <h4 className="font-medium mb-3">Recent Withdrawals</h4>
      
      <div className="space-y-3">
        {withdrawals.map((withdrawal) => (
          <div 
            key={withdrawal.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-secondary"
          >
            <div>
              <div className="font-medium">₹{withdrawal.amount.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(withdrawal.date).toLocaleDateString()}
                {withdrawal.type === 'achievement' && (
                  <span className="ml-2 px-1 bg-primary/10 text-primary rounded text-xs">
                    Reward
                  </span>
                )}
              </div>
            </div>
            <div>
              {withdrawal.status === 'completed' ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Completed
                </span>
              ) : withdrawal.status === 'rejected' ? (
                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                  Rejected
                </span>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                  Awaiting Approval
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WithdrawalHistory;
