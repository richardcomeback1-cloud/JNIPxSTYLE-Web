import { useState } from 'react';

interface Props {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
  onClick?: () => void;
  /** ความกว้างเป้าหมาย (px) ที่รูปจะถูกแสดงจริง ใช้คำนวณ resize param ให้โฮสต์ที่รองรับ */
  width?: number;
}

// ย่อขนาดรูปจริง ๆ (ไม่ใช่แค่ lazy-load) สำหรับโฮสต์ที่รองรับ resize ผ่าน query param
// เดิม component นี้โหลดไฟล์ต้นฉบับเต็มขนาดเสมอ ทำให้เปลืองแบนด์วิดท์/เวลาถอดรหัสภาพมาก
// โดยเฉพาะรูปจาก Pexels/Vecteezy ที่มักเป็นไฟล์ "large_2x" หลาย MB
function getOptimizedSrc(src: string, width: number): string {
  try {
    const url = new URL(src);
    if (url.hostname.includes('images.pexels.com')) {
      url.searchParams.set('auto', 'compress');
      url.searchParams.set('cs', 'tinysrgb');
      url.searchParams.set('w', String(width));
      return url.toString();
    }
    // หมายเหตุ: รูปสินค้าจริงมาจาก Supabase Storage (bucket "product-images")
    // Supabase มี image transformation endpoint (/render/image/public/...) ที่ resize ได้
    // แต่เป็นฟีเจอร์ของแพ็กเกจ Pro ขึ้นไป — ถ้า project นี้ยังเป็น Free tier
    // การยิงไป endpoint นั้นจะพังทันที (error 400) ทำให้รูปสินค้าทั้งเว็บหายหมด
    // จึงไม่ rewrite URL นี้อัตโนมัติ ปลอดภัยกว่าให้ "บีบอัดรูปตอนอัปโหลด" แทน
    // (ดูจุดที่แก้ใน ProductFormModal.tsx — บีบอัด/ย่อรูปก่อนอัปโหลดขึ้น Storage)
  } catch {
    // src ไม่ใช่ absolute URL ที่ parse ได้ ใช้ค่าเดิม
  }
  return src;
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  priority = false,
  sizes,
  onClick,
  width = 800,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const optimizedSrc = src ? getOptimizedSrc(src, width) : src;

  return (
    <>
      {!loaded && <div className="absolute inset-0 skeleton" aria-hidden />}
      <img
        src={optimizedSrc}
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
