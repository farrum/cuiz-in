
import React from 'react';
import { Gift } from 'lucide-react';

const TestimonialsSection: React.FC = () => {
  return (
    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-center mb-4">
        <Gift className="w-8 h-8 text-purple-500 mr-3" />
        <h2 className="text-2xl font-bold">Testimonials from Our Community</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <blockquote className="bg-white/70 dark:bg-gray-700/70 p-4 rounded-xl shadow">
          <p className="italic text-muted-foreground mb-3 text-sm">
            "I've been playing CuizIN for 3 months and have already earned $180. It's a fun way to test my knowledge and make some extra income!"
          </p>
          <footer className="font-medium text-sm">- Sarah M.</footer>
        </blockquote>
        <blockquote className="bg-white/70 dark:bg-gray-700/70 p-4 rounded-xl shadow">
          <p className="italic text-muted-foreground mb-3 text-sm">
            "The daily challenges keep me coming back. I love competing with friends and watching my points add up toward real cash rewards."
          </p>
          <footer className="font-medium text-sm">- James R.</footer>
        </blockquote>
        <blockquote className="bg-white/70 dark:bg-gray-700/70 p-4 rounded-xl shadow">
          <p className="italic text-muted-foreground mb-3 text-sm">
            "CuizIN has the best referral program! I invited 10 friends and earned bonus points for each one. The withdrawal process is quick and easy."
          </p>
          <footer className="font-medium text-sm">- Emily P.</footer>
        </blockquote>
      </div>
    </div>
  );
};

export default TestimonialsSection;
