import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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

const PrivacyPage: React.FC = () => {
  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.custom('Privacy Policy', '/privacy')
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Privacy Policy | CuizIN"
        description="Read CuizIN's Privacy Policy. Learn how we collect, use, and protect your personal information on our quiz platform."
        canonicalUrl="https://cuiz.in/privacy"
        keywords={['privacy policy', 'data protection', 'CuizIN privacy', 'personal information']}
      />
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      
      <main className="flex-1 container max-w-4xl pt-24 pb-12 px-4">
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
              <BreadcrumbPage>Privacy Policy</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <SimpleAdBanner position="header" className="mb-6" />
        
        <div className="quiz-card">
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect information you provide when creating an account, including your name, email address, and optional profile information.
              </p>
              <p className="text-muted-foreground mt-2">
                Additionally, we automatically collect certain information about your device, including IP address, device type, browser type, and usage data.
              </p>
            </section>
            
            <SimpleAdBanner position="content" className="my-6" />
            
            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground">
                We use your information to:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground">
                <li>Provide the CuizIN service and process rewards</li>
                <li>Improve and personalize our platform</li>
                <li>Communicate with you about your account and updates</li>
                <li>Analyze usage patterns and troubleshoot issues</li>
                <li>Protect against fraudulent or unauthorized activity</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
              <p className="text-muted-foreground">
                We may share your personal information with:
              </p>
              <ul className="list-disc list-inside mt-2 text-muted-foreground">
                <li>Service providers who perform services on our behalf</li>
                <li>Legal authorities when required by law</li>
                <li>Other users, but only limited information as part of the platform's functionality (e.g., usernames on leaderboards)</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
              <p className="text-muted-foreground">
                We implement reasonable security measures to protect your personal information from unauthorized access, alteration, or disclosure. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">5. Cookies and Similar Technologies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, but disabling them may limit your use of certain features.
              </p>
            </section>
            
            <SimpleAdBanner position="content" className="my-6" />
            
            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Choices</h2>
              <p className="text-muted-foreground">
                You can access, update, or delete your account information through your profile settings. You may also request a copy of your data or ask us to restrict processing in certain circumstances.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
              <p className="text-muted-foreground">
                CuizIN is not directed to individuals under the age of 18. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">8. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the effective date.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us through the support channels available on our platform.
              </p>
            </section>
          </div>
          
          <SimpleAdBanner position="footer" className="mt-8" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PrivacyPage;
