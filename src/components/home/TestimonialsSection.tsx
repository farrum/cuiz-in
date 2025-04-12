
import React from 'react';
import { Gift } from 'lucide-react';

const TestimonialsSection: React.FC = () => {
  return (
    <div className="mt-12 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
      <div className="flex items-center justify-center mb-6">
        <Gift className="w-10 h-10 text-purple-500 mr-3" />
        <h2 className="text-3xl font-bold">Testimonials from Our Community</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <blockquote className="bg-white/70 dark:bg-gray-700/70 p-5 rounded-xl shadow">
          <p className="italic text-muted-foreground mb-4">
            "I've been playing CuizIN for 3 months and have already earned ₹15,000. It's a fun way to test my knowledge and make some extra income!"
          </p>
          <footer className="font-medium">- Priya S.</footer>
        </blockquote>
        <blockquote className="bg-white/70 dark:bg-gray-700/70 p-5 rounded-xl shadow">
          <p className="italic text-muted-foreground mb-4">
            "The daily challenges keep me coming back. I love competing with friends and watching my points add up toward real cash rewards."
          </p>
          <footer className="font-medium">- Rahul M.</footer>
        </blockquote>
        <blockquote className="bg-white/70 dark:bg-gray-700/70 p-5 rounded-xl shadow">
          <p className="italic text-muted-foreground mb-4">
            "CuizIN has the best referral program! I invited 10 friends and earned bonus points for each one. The withdrawal process is quick and easy."
          </p>
          <footer className="font-medium">- Anjali P.</footer>
        </blockquote>
      </div>
    </div>
  );
};

export default TestimonialsSection;
