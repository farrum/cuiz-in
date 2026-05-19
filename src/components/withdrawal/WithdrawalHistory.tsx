
import React from 'react';
import { WithdrawalRequest } from '@/types/withdrawal';

interface WithdrawalHistoryProps {
  withdrawals: WithdrawalRequest[];
  userId?: string;
}

const WithdrawalHistory: React.FC<WithdrawalHistoryProps> = ({ withdrawals, userId }) => {
  // Filter withdrawals by user ID if provided
  const filteredWithdrawals = userId 
    ? withdrawals.filter(withdrawal => withdrawal.userId === userId) 
    : withdrawals;

  if (filteredWithdrawals.length === 0) return null;

  // Map withdrawal types to display names
  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'achievement':
        return 'Bonus';
      case 'quiz':
        return 'Quiz Gems';
      case 'referral':
        return 'Referral Bonus';
      default:
        return null;
    }
  };

  return (
    <div className="mt-8">
      <h4 className="font-medium mb-3">Recent Withdrawals</h4>
      
      <div className="space-y-3">
        {filteredWithdrawals.map((withdrawal) => (
          <div 
            key={withdrawal.id} 
            className="flex items-center justify-between p-3 rounded-lg bg-secondary"
          >
            <div>
              <div className="font-medium">{withdrawal.amount} pts</div>
              <div className="text-xs text-muted-foreground">
                {new Date(withdrawal.date).toLocaleDateString()}
                {getTypeLabel(withdrawal.type) && (
                  <span className="ml-2 px-1 bg-primary/10 text-primary rounded text-xs">
                    {getTypeLabel(withdrawal.type)}
                  </span>
                )}
              </div>
            </div>
            <div>
              {withdrawal.status === 'completed' || withdrawal.status === 'approved' || withdrawal.status === 'paid' ? (
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
