import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Send, CheckCircle2, XCircle, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PingResult {
  endpoint: string;
  success: boolean;
  status: number;
  message?: string;
}

const IndexNowPinger: React.FC = () => {
  const [isPinging, setIsPinging] = useState(false);
  const [customUrls, setCustomUrls] = useState('');
  const [results, setResults] = useState<PingResult[]>([]);
  const [lastPing, setLastPing] = useState<Date | null>(null);

  const pingIndexNow = async (urls: string[]) => {
    setIsPinging(true);
    setResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('indexnow', {
        body: { urls, reason: 'admin_manual_ping' },
      });
      
      if (error) throw error;
      
      if (data?.endpoints) {
        setResults(data.endpoints);
      }
      
      setLastPing(new Date());
      
      const successCount = data?.endpoints?.filter((r: PingResult) => r.success).length || 0;
      
      if (successCount > 0) {
        toast.success(`Successfully pinged ${successCount} search engines with ${urls.length} URLs`);
      } else {
        toast.warning('Ping completed but no search engines responded successfully');
      }
    } catch (error) {
      console.error('IndexNow ping error:', error);
      toast.error('Failed to ping IndexNow');
    } finally {
      setIsPinging(false);
    }
  };

  const handlePingSitemap = async () => {
    await pingIndexNow([
      'https://cuiz.in/sitemap.xml',
      'https://cuiz.in/',
    ]);
  };

  const handlePingCustomUrls = async () => {
    if (!customUrls.trim()) {
      toast.error('Please enter at least one URL');
      return;
    }
    
    const urls = customUrls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.startsWith('https://'));
    
    if (urls.length === 0) {
      toast.error('Please enter valid URLs starting with https://');
      return;
    }
    
    await pingIndexNow(urls);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          IndexNow Search Engine Pinger
        </CardTitle>
        <CardDescription>
          Notify Bing, Yandex, and other search engines about new or updated content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Quick Actions</h4>
            <Button 
              onClick={handlePingSitemap}
              disabled={isPinging}
              className="w-full"
            >
              {isPinging ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              Ping Sitemap to Search Engines
            </Button>
            <p className="text-xs text-muted-foreground">
              Sends sitemap.xml URL to Bing, Yandex, and IndexNow API
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Custom URLs</h4>
            <Input
              placeholder="https://cuiz.in/quiz/question/..."
              value={customUrls}
              onChange={(e) => setCustomUrls(e.target.value)}
              className="font-mono text-xs"
            />
            <Button 
              onClick={handlePingCustomUrls}
              disabled={isPinging || !customUrls.trim()}
              variant="outline"
              className="w-full"
            >
              Ping Custom URLs
            </Button>
            <p className="text-xs text-muted-foreground">
              Enter URLs (one per line) to notify search engines
            </p>
          </div>
        </div>
        
        {lastPing && (
          <p className="text-xs text-muted-foreground">
            Last ping: {lastPing.toLocaleString()}
          </p>
        )}
        
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Ping Results</h4>
            <div className="divide-y border rounded-lg">
              {results.map((result, index) => (
                <div key={index} className="p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-mono truncate max-w-[200px]">
                      {result.endpoint.replace('https://', '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Status: {result.status}
                    </span>
                    <Badge variant={result.success ? "outline" : "destructive"}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
          <p><strong>Supported Search Engines:</strong></p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Bing (www.bing.com)</li>
            <li>Yandex (yandex.com)</li>
            <li>IndexNow API (api.indexnow.org)</li>
          </ul>
          <p className="mt-2">
            <strong>Note:</strong> Google uses sitemap auto-discovery via robots.txt. 
            For Google, submit sitemaps via Search Console.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default IndexNowPinger;
