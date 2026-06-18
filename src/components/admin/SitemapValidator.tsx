import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Globe, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const EDGE_BASE = 'https://pgywvtphfidouakypdno.supabase.co/functions/v1/sitemap-static';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBneXd2dHBoZmlkb3Vha3lwZG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMjcwOTQsImV4cCI6MjA1NzYwMzA5NH0.YazHsLiGkw-Uo-TYYAObWVzlf0HcZBDQjI5pP-F7Eco';

interface ValidationResult {
  name: string;
  param: string;
  urlCount: number;
  status: 'success' | 'error' | 'warning';
  message: string;
  sampleUrls?: string[];
  responseTime?: number;
}

const ENDGEMS = [
  { name: 'Index', param: '?type=index' },
  { name: 'Main (Static+Blog+FAQ)', param: '?type=main' },
  { name: 'History', param: '?type=category&category=history' },
  { name: 'Science', param: '?type=category&category=science' },
  { name: 'Geography', param: '?type=category&category=geography' },
  { name: 'Literature', param: '?type=category&category=literature' },
  { name: 'Entertainment', param: '?type=category&category=entertainment' },
  { name: 'Sports', param: '?type=category&category=sports' },
  { name: 'Technology', param: '?type=category&category=technology' },
  { name: 'General Knowledge', param: '?type=category&category=general-knowledge' },
  { name: 'Guinness World Records', param: '?type=category&category=guinness-world-records' },
];

const SitemapValidator: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentName, setCurrentName] = useState('');

  const validate = async (ep: typeof ENDGEMS[0]): Promise<ValidationResult> => {
    const start = Date.now();
    try {
      const res = await fetch(`${EDGE_BASE}${ep.param}`, {
        headers: { 'Accept': 'application/xml', 'apikey': ANON_KEY },
      });
      const responseTime = Date.now() - start;
      if (!res.ok) return { ...ep, urlCount: 0, status: 'error', message: `HTTP ${res.status}`, responseTime };
      
      const xml = await res.text();
      const isIndex = xml.includes('<sitemapindex');
      
      if (isIndex) {
        const count = (xml.match(/<sitemap>/g) || []).length;
        return { ...ep, urlCount: count, status: 'success', message: `Index with ${count} children`, responseTime };
      }
      
      const count = (xml.match(/<url>/g) || []).length;
      const locs = xml.match(/<loc>([^<]+)<\/loc>/g);
      const sampleUrls = locs?.slice(0, 3).map(m => m.replace(/<\/?loc>/g, '')) || [];
      
      if (count === 0) return { ...ep, urlCount: 0, status: 'warning', message: 'Empty sitemap', responseTime, sampleUrls };
      return { ...ep, urlCount: count, status: 'success', message: `${count.toLocaleString()} URLs`, responseTime, sampleUrls };
    } catch (err) {
      return { ...ep, urlCount: 0, status: 'error', message: err instanceof Error ? err.message : 'Unknown error', responseTime: Date.now() - start };
    }
  };

  const runValidation = async () => {
    setIsValidating(true);
    setResults([]);
    setProgress(0);
    const all: ValidationResult[] = [];
    
    for (let i = 0; i < ENDGEMS.length; i++) {
      setCurrentName(ENDGEMS[i].name);
      setProgress(((i + 1) / ENDGEMS.length) * 100);
      const r = await validate(ENDGEMS[i]);
      all.push(r);
      setResults([...all]);
      await new Promise(res => setTimeout(res, 200));
    }
    
    setIsValidating(false);
    setCurrentName('');
    const errors = all.filter(r => r.status === 'error').length;
    const total = all.filter(r => r.status === 'success' && !r.message.includes('Index')).reduce((s, r) => s + r.urlCount, 0);
    if (errors === 0) toast.success(`All valid! ${total.toLocaleString()} total URLs`);
    else toast.error(`${errors} endgems failed`);
  };

  const totalUrls = results.filter(r => r.status === 'success' && !r.message.includes('Index')).reduce((s, r) => s + r.urlCount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />Sitemap Validator</CardTitle>
        <CardDescription>Validates all sitemap endgems directly via edge function</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runValidation} disabled={isValidating} className="flex items-center gap-2">
          {isValidating ? <><Loader2 className="w-4 h-4 animate-spin" />Validating {currentName}...</> : <><RefreshCw className="w-4 h-4" />Validate All Endgems</>}
        </Button>
        
        {isValidating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{currentName} ({Math.round(progress)}%)</p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{totalUrls.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total URLs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{results.filter(r => r.status === 'success').length}</p>
                <p className="text-xs text-muted-foreground">Valid</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{results.filter(r => r.status === 'error').length}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </div>

            <div className="divide-y border rounded-lg">
              {results.map((r, i) => (
                <div key={i} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {r.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                     r.status === 'error' ? <XCircle className="w-4 h-4 text-red-500" /> :
                     <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                    <div>
                      <p className="font-medium text-sm">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.message}</p>
                      {r.sampleUrls?.map((url, j) => (
                        <a key={j} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline block truncate max-w-[300px]">{url}</a>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.responseTime && <span className="text-xs text-muted-foreground">{r.responseTime}ms</span>}
                    <Badge variant={r.status === 'error' ? 'destructive' : 'outline'}
                      className={r.status === 'success' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                                 r.status === 'warning' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30' : ''}>
                      {r.urlCount.toLocaleString()} {r.message.includes('Index') ? 'children' : 'URLs'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SitemapValidator;
