 import React, { useState, useEffect } from 'react';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Skeleton } from '@/components/ui/skeleton';
 import { 
   BarChart3, 
   RefreshCw, 
   Loader2,
   CheckCircle2,
   XCircle,
   ExternalLink
 } from 'lucide-react';
 import { toast } from 'sonner';
 
 interface SitemapCount {
   name: string;
   url: string;
   count: number | null;
   status: 'loading' | 'success' | 'error';
   isIndex?: boolean;
 }
 
 const SITEMAPS = [
   { name: 'Index', url: '/sitemap.xml', isIndex: true },
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
 
 const SitemapUrlCounter: React.FC = () => {
   const [counts, setCounts] = useState<SitemapCount[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
 
   const fetchSitemapCount = async (sitemap: typeof SITEMAPS[0]): Promise<SitemapCount> => {
     const fullUrl = `https://cuiz.in${sitemap.url}`;
     
     try {
       const response = await fetch(fullUrl, {
         method: 'GET',
         headers: { 'Accept': 'application/xml, text/xml' },
       });
       
       if (!response.ok) {
         return { ...sitemap, count: null, status: 'error' };
       }
       
       const xmlText = await response.text();
       const isSitemapIndex = xmlText.includes('<sitemapindex');
       
       if (isSitemapIndex) {
         const sitemapMatches = xmlText.match(/<sitemap>/g);
         return { ...sitemap, count: sitemapMatches?.length || 0, status: 'success', isIndex: true };
       } else {
         const urlMatches = xmlText.match(/<url>/g);
         return { ...sitemap, count: urlMatches?.length || 0, status: 'success' };
       }
     } catch {
       return { ...sitemap, count: null, status: 'error' };
     }
   };
 
   const refreshCounts = async () => {
     setIsLoading(true);
     setCounts(SITEMAPS.map(s => ({ ...s, count: null, status: 'loading' as const })));
     
     try {
       const results = await Promise.all(SITEMAPS.map(fetchSitemapCount));
       setCounts(results);
       setLastUpdated(new Date());
       
       const errorCount = results.filter(r => r.status === 'error').length;
       const totalUrls = results
         .filter(r => r.status === 'success' && !r.isIndex)
         .reduce((sum, r) => sum + (r.count || 0), 0);
       
       if (errorCount === 0) {
         toast.success(`Found ${totalUrls.toLocaleString()} URLs across ${results.length - 1} sitemaps`);
       } else {
         toast.warning(`${errorCount} sitemaps failed to load`);
       }
     } catch (error) {
       toast.error('Failed to fetch sitemap counts');
     } finally {
       setIsLoading(false);
     }
   };
 
   // Auto-fetch on mount
   useEffect(() => {
     refreshCounts();
   }, []);
 
   const totalUrls = counts
     .filter(c => c.status === 'success' && !c.isIndex)
     .reduce((sum, c) => sum + (c.count || 0), 0);
 
   const successCount = counts.filter(c => c.status === 'success').length;
   const errorCount = counts.filter(c => c.status === 'error').length;
 
   return (
     <Card>
       <CardHeader>
         <div className="flex items-center justify-between">
           <div>
             <CardTitle className="flex items-center gap-2">
               <BarChart3 className="w-5 h-5" />
               Sitemap URL Counter
             </CardTitle>
             <CardDescription>
               Live count of URLs in each sitemap
             </CardDescription>
           </div>
           <Button 
             variant="outline" 
             size="sm" 
             onClick={refreshCounts}
             disabled={isLoading}
           >
             {isLoading ? (
               <Loader2 className="w-4 h-4 animate-spin" />
             ) : (
               <RefreshCw className="w-4 h-4" />
             )}
           </Button>
         </div>
       </CardHeader>
       <CardContent className="space-y-4">
         {/* Summary Stats */}
         <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
           <div className="text-center">
             <p className="text-3xl font-bold text-primary">
               {isLoading ? '...' : totalUrls.toLocaleString()}
             </p>
             <p className="text-xs text-muted-foreground">Total URLs</p>
           </div>
           <div className="text-center">
             <p className="text-3xl font-bold text-green-500">
               {isLoading ? '...' : successCount}
             </p>
             <p className="text-xs text-muted-foreground">Active Sitemaps</p>
           </div>
           <div className="text-center">
             <p className="text-3xl font-bold text-red-500">
               {isLoading ? '...' : errorCount}
             </p>
             <p className="text-xs text-muted-foreground">Errors</p>
           </div>
         </div>
 
         {/* Individual Sitemap Counts */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
           {counts.length === 0 
             ? SITEMAPS.map((s, i) => (
                 <div key={i} className="p-3 border rounded-lg">
                   <Skeleton className="h-4 w-20 mb-2" />
                   <Skeleton className="h-6 w-12" />
                 </div>
               ))
             : counts.map((sitemap, index) => (
                 <div 
                   key={index} 
                   className={`p-3 border rounded-lg transition-colors ${
                     sitemap.status === 'error' 
                       ? 'border-red-500/50 bg-red-500/5' 
                       : sitemap.status === 'success'
                         ? 'border-green-500/30 bg-green-500/5'
                         : ''
                   }`}
                 >
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-medium truncate">{sitemap.name}</span>
                     {sitemap.status === 'loading' && <Loader2 className="w-3 h-3 animate-spin" />}
                     {sitemap.status === 'success' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                     {sitemap.status === 'error' && <XCircle className="w-3 h-3 text-red-500" />}
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-lg font-bold">
                       {sitemap.status === 'loading' 
                         ? '...' 
                         : sitemap.status === 'error' 
                           ? '—' 
                           : sitemap.count?.toLocaleString()
                       }
                     </span>
                     {sitemap.isIndex ? (
                       <Badge variant="secondary" className="text-[10px] px-1">Index</Badge>
                     ) : (
                       <span className="text-[10px] text-muted-foreground">URLs</span>
                     )}
                   </div>
                   <a 
                     href={`https://cuiz.in${sitemap.url}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1"
                   >
                     View <ExternalLink className="w-2 h-2" />
                   </a>
                 </div>
               ))
           }
         </div>
 
         {lastUpdated && (
           <p className="text-xs text-muted-foreground text-center">
             Last updated: {lastUpdated.toLocaleTimeString()}
           </p>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export default SitemapUrlCounter;