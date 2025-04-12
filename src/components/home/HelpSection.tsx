
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';

const HelpSection: React.FC = () => {
  return (
    <div className="mt-12">
      <Button variant="outline" size="lg" asChild className="text-lg hover:shadow-md transition-all">
        <Link to="/how-to-play">
          <HelpCircle className="mr-2 w-5 h-5" />
          How to Play
        </Link>
      </Button>
    </div>
  );
};

export default HelpSection;
