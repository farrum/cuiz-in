
import { useEffect, useState } from 'react';

export const useAdBlockerDetection = (): { 
  adBlockerDetected: boolean; 
  isChecking: boolean;
} => {
  const [adBlockerDetected, setAdBlockerDetected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // Check for common ad blocker behavior
    const checkForAdBlocker = async () => {
      try {
        // Try to load a test script that ad blockers often block
        const testElement = document.createElement('div');
        testElement.className = 'ad-banner ad_banner adsbox';
        testElement.style.height = '1px';
        testElement.style.width = '1px';
        testElement.style.position = 'absolute';
        testElement.style.top = '-10000px';
        testElement.style.left = '-10000px';
        document.body.appendChild(testElement);

        // Check if the element's height was modified (some ad blockers will)
        setTimeout(() => {
          const isBlocked = testElement.offsetHeight === 0;
          setAdBlockerDetected(isBlocked);
          setIsChecking(false);
          
          // Clean up
          if (testElement.parentNode) {
            document.body.removeChild(testElement);
          }
        }, 100);
      } catch (error) {
        console.log('Ad blocker detection error:', error);
        setAdBlockerDetected(true);
        setIsChecking(false);
      }
    };

    checkForAdBlocker();
  }, []);

  return { adBlockerDetected, isChecking };
};
