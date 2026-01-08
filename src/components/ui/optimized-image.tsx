/**
 * Optimized Image Component with lazy loading and WebP support
 * Use this component instead of raw <img> tags for better performance
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallbackSrc?: string;
  aspectRatio?: string;
  priority?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  fallbackSrc = '/placeholder.svg',
  aspectRatio,
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Preload priority images
  useEffect(() => {
    if (priority && src) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [priority, src]);

  const handleError = () => {
    setHasError(true);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const imageSrc = hasError ? fallbackSrc : src;

  // Generate WebP srcset if the image is a standard format
  const isStandardImage = /\.(jpe?g|png|gif)$/i.test(src);
  const webpSrc = isStandardImage ? src.replace(/\.(jpe?g|png|gif)$/i, '.webp') : null;

  return (
    <picture>
      {/* WebP source for browsers that support it */}
      {webpSrc && !hasError && (
        <source srcSet={webpSrc} type="image/webp" />
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding={priority ? 'sync' : 'async'}
        onError={handleError}
        onLoad={handleLoad}
        className={cn(
          'transition-opacity duration-300',
          !isLoaded && 'opacity-0',
          isLoaded && 'opacity-100',
          className
        )}
        style={aspectRatio ? { aspectRatio } : undefined}
      />
    </picture>
  );
};

export default OptimizedImage;

// Re-export for convenience
export { OptimizedImage };
