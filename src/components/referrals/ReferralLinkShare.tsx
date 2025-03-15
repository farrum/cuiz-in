
import React from 'react';
import { toast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

const ReferralLinkShare: React.FC = () => {
  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${Date.now()}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: "Link Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm text-muted-foreground">Or share your referral link</span>
      <Button variant="outline" size="sm" onClick={copyReferralLink}>
        <Copy className="w-4 h-4 mr-2" />
        <span>Copy Link</span>
      </Button>
    </div>
  );
};

export default ReferralLinkShare;
