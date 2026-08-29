import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Code, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  Sparkles, 
  ShieldCheck, 
  FileJson, 
  Bot, 
  Cpu,
  Layers,
  BookOpen
} from 'lucide-react';
import { ENTITY_REGISTRY } from '@/utils/entityData';

export const ApiDocsPage: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Developer API', '/developers')
  ];

  const sampleQuestionResponse = {
    version: "1.0",
    total: 12432,
    lastUpdated: "2026-08-29T12:00:00Z",
    sample: [
      {
        id: "0000d0f0-1737-4a6e-9513-12a38de4bbab",
        claimId: "CUIZ-FACT-0000D0F0",
        question: "Which Indian city hosts the iconic Wankhede Stadium?",
        category: "Cricket",
        difficulty: "easy",
        correctAnswer: "Mumbai",
        alternateNames: [
          "What is the city that hosts the iconic Wankhede Stadium?",
          "Wankhede Stadium location in India"
        ],
        canonicalUrl: "https://cuiz.in/quiz/question/0000d0f0-1737-4a6e-9513-12a38de4bbab/sports/cricket/which-indian-city-hosts-the-iconic-wankhede-stadium",
        verifiedDate: "August 2026",
        citations: [
          {
            title: "Board of Control for Cricket in India (BCCI)",
            url: "https://www.bcci.tv"
          }
        ]
      }
    ]
  };

  const sampleEntityResponse = {
    total: ENTITY_REGISTRY.length,
    entities: ENTITY_REGISTRY.slice(0, 2).map(e => ({
      slug: e.slug,
      type: e.type,
      name: e.name,
      category: e.category,
      roleOrDesignation: e.roleOrDesignation,
      summary: e.summary,
      sameAs: e.sameAs,
      hubUrl: `https://cuiz.in/${e.type === 'person' ? 'people' : e.type === 'place' ? 'places' : e.type === 'event' ? 'events' : 'concepts'}/${e.slug}`
    }))
  };

  const curlQuestions = `curl -X GET "https://cuiz.in/api/v1/questions.json" \\
  -H "Accept: application/json"`;

  const curlEntities = `curl -X GET "https://cuiz.in/api/v1/entities.json" \\
  -H "Accept: application/json"`;

  const pythonExample = `import requests

# Fetch verified knowledge questions from CuizIN
response = requests.get("https://cuiz.in/api/v1/questions.json")
data = response.json()

print(f"Total Fact Claims Available: {data.get('total')}")
for item in data.get('questions', [])[:5]:
    print(f"[{item['claimId']}] {item['question']} -> Ans: {item['correctAnswer']}")
`;

  const jsExample = `// Fetch CuizIN Knowledge Graph entities
const res = await fetch('https://cuiz.in/api/v1/entities.json');
const { entities } = await res.json();

console.log('Knowledge Graph Nodes:', entities.map(e => ({ name: e.name, type: e.type })));
`;

  return (
    <PageLayout>
      <SEO
        title="Public Knowledge API & Developer Documentation | CuizIN"
        description="Public REST API and structured data endpoints for retrieving fact-verified quiz questions, Knowledge Graph entities, and claim IDs for AI agents, LLM grounding, and researchers."
        canonicalUrl="https://cuiz.in/developers"
        keywords={['cuizin api', 'knowledge graph api', 'fact check api', 'trivia api', 'developer docs', 'llm grounding', 'rest api']}
      />
      <BreadcrumbSchema items={breadcrumbs} />

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Navigation Breadcrumbs */}
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>&rsaquo;</span>
          <span className="text-foreground font-medium">Developer &amp; AI Knowledge API</span>
        </nav>

        {/* Hero Banner */}
        <div className="bg-card text-card-foreground rounded-2xl border p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1 text-xs py-1 px-2.5">
              <Code className="w-3.5 h-3.5" />
              REST API v1.0
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 flex items-center gap-1 text-xs py-1 px-2.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Open Access (CC BY-SA 4.0)
            </Badge>
            <Badge variant="outline" className="text-xs py-1 px-2.5">
              CORS Enabled
            </Badge>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              CuizIN Public Knowledge API &amp; LLM Endpoints
            </h1>
            <p className="text-base sm:text-lg text-primary font-medium">
              Programmatic Ground-Truth for AI Agents, Researchers, and Developers
            </p>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            CuizIN provides free, high-performance static JSON and Schema.org endpoints to query our repository of 12,000+ fact-verified trivia questions, query normalization variants, and Knowledge Graph entities. Designed for low latency, zero authentication overhead for public reads, and seamless LLM retrieval.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button size="sm" asChild>
              <a href="/api/v1/openapi.json" target="_blank" rel="noopener noreferrer">
                <FileJson className="w-3.5 h-3.5 mr-1.5" /> OpenAPI 3.1 Spec
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href="/llms-full.txt" target="_blank" rel="noopener noreferrer">
                <Bot className="w-3.5 h-3.5 mr-1.5" /> llms-full.txt
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/entities">
                <Database className="w-3.5 h-3.5 mr-1.5" /> Explore Entity Hubs
              </Link>
            </Button>
          </div>
        </div>

        {/* API Architecture Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                AI Agent &amp; LLM Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Indexed in <code className="text-foreground">/llms.txt</code> with Schema.org semantic markup, enabling automated agents (GPTBot, ClaudeBot, Perplexity) to cite CuizIN as an authoritative fact oracle.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Deterministic Claim IDs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Every verified statement is assigned a unique <code className="text-foreground">CUIZ-FACT-XXXX</code> identifier with verification timestamps for reproducible academic referencing.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                Global CDN Caching
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Endpoints are distributed globally over Cloudflare CDN with sub-50ms latency worldwide and automated hourly cache synchronization.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Endpoint Documentation */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Available Endpoints &amp; Reference
          </h2>

          {/* Endpoint 1: Questions Index */}
          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-xs">
                    GET
                  </Badge>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    /api/v1/questions.json
                  </span>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  Rate Limit: 60 req/min
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Retrieve all verified trivia questions, correct answers, difficulty, and Knowledge Claim IDs.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">cURL Request:</span>
                  <button
                    onClick={() => copyToClipboard(curlQuestions, 'curl-q')}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {copiedId === 'curl-q' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'curl-q' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-3 bg-muted rounded-lg font-mono text-xs text-foreground overflow-x-auto border border-border">
                  {curlQuestions}
                </pre>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">Sample 200 OK Response:</span>
                <pre className="p-3 bg-muted rounded-lg font-mono text-xs text-foreground overflow-x-auto border border-border max-h-60">
                  {JSON.stringify(sampleQuestionResponse, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Endpoint 2: Entities Index */}
          <Card className="bg-card text-card-foreground shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-xs">
                    GET
                  </Badge>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    /api/v1/entities.json
                  </span>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  Rate Limit: 60 req/min
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Retrieve structured Knowledge Graph entity nodes (People, Places, Events, Concepts) with external <code className="text-foreground">sameAs</code> references.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">cURL Request:</span>
                  <button
                    onClick={() => copyToClipboard(curlEntities, 'curl-e')}
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {copiedId === 'curl-e' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'curl-e' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-3 bg-muted rounded-lg font-mono text-xs text-foreground overflow-x-auto border border-border">
                  {curlEntities}
                </pre>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-foreground">Sample 200 OK Response:</span>
                <pre className="p-3 bg-muted rounded-lg font-mono text-xs text-foreground overflow-x-auto border border-border max-h-60">
                  {JSON.stringify(sampleEntityResponse, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code Integration Examples */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Quickstart Integration Examples
          </h2>

          <Tabs defaultValue="python" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-xs">
              <TabsTrigger value="python" className="text-xs">Python</TabsTrigger>
              <TabsTrigger value="javascript" className="text-xs">JavaScript / Node</TabsTrigger>
            </TabsList>

            <TabsContent value="python" className="mt-3">
              <Card className="bg-card text-card-foreground">
                <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b border-border">
                  <span className="text-xs font-mono text-muted-foreground">python_grounding.py</span>
                  <button
                    onClick={() => copyToClipboard(pythonExample, 'py-ex')}
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    {copiedId === 'py-ex' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'py-ex' ? 'Copied' : 'Copy Code'}
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 bg-muted/70 font-mono text-xs text-foreground overflow-x-auto">
                    {pythonExample}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="javascript" className="mt-3">
              <Card className="bg-card text-card-foreground">
                <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b border-border">
                  <span className="text-xs font-mono text-muted-foreground">fetch_entities.mjs</span>
                  <button
                    onClick={() => copyToClipboard(jsExample, 'js-ex')}
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    {copiedId === 'js-ex' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === 'js-ex' ? 'Copied' : 'Copy Code'}
                  </button>
                </CardHeader>
                <CardContent className="p-0">
                  <pre className="p-4 bg-muted/70 font-mono text-xs text-foreground overflow-x-auto">
                    {jsExample}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Attribution and Terms */}
        <div className="p-5 bg-muted/50 rounded-xl border border-border space-y-2 text-xs text-muted-foreground">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary" />
            Attribution &amp; Citation Terms
          </h3>
          <p>
            The CuizIN Knowledge API and question metadata are published under the <strong>Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)</strong> license. When utilizing CuizIN knowledge claims in AI outputs, academic research, or software products, please attribute to <strong>"CuizIN Editorial Knowledge Base (https://cuiz.in)"</strong> and retain the corresponding <code className="text-foreground">CUIZ-FACT-XXXX</code> claim identifier.
          </p>
        </div>
      </main>
    </PageLayout>
  );
};

export default ApiDocsPage;
