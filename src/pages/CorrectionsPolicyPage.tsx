import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { Home, AlertCircle, History, CheckCircle, Mail, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const CorrectionsPolicyPage: React.FC = () => {
  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Corrections & Error Reporting', '/corrections')
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Corrections Policy & Question Error Reporting | CuizIN"
        description="Read CuizIN's public corrections policy, error review workflow, and learn how to report an inaccurate quiz question to our editorial team."
        canonicalUrl="https://cuiz.in/corrections"
        keywords={['report quiz error', 'CuizIN corrections', 'fact correction', 'trivia quality control', 'editorial accuracy']}
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
              <BreadcrumbPage>Corrections Policy</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <SimpleAdBanner position="header" className="mb-6" />
        
        <div className="quiz-card">
          <h1 className="text-3xl font-bold mb-4">Corrections Policy &amp; Error Reporting</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Continuous Quality Improvement · Maintained by the CuizIN Editorial Board
          </p>
          
          <div className="space-y-8">
            {/* Overview */}
            <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                Commitment to Rectifying Inaccuracies
              </h2>
              <p className="text-foreground leading-relaxed">
                Despite rigorous fact-checking, trivia inaccuracies, newly broken world records, or changed geopolitical facts can occur. CuizIN is committed to correcting any factual error quickly, transparently, and thoroughly.
              </p>
            </section>

            {/* Error Reporting Steps */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                1. How to Report an Inaccurate Question
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you spot an outdated fact, ambiguous wording, or incorrect answer option while playing or browsing:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-3">
                  <div className="border rounded-xl p-4 bg-muted/20">
                    <div className="font-bold text-foreground mb-1">Step 1: Locate ID</div>
                    <p className="text-xs">
                      Note the Question Title or URL (e.g. <code>/quiz/question/12345/...</code>).
                    </p>
                  </div>
                  <div className="border rounded-xl p-4 bg-muted/20">
                    <div className="font-bold text-foreground mb-1">Step 2: Provide Source</div>
                    <p className="text-xs">
                      Include a reputable reference link supporting the correction.
                    </p>
                  </div>
                  <div className="border rounded-xl p-4 bg-muted/20">
                    <div className="font-bold text-foreground mb-1">Step 3: Submit</div>
                    <p className="text-xs">
                      Send your report to our review queue at <code>corrections@cuiz.in</code>.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <SimpleAdBanner position="content" className="my-6" />

            {/* Review Lifecycle */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                2. Editorial Review &amp; Update Workflow
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Triage within 48 Hours:</strong> Every submitted report is reviewed by an editorial staff member.
                </li>
                <li>
                  <strong className="text-foreground">Dual Verification:</strong> The claim is independently cross-referenced against our primary source library.
                </li>
                <li>
                  <strong className="text-foreground">Instant Database Update:</strong> Once confirmed, the question, answer, explanation, and <code>dateModified</code> metadata are updated across all web and mobile versions.
                </li>
                <li>
                  <strong className="text-foreground">Player Score Integrity:</strong> If an active challenge or tournament question was affected, adjustments are applied fairly.
                </li>
              </ul>
            </section>

            {/* Contact Box */}
            <section className="border rounded-xl p-6 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Direct Editorial Contact
                </h3>
                <p className="text-xs text-muted-foreground">
                  Email: <a href="mailto:corrections@cuiz.in" className="text-primary hover:underline font-semibold">corrections@cuiz.in</a> · Response time: 24–48 hours
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/faq">Read FAQ</Link>
              </Button>
            </section>

            {/* Related Policies */}
            <section className="border-t pt-6">
              <h3 className="font-semibold text-foreground mb-3">Related Standards</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link to="/editorial-policy" className="text-primary hover:underline font-medium">
                  → Editorial Policy
                </Link>
                <Link to="/our-sources" className="text-primary hover:underline font-medium">
                  → Our Sources &amp; Citation Standards
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

export default CorrectionsPolicyPage;
