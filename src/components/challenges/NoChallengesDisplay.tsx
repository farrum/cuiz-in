
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

const NoChallengesDisplay: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No active challenges at the moment.</p>
        <p className="text-sm text-muted-foreground mt-1">Check back later for new challenges!</p>
      </CardContent>
    </Card>
  );
};

export default NoChallengesDisplay;
