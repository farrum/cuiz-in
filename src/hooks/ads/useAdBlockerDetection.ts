
import { useEffect, useState } from 'react';

export const useAdBlockerDetection = (): { 
  adBlockerDetected: boolean; 
  isChecking: boolean;
} => {
  const [adBlockerDetected, setAdBlockerDetected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // Multiple detection techniques for ad blockers
    const checkForAdBlocker = async () => {
      try {
        // Method 1: Test for blocked CSS class names
        const testElement = document.createElement('div');
        testElement.className = 'ad-banner ad_banner adsbox pub_300x250 pub_300x250m pub_728x90 text-ad textAd banner_ad';
        testElement.style.height = '1px';
        testElement.style.width = '1px';
        testElement.style.position = 'absolute';
        testElement.style.top = '-10000px';
        testElement.style.left = '-10000px';
        document.body.appendChild(testElement);
        
        // Method 2: Try to fetch a common ad script
        let fetchBlocked = false;
        try {
          const fetchTest = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', { 
            method: 'HEAD',
            mode: 'no-cors',
            signal: AbortSignal.timeout(1000) // Abort after 1 second
          });
          // If we got here without being blocked, this is inconclusive
        } catch (fetchError) {
          fetchBlocked = true;
          console.log('Ad script fetch likely blocked by ad blocker');
        }

        // Check results and clean up after a brief delay
        setTimeout(() => {
          // CSS-based detection
          const isBlockedByCSS = testElement.offsetHeight === 0;
          
          // Combined detection logic
          const isBlocked = isBlockedByCSS || fetchBlocked;
          
          setAdBlockerDetected(isBlocked);
          setIsChecking(false);
          
          // Clean up
          if (testElement.parentNode) {
            document.body.removeChild(testElement);
          }
          
          console.log(`Ad blocker detection complete: ${isBlocked ? 'DETECTED' : 'NOT DETECTED'}`);
        }, 100);
      } catch (error) {
        console.log('Ad blocker detection error:', error);
        setAdBlockerDetected(true); // Assume blocked if detection fails
        setIsChecking(false);
      }
    };

    checkForAdBlocker();
  }, []);

  return { adBlockerDetected, isChecking };
};

