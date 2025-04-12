
import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, index }) => {
  return (
    <div 
      className="fun-card p-6 rounded-2xl" 
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="bg-white dark:bg-gray-800 w-20 h-20 mx-auto rounded-xl flex items-center justify-center mb-4 shadow-md">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default FeatureCard;
