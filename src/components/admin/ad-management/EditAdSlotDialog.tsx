
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
import { Check, Plus, HelpCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  isCreatingNew?: boolean;
}

const EditAdSlotDialog: React.FC<EditAdSlotDialogProps> = ({
  isOpen,
  onOpenChange,
  editingSlot,
  form,
  onCancel,
  onSave,
  isCreatingNew = false
}) => {
  if (!editingSlot) return null;

  const adCodeExamples = {
    google: `<!-- Google AdSense Example -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="XXXXXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`,
    custom: `<!-- Custom Ad Example -->
<div id="custom-ad-container">
  <a href="https://example.com" target="_blank" rel="noopener noreferrer">
    <img src="https://example.com/ad-image.jpg" alt="Advertisement" style="width:100%;height:auto;" />
  </a>
</div>`
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {isCreatingNew ? 'Create New Ad Slot' : `Edit Ad Slot: ${editingSlot.name}`}
          </DialogTitle>
          <DialogDescription>
            {isCreatingNew 
              ? 'Create a new advertisement slot for your application.' 
              : 'Update the details and ad code for this advertisement slot.'}
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
                      placeholder="Enter ad slot name"
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Ad Code</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" type="button" className="h-7 px-3">
                            <HelpCircle className="h-3.5 w-3.5 mr-1" />
                            Examples
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" align="start" className="w-80 p-0">
                          <div className="flex flex-col">
                            <div className="border-b border-border p-2">
                              <p className="font-semibold text-sm">Ad Code Examples</p>
                            </div>
                            <div className="p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => field.onChange(adCodeExamples.google)}
                                type="button"
                              >
                                Google AdSense
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => field.onChange(adCodeExamples.custom)}
                                type="button"
                              >
                                Custom Ad
                              </Button>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Textarea
                      id="ad-code"
                      placeholder="Enter HTML/JavaScript ad code here"
                      {...field}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground mt-1 space-y-1">
                    <p>Enter the HTML/JavaScript code for this advertisement.</p>
                    <ul className="list-disc pl-5">
                      <li>Include complete script tags with all necessary attributes</li>
                      <li>Avoid using document.write() in your ad code</li>
                      <li>For AdSense, include both the initialization and display code</li>
                    </ul>
                  </div>
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
                {isCreatingNew ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Ad Slot
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdSlotDialog;
