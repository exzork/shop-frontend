import React, { useState } from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

const getProxyUrl = (url: string) => {
  // If the URL is already a blob URL or data URL, return as is
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  
  // If the URL is from our own domain, return as is
  if (url.startsWith('/') || url.startsWith(window.location.origin)) {
    return url;
  }

  // For external URLs, use our caching endpoint
  return `/api/image/cache?url=${encodeURIComponent(url)}`;
};

export const Image: React.FC<ImageProps> = ({ src, alt, ...props }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);

  // Get the proxy URL for external images
  const displaySrc = getProxyUrl(src);

  return (
    <>
      {isLoading && (
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700" style={{ width: props.width || '100%', height: props.height || '100%' }} />
      )}
      <img
        src={error ? src : displaySrc}
        alt={alt}
        loading="lazy"
        {...props}
        style={{
          ...props.style,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          if (!error) {
            setError(true);
          }
        }}
      />
    </>
  );
}; 