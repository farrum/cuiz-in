
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UseFormReturn } from 'react-hook-form';

interface ImageUrlFieldProps {
  form: UseFormReturn<any>;
  previewImage: string | null;
  setPreviewImage: (url: string | null) => void;
}

const ImageUrlField: React.FC<ImageUrlFieldProps> = ({ form, previewImage, setPreviewImage }) => {
  const { toast } = useToast();
  
  const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setPreviewImage(url);
    form.setValue('imageUrl', url);
  };

  return (
    <FormField
      control={form.control}
      name="imageUrl"
      rules={{ required: "Image URL is required" }}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <ImageIcon size={16} />
            Image URL
          </FormLabel>
          <FormControl>
            <Input 
              placeholder="Enter image URL" 
              {...field} 
              onChange={(e) => handleImagePreview(e)}
            />
          </FormControl>
          <FormDescription>
            Provide a URL to an image for this question
          </FormDescription>
          <FormMessage />
          
          {previewImage && (
            <Card className="mt-2">
              <CardContent className="p-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                  <img
                    src={previewImage}
                    alt="Preview of the image for this quiz question"
                    className="object-contain w-full h-full"
                    onError={() => {
                      toast({
                        title: "Image Error",
                        description: "Unable to load this image URL",
                        variant: "destructive"
                      });
                      setPreviewImage(null);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Image preview - verify that it loads correctly
                </p>
              </CardContent>
            </Card>
          )}
        </FormItem>
      )}
    />
  );
};

export default ImageUrlField;
