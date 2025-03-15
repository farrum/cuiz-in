
import React from 'react';
import { UserCheck, X, Clock } from 'lucide-react';
import { ReferralEntry } from '@/types/referral';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReferralTableProps {
  referrals: ReferralEntry[];
}

const ReferralTable: React.FC<ReferralTableProps> = ({ referrals }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <UserCheck className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Friend</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="text-right">Earned</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((ref) => (
            <TableRow key={ref.id}>
              <TableCell>
                <div className="font-medium">{ref.name}</div>
                <div className="text-xs text-muted-foreground">{ref.email}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(ref.status)}
                  <span className="capitalize">{ref.status}</span>
                </div>
              </TableCell>
              <TableCell>{formatDate(ref.lastActive)}</TableCell>
              <TableCell className="text-right">
                <div className="font-medium">₹{ref.totalEarned}</div>
                <div className="text-xs text-muted-foreground">
                  {ref.monthsActive} month{ref.monthsActive !== 1 ? 's' : ''}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReferralTable;
