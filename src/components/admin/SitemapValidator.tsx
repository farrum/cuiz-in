import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Globe,
  FileText,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface SitemapValidationResult {
  sitemap: string;
  urlCount: number;
  status: 'success' | 'error' | 'warning';
  message: string;
  sampleUrls?: string[];
  responseTime?: number;
}

interface ValidationSummary {
  totalSitemaps: number;
  totalUrls: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
}

const SITEMAPS_TO_VALIDATE = [
  { name: 'Index', url: '/sitemap.xml' },
  { name: 'Main', url: '/sitemap-main.xml' },
  { name: 'History', url: '/sitemap-category-history.xml' },
  { name: 'Science', url: '/sitemap-category-science.xml' },
  { name: 'Geography', url: '/sitemap-category-geography.xml' },
  { name: 'Literature', url: '/sitemap-category-literature.xml' },
  { name: 'Entertainment', url: '/sitemap-category-entertainment.xml' },
  { name: 'Sports', url: '/sitemap-category-sports.xml' },
  { name: 'Technology', url: '/sitemap-category-technology.xml' },
  { name: 'General Knowledge', url: '/sitemap-category-general-knowledge.xml' },
];

const SitemapValidator: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<SitemapValidationResult[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentSitemap, setCurrentSitemap] = useState('');

  const validateSitemap = async (sitemapUrl: string): Promise<SitemapValidationResult> => {
    const startTime = Date.now();
    const fullUrl = `https://cuiz.in${sitemapUrl}`;
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml',
        },
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        return {
          sitemap: sitemapUrl,
          urlCount: 0,
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          responseTime,
        };
      }
      
      const xmlText = await response.text();
      
      // Check if it's a sitemap index or regular sitemap
      const isSitemapIndex = xmlText.includes('<sitemapindex');
      
      if (isSitemapIndex) {
        // Count sitemaps in index
        const sitemapMatches = xmlText.match(/<sitemap>/g);
        const count = sitemapMatches ? sitemapMatches.length : 0;
        
        return {
          sitemap: sitemapUrl,
          urlCount: count,
          status: 'success',
          message: `Sitemap index with ${count} child sitemaps`,
          responseTime,
        };
      } else {
        // Count URLs in regular sitemap
        const urlMatches = xmlText.match(/<url>/g);
        const count = urlMatches ? urlMatches.length : 0;
        
        // Extract sample URLs
        const locMatches = xmlText.match(/<loc>([^<]+)<\/loc>/g);
        const sampleUrls = locMatches 
          ? locMatches.slice(0, 3).map(m => m.replace(/<\/?loc>/g, ''))
          : [];
        
        if (count === 0) {
          return {
            sitemap: sitemapUrl,
            urlCount: 0,
            status: 'warning',
            message: 'Sitemap is empty (0 URLs)',
            responseTime,
            sampleUrls,
          };
        }
        
        return {
          sitemap: sitemapUrl,
          urlCount: count,
          status: 'success',
          message: `Valid sitemap with ${count.toLocaleString()} URLs`,
          responseTime,
          sampleUrls,
        };
      }
    } catch (error) {
      return {
        sitemap: sitemapUrl,
        urlCount: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      };
    }
  };

  const runValidation = async () => {
    setIsValidating(true);
    setResults([]);
    setSummary(null);
    setProgress(0);
    
    const validationResults: SitemapValidationResult[] = [];
    
    for (let i = 0; i < SITEMAPS_TO_VALIDATE.length; i++) {
      const sitemap = SITEMAPS_TO_VALIDATE[i];
      setCurrentSitemap(sitemap.name);
      setProgress(((i + 1) / SITEMAPS_TO_VALIDATE.length) * 100);
      
      const result = await validateSitemap(sitemap.url);
      validationResults.push(result);
      setResults([...validationResults]);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Calculate summary
    const totalUrls = validationResults.reduce((sum, r) => sum + r.urlCount, 0);
    const successCount = validationResults.filter(r => r.status === 'success').length;
    const errorCount = validationResults.filter(r => r.status === 'error').length;
    const warningCount = validationResults.filter(r => r.status === 'warning').length;
    
    setSummary({
      totalSitemaps: validationResults.length,
      totalUrls,
      successCount,
      errorCount,
      warningCount,
    });
    
    setIsValidating(false);
    setCurrentSitemap('');
    
    if (errorCount === 0 && warningCount === 0) {
      toast.success(`All ${validationResults.length} sitemaps validated successfully with ${totalUrls.toLocaleString()} total URLs`);
    } else if (errorCount > 0) {
      toast.error(`Validation completed with ${errorCount} errors`);
    } else {
      toast.warning(`Validation completed with ${warningCount} warnings`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Valid</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Warning</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Sitemap Validator
        </CardTitle>
        <CardDescription>
          Validate all sitemaps and check URL counts for SEO monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runValidation} 
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating {currentSitemap}...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Validate All Sitemaps
              </>
            )}
          </Button>
        </div>
        
        {isValidating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Validating: {currentSitemap} ({Math.round(progress)}%)
            </p>
          </div>
        )}
        
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold">{summary.totalSitemaps}</p>
              <p className="text-xs text-muted-foreground">Sitemaps</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{summary.totalUrls.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total URLs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{summary.successCount}</p>
              <p className="text-xs text-muted-foreground">Valid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">{summary.warningCount}</p>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{summary.errorCount}</p>
              <p className="text-xs text-muted-foreground">Errors</p>
            </div>
          </div>
        )}
        
        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Validation Results
            </h4>
            <div className="divide-y border rounded-lg">
              {results.map((result, index) => (
                <div key={index} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium text-sm">{result.sitemap}</p>
                      <p className="text-xs text-muted-foreground">{result.message}</p>
                      {result.sampleUrls && result.sampleUrls.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">Sample URLs:</p>
                          {result.sampleUrls.map((url, i) => (
                            <a 
                              key={i} 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline block truncate max-w-[300px]"
                            >
                              {url}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {result.responseTime && (
                      <span className="text-xs text-muted-foreground">
                        {result.responseTime}ms
                      </span>
                    )}
                    <span className="text-sm font-medium">
                      {result.urlCount.toLocaleString()} URLs
                    </span>
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SitemapValidator;
