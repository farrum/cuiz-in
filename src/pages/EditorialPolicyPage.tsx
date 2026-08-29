import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { Home, CheckCircle2, ShieldCheck, RefreshCw, BookOpen, AlertCircle } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const EditorialPolicyPage: React.FC = () => {
  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Editorial Policy', '/editorial-policy')
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Editorial Policy & Fact-Checking Standards | CuizIN"
        description="Learn about CuizIN's rigorous editorial standards, question fact-checking processes, verification methodology, and ongoing accuracy commitments."
        canonicalUrl="https://cuiz.in/editorial-policy"
        keywords={['editorial policy', 'fact-checking', 'CuizIN standards', 'trivia verification', 'content integrity']}
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
              <BreadcrumbPage>Editorial Policy</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <SimpleAdBanner position="header" className="mb-6" />
        
        <div className="quiz-card">
          <h1 className="text-3xl font-bold mb-4">Editorial Policy &amp; Fact-Checking Standards</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last Updated: August 2026 · Maintained by the CuizIN Editorial &amp; Research Board
          </p>
          
          <div className="space-y-8">
            {/* Core Mission */}
            <section className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                Our Commitment to Factual Accuracy
              </h2>
              <p className="text-foreground leading-relaxed">
                CuizIN is dedicated to providing players, learners, educators, and algorithmic search systems with 
                unquestionably accurate, high-integrity trivia questions and answers. Every question published across our 
                15,000+ knowledge library must undergo systematic verification against trusted primary sources before entering our canonical repository.
              </p>
            </section>

            {/* Verification Lifecycle */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                1. The Fact-Checking Lifecycle
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Before any trivia item is made publicly available or added to a competitive quiz, it follows a 4-step editorial pipeline:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong className="text-foreground">Source Sourcing:</strong> Facts must be verified with primary references (e.g., constitutional records, scientific consensus, governing sporting body stats, or peer-reviewed literature).
                  </li>
                  <li>
                    <strong className="text-foreground">Ambiguity Elimination:</strong> Questions are reviewed for semantic clarity to eliminate ambiguous phrasing or context-dependent wording that could lead to multiple valid interpretations.
                  </li>
                  <li>
                    <strong className="text-foreground">Option Integrity:</strong> All distractor options must be plausibly incorrect while avoiding misleading nuances that contradict established facts.
                  </li>
                  <li>
                    <strong className="text-foreground">Contextual Explanation:</strong> Every question is paired with a verifiable explanation detailing <em>why</em> the answer is correct and providing educational context.
                  </li>
                </ul>
              </div>
            </section>

            <SimpleAdBanner position="content" className="my-6" />

            {/* Dynamic vs Timeless Facts */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                2. Handling Timeless vs. Dynamic Facts
              </h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We categorize trivia facts based on temporal stability to ensure knowledge remains fresh:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-semibold text-foreground mb-1">🏛️ Timeless Facts</h3>
                    <p className="text-xs">
                      Historical events, mathematical constants, geographical landmarks, and scientific discoveries. Verified once and monitored for modern archaeological or scholarly revisions.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-semibold text-foreground mb-1">⏱️ Dynamic Facts</h3>
                    <p className="text-xs">
                      World records, elected office holders, active sports statistics, and current legislation. Tagged with verification timestamps and scheduled for automated quarterly audits.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Handling Controversy & Uncertainty */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                3. Scientific Consensus &amp; Nuance
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Where historical or scientific consensus is debated or evolving, CuizIN avoids false certainty. Our explanations explicitly document prevailing theories and mention alternative scholarly viewpoints with appropriate citations.
              </p>
            </section>

            {/* Corrections & Transparency */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                4. Corrections &amp; Public Accountability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We believe that true authority requires radical transparency. When an error is identified, we promptly rectify the question, update the fact-check timestamp, and publish the change in accordance with our{' '}
                <Link to="/corrections" className="text-primary hover:underline font-medium">
                  Corrections Policy
                </Link>.
              </p>
            </section>

            {/* Related Policies */}
            <section className="border-t pt-6">
              <h3 className="font-semibold text-foreground mb-3">Related Standards &amp; Policies</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link to="/our-sources" className="text-primary hover:underline font-medium">
                  → Our Sources &amp; Citation Standards
                </Link>
                <Link to="/corrections" className="text-primary hover:underline font-medium">
                  → Corrections Policy &amp; Error Reporting
                </Link>
                <Link to="/terms" className="text-primary hover:underline font-medium">
                  → Terms of Service
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

export default EditorialPolicyPage;
