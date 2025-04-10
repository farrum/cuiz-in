
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { Loader2, History, Eye, Lock, Unlock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface AdSlotVersion {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  created_at: string;
  slot_id: string;
  version_number: number;
  created_by: string | null;
  version_notes: string | null;
}

interface AdPerformanceData {
  views: number;
  clicks: number;
  ctr: number;
  start_date: string;
  end_date: string | null;
}

interface AdSlotVersionsProps {
  slotId: string;
  isOpen: boolean;
  onClose: () => void;
  currentVersion?: number | null;
}

const AdSlotVersions: React.FC<AdSlotVersionsProps> = ({ 
  slotId, 
  isOpen, 
  onClose,
  currentVersion
}) => {
  const { toast } = useToast();
  const [versions, setVersions] = useState<AdSlotVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<Record<string, AdPerformanceData>>({});
  const [selectedVersion, setSelectedVersion] = useState<AdSlotVersion | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (isOpen && slotId) {
      fetchVersions();
    }
  }, [isOpen, slotId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ad_slot_versions')
        .select('*')
        .eq('slot_id', slotId)
        .order('version_number', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setVersions(data);
        // Fetch performance data for each version
        await Promise.all(data.map(version => fetchPerformanceData(version.id)));
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: "Error",
        description: "Could not load ad slot versions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async (versionId: string) => {
    try {
      const { data, error } = await supabase
        .from('ad_version_performance')
        .select('*')
        .eq('version_id', versionId)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is fine
        throw error;
      }
      
      if (data) {
        setPerformanceData(prev => ({
          ...prev,
          [versionId]: {
            views: data.views || 0,
            clicks: data.clicks || 0,
            ctr: data.ctr || 0,
            start_date: data.start_date,
            end_date: data.end_date
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const handlePreview = (version: AdSlotVersion) => {
    setSelectedVersion(version);
    setPreviewOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Ad Slot Version History</DialogTitle>
            <DialogDescription>
              View all versions of this ad slot and their performance data
            </DialogDescription>
          </DialogHeader>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading versions...</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">
                  <div className="flex items-center">
                    <History className="mr-2 h-4 w-4" />
                    Version History
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Clicks</TableHead>
                        <TableHead>CTR</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map((version) => {
                        const performance = performanceData[version.id] || {
                          views: 0,
                          clicks: 0,
                          ctr: 0,
                          start_date: version.created_at,
                          end_date: null
                        };
                        return (
                          <TableRow key={version.id} className={version.version_number === currentVersion ? "bg-muted/50" : ""}>
                            <TableCell>
                              <div className="font-medium">v{version.version_number}</div>
                              {version.version_notes && (
                                <div className="text-xs text-muted-foreground">{version.version_notes}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {version.active ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {formatDate(version.created_at)}
                              {version.created_by && (
                                <div className="text-xs text-muted-foreground">by {version.created_by}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {performance.start_date && (
                                <div className="text-xs">
                                  {formatDate(performance.start_date)}
                                  <div className="text-muted-foreground">to</div>
                                  {performance.end_date ? formatDate(performance.end_date) : 'Present'}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{performance.views}</TableCell>
                            <TableCell>{performance.clicks}</TableCell>
                            <TableCell>
                              {performance.views > 0
                                ? `${((performance.clicks / performance.views) * 100).toFixed(2)}%`
                                : '0%'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePreview(version)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {versions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-6">
                            No version history available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Ad Preview - Version {selectedVersion?.version_number}</DialogTitle>
            <DialogDescription>
              Preview how this ad version appears
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-secondary/30 border border-secondary rounded-md p-4">
            <div className="text-xs text-muted-foreground mb-2 text-center">Advertisement Preview</div>
            {selectedVersion && (
              <div dangerouslySetInnerHTML={{ __html: selectedVersion.code }} />
            )}
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            <p>Position: {selectedVersion?.position}</p>
            <p>Created: {selectedVersion?.created_at && formatDate(selectedVersion.created_at)}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdSlotVersions;
