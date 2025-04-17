
import React from 'react';
import SEO from '@/components/SEO';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NewsTicker from '@/components/NewsTicker';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FaqPage: React.FC = () => {
  const faqItems = [
    {
      question: "How does CuizIN work?",
      answer: "CuizIN is a free quiz platform where users can earn rewards by answering questions correctly and building streaks. You play quizzes, earn points based on your performance, and can redeem these points for rewards."
    },
    {
      question: "Is CuizIN completely free to use?",
      answer: "Yes, CuizIN is 100% free to use. We don't charge any subscription fees. Our platform is supported by advertisements, which allow us to offer monetary rewards to active players."
    },
    {
      question: "How do I earn points on CuizIN?",
      answer: "You earn points by answering quiz questions correctly, completing daily challenges, maintaining answer streaks, and referring new users. The more you play and the better you perform, the more points you'll accumulate."
    },
    {
      question: "How can I withdraw my earnings?",
      answer: "Once you've accumulated enough points, you can request a withdrawal through your profile page. We support various payment methods including PayPal, bank transfers, and mobile payment services depending on your region."
    },
    {
      question: "What are daily challenges?",
      answer: "Daily challenges are special quizzes that refresh every day. They offer bonus points and are a great way to increase your earnings. Make sure to complete them regularly to maximize your rewards."
    },
    {
      question: "How does the referral program work?",
      answer: "You can earn additional points by inviting friends to join CuizIN. When someone signs up using your referral link and starts playing quizzes, you'll receive referral bonuses based on their activity."
    },
    {
      question: "What happens if I miss a day of playing?",
      answer: "Missing a day won't negatively impact your account. However, maintaining a daily login streak can provide bonus points, so regular participation is encouraged for maximum earnings."
    },
    {
      question: "Are there different difficulty levels for quizzes?",
      answer: "Yes, we offer quizzes across various difficulty levels from easy to hard. More difficult questions generally award more points, allowing you to challenge yourself while earning more."
    }
  ];
  
  // Schema.org FAQ Page structured data
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqItems.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Frequently Asked Questions | CuizIN"
        description="Find answers to the most common questions about CuizIN quiz game, rewards system, and how to maximize your earnings through regular play."
        canonicalUrl="https://cuiz.in/faq"
        schemaType="FAQPage"
        schemaData={faqSchema}
      />
      <Header />
      <NewsTicker className="mt-16" />
      
      <main className="flex-1 container max-w-4xl pt-12 pb-16 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>
        
        <div className="bg-card rounded-lg shadow-sm p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <div className="mt-12 text-center">
          <h2 className="text-xl font-semibold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can't find the answer you're looking for? Please reach out to our support team.
          </p>
          <a 
            href="mailto:support@cuiz.in" 
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2"
          >
            Contact Support
          </a>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FaqPage;
