
import React from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const DisclaimerPage: React.FC = () => {
  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Disclaimer', '/disclaimer')
  ];

  return (
    <PageLayout containerClassName="container max-w-4xl pt-24 pb-12 px-4">
      <SEO
        title="Game Disclaimer | CuizIN"
        description="Read the CuizIN Game Disclaimer. Understand our rewards system, content accuracy policies, and platform usage guidelines."
        canonicalUrl="https://cuiz.in/disclaimer"
        keywords={['disclaimer', 'game rules', 'CuizIN disclaimer', 'rewards disclaimer']}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      {/* Visual Breadcrumb */}
      <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/"><Home className="h-4 w-4" /></Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Disclaimer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <SimpleAdBanner position="header" className="mb-6" />
        
        <div className="quiz-card">
          <h1 className="text-3xl font-bold mb-6">Game Disclaimer</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">General Disclaimer</h2>
              <p className="text-muted-foreground">
                CuizIN is an educational quiz platform designed for entertainment and learning purposes. While we offer rewards for participation, CuizIN is not a gambling platform.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Rewards System</h2>
              <p className="text-muted-foreground">
                Rewards are earned through active participation, correct answers, and referrals. The amount and frequency of rewards may change based on platform policies.
              </p>
            </section>
            
            <SimpleAdBanner position="content" className="my-6" />
            
            <section>
              <h2 className="text-xl font-semibold mb-3">No Guarantee of Income</h2>
              <p className="text-muted-foreground">
                While CuizIN provides opportunities to earn rewards, we do not guarantee any specific level of income or earnings.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">User Responsibility</h2>
              <p className="text-muted-foreground">
                Users are responsible for ensuring they are eligible to participate in the CuizIN platform and to receive rewards based on the laws and regulations in their jurisdiction.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Content Accuracy</h2>
              <p className="text-muted-foreground">
                While we strive to ensure the accuracy of our quiz questions and educational content, CuizIN does not guarantee the accuracy, completeness, or usefulness of any information on the platform.
              </p>
            </section>
            
            <SimpleAdBanner position="content" className="my-6" />
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Technical Issues</h2>
              <p className="text-muted-foreground">
                CuizIN is not liable for any technical issues that may impact your ability to participate in quizzes or activities, including but not limited to internet connectivity issues, server outages, or device compatibility problems.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to Game Features</h2>
              <p className="text-muted-foreground">
                CuizIN reserves the right to modify, suspend, or discontinue any aspect of the platform, including game features, reward structures, and availability, at any time without prior notice.
              </p>
            </section>
          </div>
          
          <SimpleAdBanner position="footer" className="mt-8" />
        </div>
    </PageLayout>
  );
};

export default DisclaimerPage;
