
import React from 'react';

const AnimatedBackgrounds: React.FC = () => {
  return (
    <>
      <div className="animated-bg top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-400/20 dark:bg-blue-500/20" />
      <div className="animated-bg bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-400/20 dark:bg-purple-500/20" />
    </>
  );
};

export default AnimatedBackgrounds;
