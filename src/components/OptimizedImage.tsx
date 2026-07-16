import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
  onClick?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  priority = false,
  sizes,
  onClick,
}: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <div className="absolute inset-0 skeleton" aria-hidden />}
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={loading}
        decoding="async"
        {...(priority ? { fetchpriority: 'high' } : {})}
        onLoad={() => setLoaded(true)}
        onClick={onClick}
        className={`${className} transition-opacity duration-500 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}
