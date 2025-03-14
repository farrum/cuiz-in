
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check, Edit, Layout, EyeOff, Eye, BadgeDollarSign } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AdSlot {
  id: string;
  name: string;
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  code: string;
  active: boolean;
  lastUpdated: string;
}

const defaultAdSlots: AdSlot[] = [
  { 
    id: 'quiz-top', 
    name: 'Quiz Page - Top Banner', 
    position: 'top', 
    code: '<div class="ad-banner">Your ad content here</div>', 
    active: true,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: 'quiz-middle-1', 
    name: 'Quiz Page - Middle Banner 1', 
    position: 'middle', 
    code: '<div class="ad-banner">Your ad content here</div>', 
    active: true,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: 'quiz-middle-2', 
    name: 'Quiz Page - Middle Banner 2', 
    position: 'middle', 
    code: '<div class="ad-banner">Your ad content here</div>', 
    active: true,
    lastUpdated: new Date().toISOString()
  },
  { 
    id: 'quiz-bottom', 
    name: 'Quiz Page - Bottom Banner', 
    position: 'bottom', 
    code: '<div class="ad-banner">Your ad content here</div>', 
    active: true,
    lastUpdated: new Date().toISOString()
  }
];

const AdminAdManagement: React.FC = () => {
  const { toast } = useToast();
  const [adSlots, setAdSlots] = useState<AdSlot[]>([]);
  const [editingSlot, setEditingSlot] = useState<AdSlot | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  useEffect(() => {
    // Initialize ad slots from localStorage or use defaults
    const savedSlots = localStorage.getItem('quiz_app_ad_slots');
    if (savedSlots) {
      setAdSlots(JSON.parse(savedSlots));
    } else {
      setAdSlots(defaultAdSlots);
      localStorage.setItem('quiz_app_ad_slots', JSON.stringify(defaultAdSlots));
    }
  }, []);
  
  const handleToggleActive = (id: string) => {
    const updatedSlots = adSlots.map(slot => {
      if (slot.id === id) {
        return { ...slot, active: !slot.active, lastUpdated: new Date().toISOString() };
      }
      return slot;
    });
    
    setAdSlots(updatedSlots);
    localStorage.setItem('quiz_app_ad_slots', JSON.stringify(updatedSlots));
    
    toast({
      title: "Ad Slot Updated",
      description: `The ad slot has been ${updatedSlots.find(s => s.id === id)?.active ? 'activated' : 'deactivated'}.`,
    });
  };
  
  const startEditing = (slot: AdSlot) => {
    setEditingSlot({ ...slot });
  };
  
  const cancelEditing = () => {
    setEditingSlot(null);
  };
  
  const saveAdSlot = () => {
    if (!editingSlot) return;
    
    const updatedSlots = adSlots.map(slot => {
      if (slot.id === editingSlot.id) {
        return { ...editingSlot, lastUpdated: new Date().toISOString() };
      }
      return slot;
    });
    
    setAdSlots(updatedSlots);
    localStorage.setItem('quiz_app_ad_slots', JSON.stringify(updatedSlots));
    setEditingSlot(null);
    
    toast({
      title: "Ad Slot Updated",
      description: "Your changes have been saved successfully.",
    });
  };
  
  const handleInputChange = (key: keyof AdSlot, value: string | boolean) => {
    if (!editingSlot) return;
    
    setEditingSlot({
      ...editingSlot,
      [key]: value
    });
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ad Management</h2>
          <p className="text-muted-foreground">Manage advertisement slots throughout the app</p>
        </div>
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
      
      <Tabs defaultValue="top" className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="top">Top</TabsTrigger>
          <TabsTrigger value="middle">Middle</TabsTrigger>
          <TabsTrigger value="bottom">Bottom</TabsTrigger>
          <TabsTrigger value="all">All Slots</TabsTrigger>
        </TabsList>
        
        {['top', 'middle', 'bottom'].map(position => (
          <TabsContent key={position} value={position} className="space-y-4">
            {adSlots
              .filter(slot => slot.position === position)
              .map(slot => (
                <Card key={slot.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{slot.name}</CardTitle>
                        <CardDescription>Position: {slot.position}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={slot.active}
                          onCheckedChange={() => handleToggleActive(slot.id)}
                          id={`active-${slot.id}`}
                        />
                        <Label htmlFor={`active-${slot.id}`}>
                          {slot.active ? 'Active' : 'Inactive'}
                        </Label>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {previewMode ? (
                      <div className="bg-secondary/30 border border-secondary rounded-md p-3 min-h-[100px]">
                        <div className="text-xs text-muted-foreground mb-2 text-center">Advertisement Preview</div>
                        <div dangerouslySetInnerHTML={{ __html: slot.code }} />
                      </div>
                    ) : (
                      <div className="font-mono text-xs bg-secondary/10 p-3 rounded-md overflow-x-auto max-h-[200px]">
                        {slot.code}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      Last updated: {formatDate(slot.lastUpdated)}
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => startEditing(slot)}
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Ad Code
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </TabsContent>
        ))}
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adSlots.map(slot => (
              <Card key={slot.id} className={slot.active ? "" : "opacity-60"}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{slot.name}</CardTitle>
                    <Switch
                      checked={slot.active}
                      onCheckedChange={() => handleToggleActive(slot.id)}
                      id={`all-active-${slot.id}`}
                    />
                  </div>
                  <CardDescription>Position: {slot.position}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => startEditing(slot)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {editingSlot && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Edit Ad Slot: {editingSlot.name}</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="ad-name">Ad Name</Label>
                  <Input
                    id="ad-name"
                    value={editingSlot.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ad-position">Position</Label>
                  <select
                    id="ad-position"
                    value={editingSlot.position}
                    onChange={(e) => handleInputChange('position', e.target.value as any)}
                    className="w-full p-2 rounded-md border border-border bg-background"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                    <option value="sidebar">Sidebar</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="ad-code">Ad Code</Label>
                  <Textarea
                    id="ad-code"
                    value={editingSlot.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the HTML/JavaScript code for this advertisement.
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingSlot.active}
                    onCheckedChange={(checked) => handleInputChange('active', checked)}
                    id="edit-active"
                  />
                  <Label htmlFor="edit-active">Active</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button onClick={saveAdSlot}>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdManagement;
