
import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { History, Eye, ArrowLeft, ArrowRight } from 'lucide-react';
import { AdSlotVersion } from './hooks/useAdSlotEditor';
import { formatDistance } from 'date-fns';
import { PaginatedDataTable } from '@/components/ui/paginated-data-table';

interface AdSlotVersionHistoryProps {
  slotId: string;
  slotName: string;
}

export const AdSlotVersionHistory: React.FC<AdSlotVersionHistoryProps> = ({ slotId, slotName }) => {
  const [versions, setVersions] = useState<AdSlotVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AdSlotVersion | null>(null);
  const [showVersionDetails, setShowVersionDetails] = useState(false);
  
  const fetchVersions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('ad_slot_versions')
        .select('*')
        .eq('slot_id', slotId)
        .order('version_number', { ascending: false });
        
      if (error) throw error;
      
      setVersions(data || []);
    } catch (err) {
      console.error('Error fetching versions:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (slotId) {
      fetchVersions();
    }
  }, [slotId]);
  
  const handleViewVersion = (version: AdSlotVersion) => {
    setSelectedVersion(version);
    setShowVersionDetails(true);
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  const getTimeSince = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
    } catch (e) {
      return 'unknown time';
    }
  };
  
  const columns = [
    {
      header: "Version",
      accessorKey: "version_number",
      cell: (row: any) => (
        <span className="font-medium">V{row.getValue()}</span>
      )
    },
    {
      header: "Created",
      accessorKey: "created_at",
      cell: (row: any) => (
        <span title={formatDate(row.getValue())}>
          {getTimeSince(row.getValue())}
        </span>
      )
    },
    {
      header: "Change Notes",
      accessorKey: "version_notes",
      cell: (row: any) => (
        <span className="text-sm truncate max-w-xs block">
          {row.getValue() || 'No notes provided'}
        </span>
      )
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row: any) => {
        const version = versions.find(v => v.id === row.getValue());
        return (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => version && handleViewVersion(version)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        );
      }
    }
  ];
  
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-1" /> Version History
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Version History for "{slotName}"</DialogTitle>
            <DialogDescription>
              View previous versions of this ad slot
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <PaginatedDataTable
              columns={columns}
              data={versions}
              isLoading={isLoading}
              pageSize={5}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showVersionDetails} onOpenChange={setShowVersionDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Version {selectedVersion?.version_number} Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p>{formatDate(selectedVersion.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="capitalize">{selectedVersion.position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p>{selectedVersion.active ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p>{selectedVersion.version_notes || 'No notes provided'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ad Code</p>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                  <pre className="text-xs">{selectedVersion.code}</pre>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const currentIndex = versions.findIndex(v => v.id === selectedVersion.id);
                    if (currentIndex < versions.length - 1) {
                      setSelectedVersion(versions[currentIndex + 1]);
                    }
                  }}
                  disabled={versions.findIndex(v => v.id === selectedVersion.id) === versions.length - 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Older
                </Button>
                
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    const currentIndex = versions.findIndex(v => v.id === selectedVersion.id);
                    if (currentIndex > 0) {
                      setSelectedVersion(versions[currentIndex - 1]);
                    }
                  }}
                  disabled={versions.findIndex(v => v.id === selectedVersion.id) === 0}
                >
                  Newer
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
