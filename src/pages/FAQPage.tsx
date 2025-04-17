
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import SEOMetaTags from '@/components/SEOMetaTags';
import StructuredData from '@/components/StructuredData';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

// FAQ data structured for JSON-LD format
const faqData = [
  {
    question: "What is CuizIN?",
    answer: "CuizIN is a free quiz platform where users can earn fixed monthly income by completing quizzes, challenges, and referring friends. No payment is required to start earning."
  },
  {
    question: "How do I earn money on CuizIN?",
    answer: "You can earn by answering daily quiz questions correctly, completing daily challenges, maintaining login streaks, and referring other users to the platform."
  },
  {
    question: "How much can I earn per month?",
    answer: "Earnings vary based on your activity level, correct answers, challenges completed, and referrals. Active users can earn a fixed monthly income with consistent participation."
  },
  {
    question: "When do I get paid?",
    answer: "Payments are processed monthly, typically within the first week of the following month, once you reach the minimum withdrawal threshold."
  },
  {
    question: "How do referrals work?",
    answer: "When you refer someone using your unique referral link and they sign up and become active users, you earn a commission from their activity on the platform."
  },
  {
    question: "Is there a minimum withdrawal amount?",
    answer: "Yes, the minimum withdrawal amount is set in your profile section. You must reach this threshold before requesting a payment."
  },
  {
    question: "What payment methods are supported?",
    answer: "We currently support UPI payments for users in India. Additional payment methods may be added in the future."
  },
  {
    question: "Are there any fees for withdrawals?",
    answer: "No, withdrawals are processed without any fees deducted from your earnings."
  },
  {
    question: "What happens if I miss a day?",
    answer: "Missing a day will reset your daily streak, but you can start building it again the next time you log in. Your earned points and other progress remain intact."
  },
  {
    question: "Is CuizIN available worldwide?",
    answer: "Yes, CuizIN is available worldwide, but certain payment methods may be region-specific."
  }
];

const FAQPage: React.FC = () => {
  // Prepare structured data for FAQ schema
  const structuredData = {
    '@type': 'FAQPage',
    mainEntity: faqData.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
  
  // Function to handle sharing a specific FAQ
  const handleShare = (question: string, answer: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'CuizIN FAQ',
        text: `Q: ${question}\nA: ${answer}\n\nLearn more at CuizIN!`,
        url: window.location.href,
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      const shareText = `${question} - ${answer}`;
      const textarea = document.createElement('textarea');
      textarea.value = shareText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('FAQ copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOMetaTags 
        title="Frequently Asked Questions | CuizIN"
        description="Find answers to common questions about CuizIN, including how to earn through quizzes, payment methods, referral program details, and more."
        keywords="cuizin faq, quiz platform questions, earning through quizzes, online quiz earnings, quiz app help"
        canonicalUrl="https://cuiz.in/faq"
        ogType="website"
      />
      <StructuredData type="FAQPage" data={structuredData} />
      
      <Header />
      
      <main className="flex-1 container max-w-4xl px-4 pt-24 pb-12">
        <AdvertisementBanner position="top" slotId="faq-top" pageSection="faq-page" />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">
            Find answers to common questions about using CuizIN and earning rewards.
          </p>
        </div>
        
        <Accordion type="single" collapsible className="w-full mb-8">
          {faqData.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex justify-between items-start gap-4">
                  <p className="text-muted-foreground">{faq.answer}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleShare(faq.question, faq.answer)}
                    title="Share this answer"
                    className="flex-shrink-0 mt-1"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        <AdvertisementBanner position="middle" slotId="faq-middle" pageSection="faq-page" className="my-8" />
        
        <div className="bg-muted/50 rounded-lg p-6 my-8">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="mb-6">
            If you couldn't find the answer to your question, please feel free to contact us directly.
            Our team is here to help!
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/how-to-play">See How to Play</Link>
            </Button>
          </div>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-6 my-8">
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-xl font-bold mb-2">Learn More About Earning</h3>
            <p className="text-muted-foreground mb-4">
              Discover strategies to maximize your earnings through quizzes and referrals.
            </p>
            <Button variant="secondary" asChild className="w-full">
              <Link to="/referral-program">Referral Program</Link>
            </Button>
          </div>
          
          <div className="bg-card rounded-lg p-6 border">
            <h3 className="text-xl font-bold mb-2">Explore Quiz Categories</h3>
            <p className="text-muted-foreground mb-4">
              Browse our wide selection of quiz categories and test your knowledge.
            </p>
            <Button variant="secondary" asChild className="w-full">
              <Link to="/categories">View Categories</Link>
            </Button>
          </div>
        </div>
        
        <AdvertisementBanner position="bottom" slotId="faq-bottom" pageSection="faq-page" className="mt-8" />
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQPage;
