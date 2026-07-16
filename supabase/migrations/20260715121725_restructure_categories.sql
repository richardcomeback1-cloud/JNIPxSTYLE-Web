/*
# ปรับโครงสร้างหมวดหมู่สินค้า (Restructure Product Categories)

1. สรุปการเปลี่ยนแปลง
   - ปรับโครงสร้างหมวดหมู่ใหม่ให้เป็น 4 หมวดหลัก + shortcut categories ที่จัดการใน frontend
   - หมวดหลัก: นักศึกษาหญิง (female-uniform), นักศึกษาชาย (university-uniform-boy), ยูนิเซ็กซ์ (unisex), ชุดครุย/ชุดพิธีการ (graduation-formal)
   - Shortcut categories (new-arrivals, best-sellers, on-sale) ไม่ใช่หมวดจริงใน DB — ใช้ flag query (is_new, is_sale, sold_count) ใน frontend

2. รายละเอียดการเปลี่ยนแปลง
   - เปลี่ยน slug 'school-uniform-girl' → 'female-uniform' และเปลี่ยนชื่อเป็น 'นักศึกษาหญิง'
   - ย้ายสินค้าจากหมวด 'university-uniform-girl' ไปยัง 'female-uniform' แล้วลบหมวดเดิม
   - เปลี่ยนชื่อหมวด 'university-uniform-boy' → 'นักศึกษาชาย' (คง slug เดิม)
   - เพิ่มหมวดใหม่: 'unisex' (ยูนิเซ็กซ์), 'graduation-formal' (ชุดครุย/ชุดพิธีการ)
   - ลบหมวด 'pe-sport', 'accessories', 'sale' ออกจาก DB (เปลี่ยนเป็น shortcut ที่จัดการใน frontend)
   - สินค้าในหมวดที่ถูกลบจะถูกย้ายไปหมวดที่เหมาะสมก่อนลบ

3. ความปลอดภัย
   - ไม่มีการเปลี่ยนแปลง RLS policies (ใช้ policies ที่มีอยู่แล้ว)
   - ใช้ DO $$ ... END $$ block เพื่อให้ idempotent
*/

-- ============================================================
-- STEP 1: เปลี่ยน slug และชื่อหมวด school-uniform-girl → female-uniform
-- ============================================================
UPDATE public.categories
SET slug = 'female-uniform', name = 'นักศึกษาหญิง', sort_order = 1
WHERE slug = 'school-uniform-girl';

-- ============================================================
-- STEP 2: ย้ายสินค้าจาก university-uniform-girl ไป female-uniform แล้วลบ
-- ============================================================
DO $$
DECLARE
  target_cat_id uuid;
  source_cat_id uuid;
BEGIN
  SELECT id INTO target_cat_id FROM public.categories WHERE slug = 'female-uniform';
  SELECT id INTO source_cat_id FROM public.categories WHERE slug = 'university-uniform-girl';

  IF source_cat_id IS NOT NULL AND target_cat_id IS NOT NULL THEN
    UPDATE public.products SET category_id = target_cat_id WHERE category_id = source_cat_id;
    DELETE FROM public.categories WHERE id = source_cat_id;
  END IF;
END $$;

-- ============================================================
-- STEP 3: เปลี่ยนชื่อ university-uniform-boy → นักศึกษาชาย (คง slug)
-- ============================================================
UPDATE public.categories
SET name = 'นักศึกษาชาย', sort_order = 2
WHERE slug = 'university-uniform-boy';

-- ============================================================
-- STEP 4: เพิ่มหมวดใหม่ unisex และ graduation-formal (ถ้ายังไม่มี)
-- ============================================================
INSERT INTO public.categories (id, name, slug, parent_id, description, image_url, sort_order)
SELECT gen_random_uuid(), 'ยูนิเซ็กซ์', 'unisex', NULL, 'กระเป๋า หมวก ของใช้ทั่วไป', NULL, 3
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'unisex');

INSERT INTO public.categories (id, name, slug, parent_id, description, image_url, sort_order)
SELECT gen_random_uuid(), 'ชุดครุย/ชุดพิธีการ', 'graduation-formal', NULL, 'ชุดครุยและชุดพิธีการสำหรับพิธีจบการศึกษา', NULL, 4
WHERE NOT EXISTS (SELECT 1 FROM public.categories WHERE slug = 'graduation-formal');

-- ============================================================
-- STEP 5: ย้ายสินค้าจาก pe-sport, accessories ไปหมวดที่เหมาะสม แล้วลบ
-- ============================================================
DO $$
DECLARE
  female_id uuid;
  unisex_id uuid;
  pe_id uuid;
  acc_id uuid;
BEGIN
  SELECT id INTO female_id FROM public.categories WHERE slug = 'female-uniform';
  SELECT id INTO unisex_id FROM public.categories WHERE slug = 'unisex';
  SELECT id INTO pe_id FROM public.categories WHERE slug = 'pe-sport';
  SELECT id INTO acc_id FROM public.categories WHERE slug = 'accessories';

  -- ย้ายสินค้า pe-sport ไป female-uniform (ชุดพละอยู่ใต้หมวดนักศึกษาหญิง/ชาย)
  IF pe_id IS NOT NULL AND female_id IS NOT NULL THEN
    UPDATE public.products SET category_id = female_id WHERE category_id = pe_id;
    DELETE FROM public.categories WHERE id = pe_id;
  END IF;

  -- ย้ายสินค้า accessories ไป unisex
  IF acc_id IS NOT NULL AND unisex_id IS NOT NULL THEN
    UPDATE public.products SET category_id = unisex_id WHERE category_id = acc_id;
    DELETE FROM public.categories WHERE id = acc_id;
  END IF;
END $$;

-- ============================================================
-- STEP 6: ลบหมวด 'sale' ออกจาก DB (ใช้เป็น shortcut ใน frontend)
-- ============================================================
DELETE FROM public.categories WHERE slug = 'sale';