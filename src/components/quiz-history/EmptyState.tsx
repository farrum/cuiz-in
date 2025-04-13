
import React from 'react';
import { Button } from '@/components/ui/button';

const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>You haven't answered any questions yet.</p>
      <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/quiz'}>
        Start Answering Questions
      </Button>
    </div>
  );
};

export default EmptyState;
