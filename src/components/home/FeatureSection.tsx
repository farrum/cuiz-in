
import React from 'react';
import { Award, PartyPopper, IndianRupee } from 'lucide-react';
import FeatureCard from './FeatureCard';

const FeatureSection: React.FC = () => {
  const features = [
    {
      icon: <Award className="w-12 h-12 text-blue-500" />,
      title: "Play & Earn",
      description: "Answer quiz questions correctly to earn points. The more you play, the more you earn."
    },
    {
      icon: <PartyPopper className="w-12 h-12 text-purple-500" />,
      title: "Refer Friends",
      description: "Invite friends to join and earn bonus cash for each successful referral."
    },
    {
      icon: <IndianRupee className="w-12 h-12 text-green-500" />,
      title: "Cash Out",
      description: "Earn more than ₹5000 per month fix income."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      {features.map((feature, index) => (
        <FeatureCard 
          key={feature.title}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          index={index}
        />
      ))}
    </div>
  );
};

export default FeatureSection;
