
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormContext } from 'react-hook-form';

interface AdSlot {
  id: string;
  name: string;
  position: string;
  code: string;
  active: boolean;
  last_updated: string;
  version_number?: number;
}

interface EditAdSlotDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingSlot: AdSlot | null;
  form: any; // UseFormReturn
  onCancel: () => void;
  onSave: () => void;
  isCreatingNew: boolean;
  versionNotes?: string;
  setVersionNotes?: (notes: string) => void;
}

export function EditAdSlotDialog({
  isOpen,
  onOpenChange,
  editingSlot,
  form,
  onCancel,
  onSave,
  isCreatingNew,
  versionNotes,
  setVersionNotes
}: EditAdSlotDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>
            {isCreatingNew ? "Create New Ad Slot" : "Edit Ad Slot"}
          </DialogTitle>
          <DialogDescription>
            {isCreatingNew
              ? "Create a new ad slot to display advertisements on your website."
              : "Edit the settings and code for this ad slot."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Slot Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Homepage Banner" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique name for this ad slot
                    </FormDescription>
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="sidebar">Sidebar</SelectItem>
                        <SelectItem value="content">In Content</SelectItem>
                        <SelectItem value="footer">Footer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Where this ad will appear on the page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Code</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Paste your ad code here (HTML, JS, etc.)"
                      className="font-mono text-sm"
                      rows={8}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    HTML/JavaScript code for your advertisement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isCreatingNew && setVersionNotes && (
              <FormField
                control={form.control}
                name="version_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what changed in this version"
                        className="text-sm"
                        rows={2}
                        value={versionNotes}
                        onChange={(e) => setVersionNotes(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes about this update (for version history)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        When enabled, this ad will be displayed on your website
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
