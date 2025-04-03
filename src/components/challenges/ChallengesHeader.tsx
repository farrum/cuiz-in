
import React from 'react';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChallengesHeaderProps {
  title: string;
}

const ChallengesHeader: React.FC<ChallengesHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => navigate('/archived-challenges')}
        className="flex items-center"
      >
        <Archive className="h-4 w-4 mr-1" /> View Archived
      </Button>
    </div>
  );
};

export default ChallengesHeader;
