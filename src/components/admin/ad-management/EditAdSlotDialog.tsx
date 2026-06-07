
// File: src/components/admin/ad-management/EditAdSlotDialog.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from 'react-hook-form';

interface EditAdSlotDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSlot: any;
  isCreatingNew: boolean;
  form: UseFormReturn<any>;
  onCancel: () => void;
  onSave: () => void;
}

const EditAdSlotDialog: React.FC<EditAdSlotDialogProps> = ({
  isOpen,
  onOpenChange,
  editingSlot,
  isCreatingNew,
  form,
  onCancel,
  onSave
}) => {
  if (!editingSlot) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreatingNew ? "Create New Ad Slot" : "Edit Ad Slot"}</DialogTitle>
          <DialogDescription>
            {isCreatingNew 
              ? "Configure a new ad slot to display on your site" 
              : `Update ad slot ${editingSlot.name}. This will create a new version.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ad slot name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="middle">Middle</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="app-banner">App Banner</SelectItem>
                      <SelectItem value="app-interstitial">App Interstitial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Banner Size</FormLabel>
              <Select 
                value={(() => {
                  const code = form.getValues('code') || '';
                  const match = code.match(/<!-- size: (\d+x\d+) -->/);
                  return match ? match[1] : '728x90';
                })()} 
                onValueChange={(val) => {
                  const currentCode = form.getValues('code') || '';
                  const newCode = currentCode.replace(/<!-- size: \d+x\d+ -->\n?/, '');
                  form.setValue('code', `<!-- size: ${val} -->\n${newCode.trim()}`);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="728x90">Leaderboard (728x90)</SelectItem>
                  <SelectItem value="300x250">Medium Rectangle (300x250)</SelectItem>
                  <SelectItem value="320x50">Mobile Banner (320x50)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Define the dimensions for the placeholder banner</FormDescription>
            </FormItem>
            
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Code</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste your ad code here" 
                      className="min-h-[200px] font-mono text-sm"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Active
                    </FormLabel>
                    <FormDescription>
                      Display this ad on your site
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {!isCreatingNew && (
              <FormField
                control={form.control}
                name="version_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add notes about this version (optional)" 
                        className="min-h-[60px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={onSave}>
            {isCreatingNew ? "Create Ad Slot" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdSlotDialog;

// Missing FormDescription import
const FormDescription = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-sm text-muted-foreground">{children}</div>;
};
