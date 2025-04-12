
import React from 'react';
import { ShieldCheck, BookOpen, Check } from 'lucide-react';

const InfoSection: React.FC = () => {
  return (
    <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <div className="flex items-center mb-4">
          <ShieldCheck className="w-8 h-8 text-teal-500 mr-3" />
          <h3 className="text-2xl font-bold">Secure & Reliable</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          At CuizIN, we take your security seriously. All transactions are processed through secure payment gateways, and your personal information is protected with industry-standard encryption.
        </p>
        <ul className="space-y-2">
          <li className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
            <span>Encrypted data transmission</span>
          </li>
          <li className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
            <span>Secure payment processing</span>
          </li>
          <li className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
            <span>Transparent reward system</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
        <div className="flex items-center mb-4">
          <BookOpen className="w-8 h-8 text-indigo-500 mr-3" />
          <h3 className="text-2xl font-bold">Learn While You Earn</h3>
        </div>
        <p className="text-muted-foreground mb-4">
          Our quiz questions are carefully curated to be both entertaining and educational. Expand your knowledge in various categories while earning rewards for your correct answers.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/70 dark:bg-gray-700/70 rounded-lg p-3 text-center">
            <span className="block font-medium">Science</span>
          </div>
          <div className="bg-white/70 dark:bg-gray-700/70 rounded-lg p-3 text-center">
            <span className="block font-medium">History</span>
          </div>
          <div className="bg-white/70 dark:bg-gray-700/70 rounded-lg p-3 text-center">
            <span className="block font-medium">Geography</span>
          </div>
          <div className="bg-white/70 dark:bg-gray-700/70 rounded-lg p-3 text-center">
            <span className="block font-medium">Sports</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoSection;
