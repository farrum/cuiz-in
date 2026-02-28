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
              question: 'How do I track my points?',
              answer: 'You can track your points by navigating to the Profile section. Your total points and daily progress are displayed on your dashboard.',
              category: 'Points & Rewards'
            },
            {
              id: '3',
              question: 'What are daily challenges?',
              answer: 'Daily challenges are special quiz sets that refresh every 24 hours. They offer higher point multipliers compared to regular quizzes.',
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
              answer: "Yes, you can log into your CuizIN account on multiple devices. Your progress and points will sync across all devices where you're logged in.",
              category: 'Account Management'
            },
            {
              id: '16',
              question: "What happens to my points if I lose internet connection during a quiz?",
              answer: "Don't worry! Your progress is automatically saved. When your connection is restored, the system will sync your latest points and quiz progress.",
              category: 'Technical Support'
            },
            {
              id: '17',
              question: "Can I participate in team challenges?",
              answer: "Yes! Team challenges are special events where you can collaborate with other players. Form teams of 2-5 players and compete against other teams for bonus rewards.",
              category: 'Gameplay'
            },
            {
              id: '18',
              question: "What are power-ups and how do I use them?",
              answer: "Power-ups are special items you can earn or purchase that provide advantages during quizzes, such as extra time, hint reveals, or point multipliers. Access them from your inventory before starting a quiz.",
              category: 'Gameplay'
            },
            {
              id: '19',
              question: "Is there a mobile app for CuizIN?",
              answer: "While we don't have a dedicated mobile app yet, our website is fully responsive and works perfectly on mobile devices. Simply open your mobile browser and visit CuizIN.",
              category: 'Technical Support'
            },
            {
              id: '20',
              question: "How do seasonal events work?",
              answer: "Seasonal events are special themed quiz competitions that run for limited time periods. They often feature unique rewards, special challenges, and themed questions.",
              category: 'Events'
            },
            {
              id: '21',
              question: "What happens if I forget my password?",
              answer: "Click the 'Forgot Password' link on the login page. We'll send you a password reset link to your registered email address. Follow the link to create a new password.",
              category: 'Account Management'
            },
            {
              id: '22',
              question: "Can I change my username?",
              answer: "Yes, you can change your username once every 30 days. Go to Profile Settings, click on 'Edit Username', and choose a new available username.",
              category: 'Account Management'
            },
            {
              id: '23',
              question: "How do I report inappropriate behavior?",
              answer: "Use the 'Report' button available on user profiles or in chat to report inappropriate behavior. Our moderation team reviews all reports within 24 hours.",
              category: 'Support'
            },
            {
              id: '24',
              question: "What are achievement badges?",
              answer: "Achievement badges are special rewards you earn for reaching milestones, like answering 1000 questions correctly or maintaining a 30-day streak. View your badges in your profile.",
              category: 'Gameplay'
            },
            {
              id: '25',
              question: "How do I invite friends to play?",
              answer: "Go to the 'Invite Friends' section in your profile to get your unique referral link. Share this link with friends, and you'll both receive bonus points when they join.",
              category: 'Referrals'
            },
            {
              id: '26',
              question: "What are bonus rounds?",
              answer: "Bonus rounds are special quiz segments that appear randomly after completing regular quizzes. They offer extra points and special rewards but have a time limit.",
              category: 'Gameplay'
            },
            {
              id: '27',
              question: "How do I customize my profile?",
              answer: "Visit your Profile Settings to customize your avatar, background theme, title, and bio. You can also showcase your favorite achievements and badges.",
              category: 'Account Management'
            },
            {
              id: '28',
              question: "What are challenge modes?",
              answer: "Challenge modes are special quiz formats like Time Attack, Survival Mode, and Lightning Round. Each mode has unique rules and scoring systems.",
              category: 'Gameplay'
            },
            {
              id: '29',
              question: "How do I contact customer support?",
              answer: "You can reach our support team through the 'Help & Support' section, email us at support@cuiz.in, or use the live chat feature during business hours.",
              category: 'Support'
            },
            {
              id: '30',
              question: "What are premium features?",
              answer: "Premium features include ad-free experience, exclusive quiz categories, custom profile themes, and priority support. Subscribe to CuizIN Premium to unlock these features.",
              category: 'Premium'
            },
            {
              id: '31',
              question: "How do weekly tournaments work?",
              answer: "Weekly tournaments run from Monday to Sunday. Compete against other players in special quiz categories for exclusive rewards and leaderboard positions.",
              category: 'Events'
            },
            {
              id: '32',
              question: "Can I create custom quizzes?",
              answer: "Premium users can create custom quiz sets to share with friends or the community. Your custom quizzes must be approved by moderators before going public.",
              category: 'Premium'
            },
            {
              id: '33',
              question: "What happens to inactive accounts?",
              answer: "Accounts inactive for more than 6 months may be suspended. Log in at least once every 6 months to keep your account active and maintain your progress.",
              category: 'Account Management'
            },
            {
              id: '34',
              question: "How do I enable dark mode?",
              answer: "Click on the theme toggle in the top navigation bar or go to Settings > Display to switch between light and dark modes. Your preference will be saved automatically.",
              category: 'Technical Support'
            },
            {
              id: '35',
              question: "What are community challenges?",
              answer: "Community challenges are user-created events where players collectively work towards a goal. When the community reaches the target, all participants receive rewards.",
              category: 'Events'
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
