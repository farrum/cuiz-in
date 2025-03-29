import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import QuizCard from '@/components/QuizCard';
import Footer from '@/components/Footer';
import DailyChallenges from '@/components/DailyChallenges';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE_KEYS } from '@/utils/quizData';

function QuizPage() {
  const [activeChallenges, setActiveChallenges] = useState(0);
  
  // Check if there are any active challenges for the user
  useEffect(() => {
    const checkActiveChallenges = async () => {
      try {
        const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
        
        if (!userId) return;
        
        const { data, error } = await supabase
          .from('daily_challenges')
          .select('id')
          .eq('is_active', true)
          .gte('end_date', new Date().toISOString());
          
        if (error) throw error;
        
        setActiveChallenges(data?.length || 0);
      } catch (error) {
        console.error('Error checking active challenges:', error);
      }
    };
    
    checkActiveChallenges();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <QuizCard />
          </div>
          
          <div className="space-y-6">
            {/* Show daily challenges component */}
            <DailyChallenges />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default QuizPage;
