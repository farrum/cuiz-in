import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { getGuestSessionPoints, isUserLoggedIn } from '@/utils/guestPlayService';
import { useToast } from '@/hooks/use-toast';

interface SocialShareButtonsProps {
  className?: string;
  points?: number;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ className = '', points }) => {
  const { toast } = useToast();
  const sessionPoints = points ?? getGuestSessionPoints();
  
  // Don't show for logged-in users or if no points
  if (isUserLoggedIn() || sessionPoints === 0) return null;

  const shareText = `🎮 I just scored ${sessionPoints.toFixed(0)} points playing CuizIN! Think you can beat my score? Try the free quiz game now!`;
  const shareUrl = window.location.origin;

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=450');
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'width=550,height=450');
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
    } catch {
      toast({
        title: "Error",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground mr-1">Share your score:</span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleTwitterShare}
        className="h-8 px-3 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]"
      >
        <Twitter className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleFacebookShare}
        className="h-8 px-3 hover:bg-[#4267B2]/10 hover:text-[#4267B2] hover:border-[#4267B2]"
      >
        <Facebook className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsAppShare}
        className="h-8 px-3 hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="h-8 px-3"
      >
        <Share2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default SocialShareButtons;
