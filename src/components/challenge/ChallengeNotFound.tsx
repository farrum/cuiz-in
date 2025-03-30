
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface ChallengeNotFoundProps {
  onExit: () => void;
}

const ChallengeNotFound: React.FC<ChallengeNotFoundProps> = ({ onExit }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-4xl pt-8 pb-12 px-4 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Challenge not found or no longer available.</p>
            <Button onClick={onExit}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Quiz
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ChallengeNotFound;
