
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface ShareableContentProps {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  type?: 'quiz' | 'blog' | 'challenge';
}

const ShareableContent: React.FC<ShareableContentProps> = ({
  title,
  description,
  url,
  imageUrl,
  type = 'blog'
}) => {
  const fullUrl = url.startsWith('http') ? url : `https://cuiz.in${url}`;
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title,
        text: description,
        url: fullUrl,
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback copy to clipboard
      copyToClipboard(fullUrl);
    }
  };
  
  const copyToClipboard = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    toast({
      title: "Link copied!",
      description: "The link has been copied to your clipboard.",
      duration: 3000,
    });
  };
  
  const handleCopyLink = () => {
    copyToClipboard(fullUrl);
  };

  return (
    <Card className="overflow-hidden">
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform hover:scale-105" 
          />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="line-clamp-2">{title}</CardTitle>
            <CardDescription className="mt-2">
              {type === 'quiz' && 'Quiz Content'}
              {type === 'blog' && 'Blog Post'}
              {type === 'challenge' && 'Challenge'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-muted-foreground line-clamp-3">{description}</p>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleCopyLink}
        >
          <LinkIcon className="h-4 w-4" />
          <span>Copy Link</span>
        </Button>
        
        <Button 
          variant="secondary" 
          size="sm"
          className="flex items-center gap-1"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ShareableContent;
