
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReferralSection from '@/components/ReferralSection';
import SEO from '@/components/SEO';
import BreadcrumbSchema, { createBreadcrumbs } from '@/components/BreadcrumbSchema';
import { ArrowLeft, Users, Award, DollarSign, Percent, HelpCircle, Home } from 'lucide-react';
import SimpleAdBanner from '@/components/ads/SimpleAdBanner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const ReferralProgramPage: React.FC = () => {
  const breadcrumbs = [
    createBreadcrumbs.home(),
    createBreadcrumbs.referral()
  ];

  const referralSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': 'CuizIN Referral Program',
    'description': 'Earn rewards by referring friends to CuizIN. Get bonuses for each friend who joins and plays.',
    'mainEntity': {
      '@type': 'Service',
      'name': 'CuizIN Referral Program',
      'description': 'Refer friends to CuizIN and earn ₹500 for each active referral',
      'provider': {
        '@type': 'Organization',
        'name': 'CuizIN'
      },
      'offers': {
        '@type': 'Offer',
        'price': '500',
        'priceCurrency': 'INR',
        'description': 'Earn ₹500 per referral'
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Referral Program | Earn ₹500 Per Referral | CuizIN"
        description="Join CuizIN's referral program and earn ₹500 for each friend who signs up and plays. Become a Team Leader for monthly recurring rewards!"
        canonicalUrl="https://cuiz.in/referral-program"
        schemaType="WebPage"
        schemaData={referralSchema}
        keywords={['referral program', 'earn money', 'invite friends', 'CuizIN referral', 'referral bonus']}
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
              <BreadcrumbPage>Referral Program</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link to="/referral" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Referral Dashboard
        </Link>
        
        <div className="quiz-card">
          <h1 className="text-3xl font-bold mb-6">CuizIN Referral Program</h1>
          
          <SimpleAdBanner position="header" className="mb-8" />
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Users className="w-6 h-6 mr-2 text-primary" />
                How Our Referral Program Works
              </h2>
              <p className="text-muted-foreground">
                The CuizIN referral program allows you to earn additional rewards by inviting friends and family to join the platform. Each person you refer who joins using your unique referral code becomes part of your referral network, allowing you to earn bonus points based on their activity.
              </p>
              
              <div className="mt-6 grid md:grid-cols-3 gap-6">
                <div className="bg-secondary/30 p-6 rounded-lg flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Share Your Code</h3>
                  <p className="text-sm text-muted-foreground">Share your unique referral code with friends via social media, email, or direct messages.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Friend Joins CuizIN</h3>
                  <p className="text-sm text-muted-foreground">Your friend signs up using your referral code and completes the registration process.</p>
                </div>
                
                <div className="bg-secondary/30 p-6 rounded-lg flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Both Earn Rewards</h3>
                  <p className="text-sm text-muted-foreground">You both receive bonuses—they get a welcome bonus, and you earn ongoing referral rewards.</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Award className="w-6 h-6 mr-2 text-primary" />
                Benefits of Referring Friends
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <DollarSign className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Welcome Bonuses</h3>
                    <p className="text-muted-foreground">When someone joins using your referral code, you receive a one-time welcome bonus after they complete their first quiz.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Percent className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Ongoing Commission</h3>
                    <p className="text-muted-foreground">Earn a percentage of the points your referrals generate on the platform. As they play and win, you win too!</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Multi-Level Benefits</h3>
                    <p className="text-muted-foreground">Our multi-tiered referral system also rewards you when your referrals bring in new players, creating a network effect that maximizes your earnings.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Award className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Bonus Milestones</h3>
                    <p className="text-muted-foreground">Unlock special bonuses when you reach referral milestones. The more friends you bring, the bigger the rewards!</p>
                  </div>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <HelpCircle className="w-6 h-6 mr-2 text-primary" />
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">How many people can I refer?</h3>
                  <p className="text-muted-foreground">There is no limit to the number of friends you can refer to CuizIN. The more people you refer, the more rewards you can earn!</p>
                </div>
                
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">When do I receive my referral rewards?</h3>
                  <p className="text-muted-foreground">Welcome bonuses are credited within 24 hours after your referral completes their first quiz. Ongoing commission rewards are calculated and added to your account on a daily basis.</p>
                </div>
                
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">What happens if someone forgets to use my referral code?</h3>
                  <p className="text-muted-foreground">The referral code must be entered during registration to be counted. Make sure your friends enter your code when they sign up to ensure you receive your rewards.</p>
                </div>
                
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Can I withdraw my referral earnings?</h3>
                  <p className="text-muted-foreground">Yes, referral earnings are added to your regular account balance and can be withdrawn according to our standard withdrawal policies and minimum withdrawal amounts.</p>
                </div>
              </div>
            </section>
            
            <section className="bg-primary/10 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-center">Ready to Start Referring?</h2>
              <p className="text-center text-muted-foreground mb-6">
                Visit your referral dashboard to get your unique code and start sharing it with friends right away!
              </p>
              <div className="flex justify-center">
                <Link 
                  to="/referral" 
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors"
                >
                  Go to My Referral Dashboard
                </Link>
              </div>
            </section>
          </div>
          
          <SimpleAdBanner position="footer" className="mt-8" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ReferralProgramPage;
