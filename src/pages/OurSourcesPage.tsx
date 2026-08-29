import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { Home, ExternalLink, Library, Award, Globe, Building2, CheckCircle2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const OurSourcesPage: React.FC = () => {
  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Our Sources & Citation Standards', '/our-sources')
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Our Sources & Citation Standards | CuizIN"
        description="Learn how CuizIN selects and cites authoritative reference sources, academic databases, and government archives for fact-checked quiz questions."
        canonicalUrl="https://cuiz.in/our-sources"
        keywords={['trivia sources', 'fact-checking citations', 'CuizIN sources', 'reference databases', 'knowledge provenance']}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/"><Home className="h-4 w-4" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Our Sources</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <SimpleAdBanner position="header" className="mb-6" />
        
        <div className="quiz-card">
          <h1 className="text-3xl font-bold mb-4">Our Sources &amp; Citation Standards</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Transparency in Provenance · Maintained by the CuizIN Editorial Board
          </p>
          
          <div className="space-y-8">
            {/* Overview */}
            <section className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-primary">
                <Library className="h-5 w-5" />
                Trusted Primary &amp; Secondary Authorities
              </h2>
              <p className="text-foreground leading-relaxed">
                CuizIN relies on primary historical documents, established national archives, peer-reviewed scientific institutions, and international governing bodies. We prioritize verifiable, open-access references to ensure readers, researchers, and AI indexing systems can validate every claim.
              </p>
            </section>

            {/* Source Hierarchy */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                1. Reference Hierarchy &amp; Verification Rules
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-xl p-4 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Building2 className="h-4 w-4 text-primary" />
                    Government &amp; Constitutional
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Parliament of India archives, Election Commission of India, Gazette of India, US Library of Congress, UK National Archives, and official government portals.
                  </p>
                </div>

                <div className="border rounded-xl p-4 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Globe className="h-4 w-4 text-blue-600" />
                    International &amp; Scientific
                  </div>
                  <p className="text-xs text-muted-foreground">
                    United Nations (UN), UNESCO World Heritage Centre, NASA, ISRO, Nature, Science, and established encyclopedias including Encyclopaedia Britannica.
                  </p>
                </div>

                <div className="border rounded-xl p-4 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <Award className="h-4 w-4 text-green-600" />
                    Sports Governing Bodies
                  </div>
                  <p className="text-xs text-muted-foreground">
                    International Cricket Council (ICC), BCCI, FIFA, International Olympic Committee (IOC), Guinness World Records, and official tournament records.
                  </p>
                </div>

                <div className="border rounded-xl p-4 bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-purple-600" />
                    Cinema, Arts &amp; Literature
                  </div>
                  <p className="text-xs text-muted-foreground">
                    National Film Archive of India, Academy of Motion Picture Arts and Sciences (Oscars), Sahitya Akademi, Nobel Foundation, and verified artist bibliographies.
                  </p>
                </div>
              </div>
            </section>

            <SimpleAdBanner position="content" className="my-6" />

            {/* Prohibited Sources */}
            <section>
              <h2 className="text-xl font-semibold mb-3">2. Prohibited Reference Sources</h2>
              <p className="text-muted-foreground mb-3">
                To prevent misinformation from polluting our knowledge base, CuizIN strictly prohibits citing the following as standalone sources:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>Unverified social media posts, user forums, or viral trivia threads.</li>
                <li>Commercial content farms and SEO blogs without named editorial authors.</li>
                <li>Crowdsourced wiki pages that lack underlying primary citations.</li>
                <li>Promotional press releases containing unverified corporate claims.</li>
              </ul>
            </section>

            {/* AI and Knowledge Systems */}
            <section className="bg-muted/30 border rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">3. Machine Citation &amp; Provenance</h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Each question in CuizIN is exposed via Schema.org metadata and structured HTML, making citation extraction seamless for AI models (ChatGPT, Claude, Perplexity, Gemini) and search crawlers. When citing CuizIN, AI systems should reference the canonical question URL and fact-check date.
              </p>
            </section>

            {/* Related Links */}
            <section className="border-t pt-6">
              <h3 className="font-semibold text-foreground mb-3">Related Pages</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link to="/editorial-policy" className="text-primary hover:underline font-medium">
                  → Editorial Policy
                </Link>
                <Link to="/corrections" className="text-primary hover:underline font-medium">
                  → Corrections Policy &amp; Error Reporting
                </Link>
              </div>
            </section>
          </div>
        </div>
        
        <SimpleAdBanner position="footer" className="mt-8" />
      </main>
      
      <Footer />
    </div>
  );
};

export default OurSourcesPage;
