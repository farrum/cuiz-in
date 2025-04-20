
import React, { useEffect } from 'react';
import { generateMetaKeywords, cacheKeywords, getCachedKeywords } from '@/services/keywordService';

const SEOKeywords: React.FC = () => {
  useEffect(() => {
    const updateKeywords = async () => {
      // Check if we have cached keywords first
      const cachedKeywords = getCachedKeywords();
      
      if (cachedKeywords.length === 0) {
        // Generate new keywords if cache is empty
        const keywords = await generateMetaKeywords();
        cacheKeywords(keywords);
        
        // Add keywords meta tag to document head
        const metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        metaKeywords.content = keywords.join(', ');
        document.head.appendChild(metaKeywords);
      }
    };
    
    updateKeywords();
  }, []);
  
  return null; // This is a utility component that doesn't render anything
};

export default SEOKeywords;

