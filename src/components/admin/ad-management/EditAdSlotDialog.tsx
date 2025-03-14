
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Check } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
}

interface EditAdSlotDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSlot: AdSlot | null;
  form: UseFormReturn<AdSlot>;
  onCancel: () => void;
  onSave: () => void;
}

const EditAdSlotDialog: React.FC<EditAdSlotDialogProps> = ({
  isOpen,
  onOpenChange,
  editingSlot,
  form,
  onCancel,
  onSave
}) => {
  if (!editingSlot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Ad Slot: {editingSlot.name}</DialogTitle>
          <DialogDescription>
            Update the details and ad code for this advertisement slot.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Name</FormLabel>
                  <FormControl>
                    <Input
                      id="ad-name"
                      {...field}
                    />
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
                  <FormControl>
                    <select
                      id="ad-position"
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full p-2 rounded-md border border-border bg-background"
                    >
                      <option value="top">Top</option>
                      <option value="middle">Middle</option>
                      <option value="bottom">Bottom</option>
                      <option value="sidebar">Sidebar</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Code</FormLabel>
                  <FormControl>
                    <Textarea
                      id="ad-code"
                      {...field}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the HTML/JavaScript code for this advertisement.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="edit-active"
                      />
                    </FormControl>
                    <Label htmlFor="edit-active">Active</Label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdSlotDialog;
