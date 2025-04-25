
import React, { useEffect } from 'react';
import { generateMetaKeywords, cacheKeywords, getCachedKeywords } from '@/services/keywordService';

interface SEOKeywordsProps {
  customKeywords?: string[];
}

const SEOKeywords: React.FC<SEOKeywordsProps> = ({ customKeywords }) => {
  useEffect(() => {
    const updateKeywords = async () => {
      // If custom keywords are provided, use them
      if (customKeywords && customKeywords.length > 0) {
        const metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        metaKeywords.content = customKeywords.join(', ');
        
        // Remove existing keywords meta tag if present
        const existingMeta = document.querySelector('meta[name="keywords"]');
        if (existingMeta) {
          existingMeta.remove();
        }
        
        document.head.appendChild(metaKeywords);
        return;
      }
      
      // Check if we have cached keywords first
      const cachedKeywords = getCachedKeywords();
      
      if (cachedKeywords.length > 0) {
        // Use cached keywords if available
        const metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        metaKeywords.content = cachedKeywords.join(', ');
        
        // Remove existing keywords meta tag if present
        const existingMeta = document.querySelector('meta[name="keywords"]');
        if (existingMeta) {
          existingMeta.remove();
        }
        
        document.head.appendChild(metaKeywords);
      } else {
        // Generate new keywords if cache is empty
        const keywords = await generateMetaKeywords();
        cacheKeywords(keywords);
        
        const metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        metaKeywords.content = keywords.join(', ');
        
        // Remove existing keywords meta tag if present
        const existingMeta = document.querySelector('meta[name="keywords"]');
        if (existingMeta) {
          existingMeta.remove();
        }
        
        document.head.appendChild(metaKeywords);
      }
    };
    
    updateKeywords();
    
    // Clean up function
    return () => {
      // We don't want to remove the keywords meta tag when unmounting
      // because we want it to persist across page navigations
    };
  }, [customKeywords]);
  
  return null; // This is a utility component that doesn't render anything
};

export default SEOKeywords;
