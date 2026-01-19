import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sitemapService } from '@/utils/sitemapService';
import SitemapValidator from './SitemapValidator';
import IndexNowPinger from './IndexNowPinger';

const SitemapManagement = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [urlCount, setUrlCount] = useState<number | null>(null);

  const handleManualRegeneration = async () => {
    setIsGenerating(true);
    try {
      // Call the regenerate function directly
      const { error } = await supabase.rpc('regenerate_sitemap');
      
      if (error) {
        console.error('Error regenerating sitemap:', error);
        toast.error('Failed to regenerate sitemap');
      } else {
        toast.success('Sitemap regeneration triggered successfully');
        setLastGenerated(new Date());
        
        // Also generate locally to get URL count
        const sitemapXml = await sitemapService.generateCompleteSitemap();
        const urlMatches = sitemapXml.match(/<url>/g);
        setUrlCount(urlMatches ? urlMatches.length : 0);
      }
    } catch (error) {
      console.error('Error in manual regeneration:', error);
      toast.error('Failed to regenerate sitemap');
    } finally {
      setIsGenerating(false);
    }
  };

  const testSitemapGeneration = async () => {
    setIsGenerating(true);
    try {
      const sitemapXml = await sitemapService.generateCompleteSitemap();
      const urlMatches = sitemapXml.match(/<url>/g);
      const count = urlMatches ? urlMatches.length : 0;
      
      setUrlCount(count);
      toast.success(`Test successful! Generated ${count} URLs`);
      console.log('Test sitemap preview:', sitemapXml.substring(0, 500) + '...');
    } catch (error) {
      console.error('Error testing sitemap generation:', error);
      toast.error('Failed to test sitemap generation');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sitemap Validator */}
      <SitemapValidator />
      
      {/* IndexNow Pinger */}
      <IndexNowPinger />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Automatic Sitemap Management
          </CardTitle>
          <CardDescription>
            The sitemap is automatically updated when content changes and regenerated hourly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Automatic Updates</h4>
              <div className="space-y-1">
                <Badge variant="outline" className="w-fit">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Hourly Regeneration
                </Badge>
                <Badge variant="outline" className="w-fit">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Content Change Triggers
                </Badge>
                <Badge variant="outline" className="w-fit">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Auto IndexNow on New Questions
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Coverage</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• All quiz questions and answers</p>
                <p>• Dynamic category pages</p>
                <p>• Blog posts and FAQs</p>
                <p>• Static pages</p>
              </div>
            </div>
          </div>

          {urlCount !== null && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Current sitemap contains:</strong> {urlCount.toLocaleString()} URLs
              </p>
              {lastGenerated && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {lastGenerated.toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleManualRegeneration}
              disabled={isGenerating}
              variant="default"
            >
              {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Regenerate Now
            </Button>
            
            <Button 
              onClick={testSitemapGeneration}
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test Generation
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Trigger Configuration
          </CardTitle>
          <CardDescription>
            Automatic triggers are set up for the following events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Quiz Questions (INSERT/UPDATE/DELETE)</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Question → IndexNow Ping</span>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Blog Posts (INSERT/UPDATE/DELETE)</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">FAQs (INSERT/UPDATE/DELETE)</span>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Hourly Cron Job</span>
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sitemap Access</CardTitle>
          <CardDescription>
            The sitemap is available at the following URLs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                https://cuiz.in/sitemap.xml
              </code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://cuiz.in/sitemap.xml', '_blank')}
              >
                View
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <code className="text-sm bg-muted px-2 py-1 rounded">
                https://cuiz.in/sitemap-main.xml
              </code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://cuiz.in/sitemap-main.xml', '_blank')}
              >
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SitemapManagement;
