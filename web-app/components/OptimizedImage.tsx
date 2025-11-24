'use client';

import { useState } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Placeholder for when image fails to load
  const fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24"%3ENo Image%3C/text%3E%3C/svg%3E';

  if (hasError) {
    return (
      <div className={`bg-neutral-200 flex items-center justify-center ${className}`} role="img" aria-label={alt}>
        <span className="text-4xl" aria-hidden="true">📷</span>
      </div>
    );
  }

  const imageProps = {
    src: src || fallbackSrc,
    alt,
    className: `${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`,
    onLoad: () => setIsLoading(false),
    onError: () => {
      setHasError(true);
      setIsLoading(false);
    },
    priority,
    quality: 85,
    ...(fill
      ? { fill: true, style: { objectFit } }
      : { width: width || 400, height: height || 300 }),
    ...(sizes && { sizes }),
  };

  return <Image {...imageProps} />;
}
