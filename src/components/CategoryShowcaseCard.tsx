import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Category } from '../types';

interface Props {
  category: Category;
  /** product image URLs belonging to this category, used as an auto-sliding showcase */
  images: string[];
  fallbackImage: string;
  /** stagger the auto-slide start per card so they don't all flip in sync */
  intervalOffset?: number;
  onClick: () => void;
}

const SLIDE_INTERVAL = 3200;

export default function CategoryShowcaseCard({
  category,
  images,
  fallbackImage,
  intervalOffset = 0,
  onClick,
}: Props) {
  const slides = images.length > 0 ? images : [fallbackImage];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
      interval = setInterval(() => {
        setIndex((i) => (i + 1) % slides.length);
      }, SLIDE_INTERVAL);
    }, SLIDE_INTERVAL + intervalOffset);
    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [slides.length, intervalOffset]);

  return (
    <button
      onClick={onClick}
      className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-rose-100 hover:shadow-lg transition-shadow"
    >
      {slides.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={category.name}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover transition-[opacity,transform] duration-[1400ms] ease-in-out group-hover:scale-105 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-taupe-900/70 via-taupe-900/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <h3 className="font-prompt text-lg font-bold text-white">{category.name}</h3>
        <p className="text-xs text-white/80 mt-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          ดูสินค้า <ArrowRight className="w-3 h-3" />
        </p>
      </div>
      {slides.length > 1 && (
        <div className="absolute top-3 right-3 flex gap-1 z-10">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? 'w-3 bg-white' : 'w-1 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </button>
  );
}
