-- ============================================================
-- Fix double-encoded jsonb columns (sizes, colors, images)
-- ============================================================
-- ปัญหา: บาง row ถูก insert เป็น JSON string ที่ stringify ซ้ำสอง
-- ทำให้ jsonb_typeof(col) = 'string' แทนที่จะเป็น 'array'
-- เช่น เก็บเป็น  "[\"S\",\"M\",\"L\"]"  แทนที่จะเป็น  ["S","M","L"]
--
-- วิธีใช้:
-- 1) รัน STEP 1 (SELECT) ก่อน เพื่อดูว่ามีกี่แถวที่เพี้ยน
-- 2) ตรวจสอบผลลัพธ์ให้แน่ใจว่าโอเค
-- 3) รัน STEP 2 (UPDATE) เพื่อแก้ข้อมูลจริง
-- 4) รัน STEP 3 (VERIFY) เพื่อยืนยันว่าไม่มีแถวเพี้ยนเหลือแล้ว
-- ============================================================


-- ============================================================
-- STEP 1: ตรวจสอบก่อนว่ามีแถวไหนเพี้ยนบ้าง (ไม่แก้ไขข้อมูลใดๆ)
-- ============================================================
SELECT
  id,
  name,
  jsonb_typeof(sizes)  AS sizes_type,
  jsonb_typeof(colors) AS colors_type,
  jsonb_typeof(images) AS images_type,
  sizes,
  colors,
  images
FROM public.products
WHERE jsonb_typeof(sizes)  = 'string'
   OR jsonb_typeof(colors) = 'string'
   OR jsonb_typeof(images) = 'string';


-- ============================================================
-- STEP 2: แก้ไขข้อมูลจริง
-- เงื่อนไข: เฉพาะแถวที่ type เป็น 'string' และ string นั้น
-- หน้าตาเป็น JSON array ที่ valid (ขึ้นต้น/ลงท้ายด้วย [ ])
-- เพื่อความปลอดภัย ไม่แตะแถวที่ข้อมูลเพี้ยนแบบอื่น
-- ============================================================

-- 2.1 แก้คอลัมน์ sizes
UPDATE public.products
SET sizes = (sizes #>> '{}')::jsonb
WHERE jsonb_typeof(sizes) = 'string'
  AND (sizes #>> '{}') ~ '^\s*\[.*\]\s*$';

-- 2.2 แก้คอลัมน์ colors
UPDATE public.products
SET colors = (colors #>> '{}')::jsonb
WHERE jsonb_typeof(colors) = 'string'
  AND (colors #>> '{}') ~ '^\s*\[.*\]\s*$';

-- 2.3 แก้คอลัมน์ images
UPDATE public.products
SET images = (images #>> '{}')::jsonb
WHERE jsonb_typeof(images) = 'string'
  AND (images #>> '{}') ~ '^\s*\[.*\]\s*$';


-- ============================================================
-- STEP 3: ยืนยันผลลัพธ์ — ควรได้ 0 แถวถ้าแก้สำเร็จทั้งหมด
-- ============================================================
SELECT
  id,
  name,
  jsonb_typeof(sizes)  AS sizes_type,
  jsonb_typeof(colors) AS colors_type,
  jsonb_typeof(images) AS images_type
FROM public.products
WHERE jsonb_typeof(sizes)  = 'string'
   OR jsonb_typeof(colors) = 'string'
   OR jsonb_typeof(images) = 'string';


-- ============================================================
-- STEP 4 (ทางเลือก): ป้องกันไม่ให้ข้อมูลเพี้ยนแบบนี้เกิดซ้ำอีก
-- เพิ่ม CHECK constraint บังคับว่า sizes/colors/images
-- ต้องเป็น jsonb array เท่านั้น ห้ามเป็น string/object
-- ============================================================
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_sizes_is_array,
  ADD CONSTRAINT products_sizes_is_array
    CHECK (jsonb_typeof(sizes) = 'array');

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_colors_is_array,
  ADD CONSTRAINT products_colors_is_array
    CHECK (jsonb_typeof(colors) = 'array');

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_images_is_array,
  ADD CONSTRAINT products_images_is_array
    CHECK (jsonb_typeof(images) = 'array');

-- หมายเหตุ: ถ้า ALTER TABLE ใน STEP 4 error แปลว่ายังมีแถวที่ไม่ใช่ array
-- อยู่ (STEP 2 แก้ไม่หมด) ให้กลับไปดู STEP 1 อีกครั้งเพื่อหา edge case
-- ที่ regex ไม่ครอบคลุม แล้วแก้ด้วยมือเป็นรายแถว
