
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllAppData } from '@/integrations/supabase/client';
import scheduledSyncService from './services/scheduledSync';
import { STORAGE_KEYS } from '@/utils/quizData';

// Pages
import Index from "@/pages/Index";
import QuizPage from "@/pages/QuizPage";
import AnswerPage from "@/pages/AnswerPage";
import ReferralPage from "@/pages/ReferralPage";
import Profile from "@/pages/Profile";
import LoginPage from "@/pages/LoginPage";
import Registration from "@/pages/Registration";
import AdminPage from "@/pages/AdminPage";
import AdminLoginPage from '@/pages/AdminLoginPage';
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        
        // Check for existing session
        const { data: sessionData } = await supabase.auth.getSession();
        
        // If user is logged in, fetch their profile
        if (sessionData?.session?.user) {
          const userId = sessionData.session.user.id;
          
          // Get user profile from Supabase
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (profileData) {
            // Store user data in localStorage
            localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
            localStorage.setItem(STORAGE_KEYS.USER_NAME, profileData.username);
            localStorage.setItem(STORAGE_KEYS.USER_POINTS, profileData.points.toString());
          }
        }
        
        // Fetch all app data
        await fetchAllAppData();
        console.log('Initial data fetch complete');
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true); // Set to true anyway to allow app to render
      }
    };
    
    initializeApp();
  }, []);

  // Initialize the scheduled sync service when the app loads
  useEffect(() => {
    if (isInitialized) {
      scheduledSyncService.start();
    }
  }, [isInitialized]);

  // Set up auth state listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // User signed in, update local storage
          const userId = session.user.id;
          
          // Get user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (profileData) {
            localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
            localStorage.setItem(STORAGE_KEYS.USER_NAME, profileData.username);
            localStorage.setItem(STORAGE_KEYS.USER_POINTS, profileData.points.toString());
          }
        } else if (event === 'SIGNED_OUT') {
          // User signed out, clear local storage
          localStorage.removeItem(STORAGE_KEYS.USER_ID);
          localStorage.removeItem(STORAGE_KEYS.USER_NAME);
          localStorage.removeItem(STORAGE_KEYS.USER_POINTS);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="quiz-app-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/answer/:questionId/:selectedOption" element={<AnswerPage />} />
          <Route path="/refer" element={<ReferralPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={<AdminPage />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
