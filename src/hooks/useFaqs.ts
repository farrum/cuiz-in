
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export const useFaqs = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_published', true)
          .order('order_index', { ascending: true });

        if (error) throw error;

        // If no FAQs are returned from the database, use these default FAQs
        if (!data || data.length === 0) {
          const defaultFaqs = [
            {
              id: '1',
              question: 'How do I earn points on CuizIN?',
              answer: 'You earn points by correctly answering quiz questions, completing daily challenges, maintaining login streaks, and through referrals. The more accurate your answers and the longer your streaks, the more points you earn.',
              category: 'Points & Rewards'
            },
            {
              id: '2',
              question: 'How can I withdraw my earnings?',
              answer: 'You can withdraw your earnings by navigating to the Profile section and selecting "Withdraw Points". We support multiple payment methods including UPI, bank transfer, and gift cards.',
              category: 'Points & Rewards'
            },
            {
              id: '3',
              question: 'What are daily challenges?',
              answer: 'Daily challenges are special quiz sets that refresh every 24 hours. They offer higher point multipliers and unique rewards compared to regular quizzes.',
              category: 'Gameplay'
            },
            {
              id: '4',
              question: 'How does the referral program work?',
              answer: 'When you invite friends using your referral link, you earn a percentage of the points they generate. The more active your referrals are, the more points you earn.',
              category: 'Points & Rewards'
            },
            {
              id: '5',
              question: 'What happens if I miss a day in my streak?',
              answer: 'If you miss a day, your streak will reset. However, you can use streak protectors (earned through achievements) to maintain your streak during missed days.',
              category: 'Gameplay'
            },
            {
              id: '6',
              question: 'Are there any limits to how many quizzes I can take?',
              answer: 'There is no limit to the number of regular quizzes you can take. However, special events and daily challenges have specific attempts allowed.',
              category: 'Gameplay'
            },
            {
              id: '7',
              question: 'How are the leaderboards calculated?',
              answer: 'Leaderboards are calculated based on total points earned within a specific time period (daily, weekly, monthly, all-time). Some special events have their own dedicated leaderboards.',
              category: 'Gameplay'
            },
            {
              id: '8',
              question: 'What should I do if I find an incorrect quiz answer?',
              answer: 'If you believe a quiz question has an incorrect answer, please report it using the flag icon next to the question. Our content team reviews all reports.',
              category: 'Support'
            },
            {
              id: '9',
              question: 'Can I suggest new quiz categories?',
              answer: 'Yes! We welcome suggestions for new quiz categories. Please send your ideas to suggestions@cuiz.in or use the suggestion box in the app settings.',
              category: 'Content'
            },
            {
              id: '10',
              question: 'How secure is my personal information?',
              answer: 'We take data security seriously. All personal information is encrypted and we never share your data with third parties without your consent. Please review our Privacy Policy for more details.',
              category: 'Security & Privacy'
            },
            {
              id: '11',
              question: 'How do I change my username or profile picture?',
              answer: 'You can change your username and profile picture by going to your Profile page and clicking the Edit Profile button. You can select from our library of profile icons or upload your own image.',
              category: 'Account Management'
            },
            {
              id: '12',
              question: 'What are badges and how do I earn them?',
              answer: 'Badges are achievements that showcase your accomplishments on CuizIN. You can earn badges by completing specific challenges, maintaining streaks, reaching point milestones, and more.',
              category: 'Gameplay'
            },
            {
              id: '13',
              question: 'Is there a minimum withdrawal amount?',
              answer: 'Yes, the minimum withdrawal amount is 100 points, which is equivalent to approximately $1 USD. Different payment methods may have different minimum thresholds.',
              category: 'Points & Rewards'
            },
            {
              id: '14',
              question: 'How long do withdrawals take to process?',
              answer: 'Most withdrawals are processed within 24-72 hours. UPI transfers are typically fastest, while bank transfers may take 3-5 business days.',
              category: 'Points & Rewards'
            },
            {
              id: '15',
              question: 'Can I play CuizIN on multiple devices?',
              answer: 'Yes, you can log into your CuizIN account on multiple devices. Your progress and points will sync across all devices where you're logged in.',
              category: 'Account Management'
            }
          ];
          setFaqs(defaultFaqs);
        } else {
          setFaqs(data);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        toast({
          title: 'Error',
          description: 'Unable to load FAQs. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  return { faqs, isLoading };
};
