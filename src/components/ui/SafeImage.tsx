'use client';

import React, { useState, useEffect } from 'react';

export const cleanImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  // Fix Cloudinary URL by replacing /raw/upload/ with /image/upload/
  return url.replace('/raw/upload/', '/image/upload/');
};

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
}

/**
 * SafeImage component that automatically cleans Cloudinary URLs
 * and catches loading errors (e.g. 404 Not Found from Cloudinary),
 * displaying the fallback UI instead of broken image placeholders.
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallback,
  className,
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const cleanedUrl = cleanImageUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!cleanedUrl || hasError) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={cleanedUrl}
      alt={alt}
      className={className}
      onError={(e) => {
        setHasError(true);
        if (onError) onError(e);
      }}
      {...props}
    />
  );
};

export default SafeImage;
