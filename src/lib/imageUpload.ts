import { supabase } from './supabase';

// ย่อขนาด + บีบอัดรูปฝั่ง browser ก่อนอัปโหลดขึ้น Supabase Storage
// รูปที่แอดมินอัปโหลด (มักตรงจากกล้อง/มือถือ ขนาด 3-8 MB) จะถูกลดเหลือ
// ไม่เกิน maxDimension px ด้านยาว และบีบเป็น JPEG คุณภาพ ~82% (ปกติเหลือไม่ถึง 300 KB)
export async function compressImage(file: File, maxDimension = 1600, quality = 0.82): Promise<Blob> {
  // ไม่ใช่ไฟล์รูป (เช่น .gif หรือไฟล์แปลก ๆ) ก็อัปโหลดตามเดิม ไม่ต้องเสี่ยงแปลง
  if (!file.type.startsWith('image/')) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

  // ถ้าบีบอัดแล้วไฟล์กลับใหญ่กว่าเดิม (ไฟล์ต้นฉบับเล็กอยู่แล้ว) ใช้ไฟล์เดิมดีกว่า
  if (!blob || blob.size >= file.size) return file;
  return blob;
}

/**
 * Compress + upload a single image file to the (public) `product-images` bucket
 * under an optional folder prefix, returning its public URL.
 * Site-content images (hero slides, promo banner, category covers) share the
 * same bucket under a `site/` prefix — same RLS policy (admin write, public read),
 * no extra bucket/policy needed.
 */
export async function uploadSiteImage(file: File, folder = 'site'): Promise<string | null> {
  const optimized = await compressImage(file);
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage
    .from('product-images')
    .upload(fileName, optimized, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });
  if (error) return null;
  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return data.publicUrl;
}
