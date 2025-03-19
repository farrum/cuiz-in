
import React from 'react';
import { AdPerformance } from './hooks/useAdPerformance';
import { DataTable } from '@/components/ui/data-table';
import { BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdPerformanceReportsProps {
  adPerformance: AdPerformance[];
  isLoading: boolean;
  showReports: boolean;
  fetchAdPerformance: () => Promise<void>;
  setShowReports: (show: boolean) => void;
}

const AdPerformanceReports: React.FC<AdPerformanceReportsProps> = ({
  adPerformance,
  isLoading,
  showReports,
  fetchAdPerformance,
  setShowReports
}) => {
  return (
    <>
      <Button 
        onClick={() => {
          if (showReports) {
            setShowReports(false);
          } else {
            setShowReports(true);
            fetchAdPerformance();
          }
        }}
        variant="outline"
      >
        <BarChart className="w-4 h-4 mr-1" />
        {showReports ? "Hide Reports" : "Show Reports"}
      </Button>
      
      {showReports && (
        <div className="glass rounded-xl p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">Ad Performance Reports</h3>
          
          <DataTable
            columns={[
              { header: 'Ad Name', accessorKey: 'ad_name' },
              { header: 'Position', accessorKey: 'ad_position' },
              { 
                header: 'Slot/Location', 
                accessorKey: 'slot_id',
                cell: (row) => row.slot_id || row.ad_position
              },
              {
                header: 'Page Section',
                accessorKey: 'page_section',
                cell: (row) => row.page_section || '-'
              },
              { 
                header: 'Impressions', 
                accessorKey: 'impressions',
                cell: (row) => row.impressions.toLocaleString()
              },
              { 
                header: 'Clicks', 
                accessorKey: 'clicks',
                cell: (row) => row.clicks.toLocaleString()
              },
              { 
                header: 'CTR', 
                accessorKey: 'ctr',
                cell: (row) => `${row.ctr.toFixed(2)}%`
              }
            ]}
            data={adPerformance}
            isLoading={isLoading}
          />
          
          <div className="text-sm text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      )}
    </>
  );
};

export default AdPerformanceReports;
