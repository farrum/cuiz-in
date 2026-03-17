import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import SitemapValidator from './SitemapValidator';
import IndexNowPinger from './IndexNowPinger';
import SitemapUrlCounter from './SitemapUrlCounter';

const SitemapManagement = () => {
  return (
    <div className="space-y-6">
      <SitemapUrlCounter />
      <SitemapValidator />
      <IndexNowPinger />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5" />Architecture</CardTitle>
          <CardDescription>Query-parameter routing through single proxy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">How it works</h4>
              <div className="text-sm text-muted-foreground space-y-1">
              <p>• <code>/sitemap.xml</code> → Sitemap Index (9 children)</p>
                <p>• <code>/sitemap-main.xml</code> → Static + Blog + FAQ + Answers</p>
                <p>• <code>/sitemap-cat-history.xml</code> → History questions</p>
                <p>• ...8 category sitemaps total (path-based, CDN-compatible)</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Auto triggers</h4>
              <div className="space-y-1">
                <Badge variant="outline" className="w-fit"><CheckCircle className="w-3 h-3 mr-1" />IndexNow on new questions</Badge>
                <Badge variant="outline" className="w-fit"><CheckCircle className="w-3 h-3 mr-1" />5-min edge function cache</Badge>
                <Badge variant="outline" className="w-fit"><CheckCircle className="w-3 h-3 mr-1" />All content auto-included</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sitemap Access</CardTitle>
          <CardDescription>Public URLs for Google Search Console</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: 'Sitemap Index', url: 'https://cuiz.in/sitemap.xml' },
              { label: 'Main (Static+Blog+FAQ)', url: 'https://cuiz.in/sitemap.xml?type=main' },
              { label: 'Direct Edge Function', url: 'https://pgywvtphfidouakypdno.supabase.co/functions/v1/sitemap-main' },
            ].map((item) => (
              <div key={item.url} className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{item.label}</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded ml-2">{item.url}</code>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.open(item.url, '_blank')}>
                  <ExternalLink className="w-3 h-3 mr-1" />View
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SitemapManagement;
