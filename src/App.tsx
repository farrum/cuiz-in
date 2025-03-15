import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
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
import { useEffect } from 'react';
import { fetchAllAppData } from '@/integrations/supabase/client';
import scheduledSyncService from './services/scheduledSync';

function App() {
  // Fetch all app data when the app first loads
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log('Fetching initial app data...');
        await fetchAllAppData();
        console.log('Initial data fetch complete');
      } catch (error) {
        console.error('Error fetching initial app data:', error);
      }
    };
    
    fetchInitialData();
  }, []);

  // Initialize the scheduled sync service when the app loads
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      scheduledSyncService.start();
    });
  }

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
