
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Plus, AlertTriangle } from 'lucide-react';
import {
  useAdSlots,
  useAdPerformance,
  useAdSlotEditor,
  AdPerformanceReports,
  AdSlotTabs,
  EditAdSlotDialog
} from './ad-management';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const AdminAdManagement: React.FC = () => {
  const [previewMode, setPreviewMode] = useState(false);
  const [showReports, setShowReports] = useState(false);
  
  // Fetch and manage ad slots
  const { 
    adSlots, 
    setAdSlots, 
    isLoading, 
    handleToggleActive 
  } = useAdSlots();
  
  // Fetch and manage ad performance data
  const { 
    adPerformance, 
    isLoadingReports, 
    fetchAdPerformance 
  } = useAdPerformance();
  
  // Handle ad slot editing
  const {
    editingSlot,
    isCreatingNew,
    form,
    startEditing,
    startCreatingNew,
    cancelEditing,
    saveAdSlot
  } = useAdSlotEditor(adSlots, setAdSlots);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading ad slots...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ad Management</h2>
          <p className="text-muted-foreground">Manage advertisement slots throughout the app</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Ad Performance Reports Button */}
          <AdPerformanceReports
            adPerformance={adPerformance}
            isLoading={isLoadingReports}
            showReports={showReports}
            fetchAdPerformance={fetchAdPerformance}
            setShowReports={setShowReports}
          />
          
          <Button 
            onClick={startCreatingNew}
            className="mr-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Ad Slot
          </Button>
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={previewMode}
              onCheckedChange={setPreviewMode}
              id="preview-mode"
            />
            <Label htmlFor="preview-mode">
              {previewMode ? (
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview Mode
                </div>
              ) : (
                <div className="flex items-center">
                  <EyeOff className="w-4 h-4 mr-1" />
                  Code Mode
                </div>
              )}
            </Label>
          </div>
        </div>
      </div>
      
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Instructions for Ad Scripts</AlertTitle>
        <AlertDescription>
          <p>For ad scripts to work properly:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Use standard script tags with proper loading attributes (async, defer) when needed</li>
            <li>Avoid document.write() as it may not execute properly in dynamic content</li>
            <li>Include both the initialization and display code for your ad networks</li>
            <li>Test your ad slots in various browsers and devices</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      {/* Ad Slots Tabs */}
      <AdSlotTabs
        adSlots={adSlots}
        previewMode={previewMode}
        onToggleActive={handleToggleActive}
        onEdit={startEditing}
        formatDate={formatDate}
        onCreateNew={startCreatingNew}
      />
      
      {/* Edit Ad Slot Dialog */}
      <EditAdSlotDialog
        isOpen={!!editingSlot}
        onOpenChange={(open) => !open && cancelEditing()}
        editingSlot={editingSlot}
        form={form}
        onCancel={cancelEditing}
        onSave={saveAdSlot}
        isCreatingNew={isCreatingNew}
      />
    </div>
  );
};

export default AdminAdManagement;
