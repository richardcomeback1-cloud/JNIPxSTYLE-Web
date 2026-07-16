/*
# เพิ่มหมวดหมู่ย่อย (ประเภท) ให้ตรงกับตัวกรองหน้าร้าน

1. ปัญหาที่แก้
   - ตาราง categories มีแค่ 4 หมวดหลัก (female-uniform, university-uniform-boy,
     unisex, graduation-formal) ไม่มีหมวดย่อย (parent_id ไม่เคยถูกใช้เลย)
   - ฟอร์มเพิ่ม/แก้สินค้าในแอดมิน (ProductFormModal) รองรับ dropdown "ประเภท"
     ที่อ่านหมวดย่อยจาก parent_id อยู่แล้ว แต่เนื่องจากไม่มีข้อมูลหมวดย่อยเลย
     dropdown เลยว่างเปล่าเสมอ ("ไม่มีประเภทย่อย")
   - หน้าร้าน (src/lib/categories.ts) มีรายการ "ประเภท" แบบ hardcode อยู่แล้ว
     (เช่น เสื้อ, กระโปรง, กางเกง ฯลฯ) แต่เป็นคนละระบบกับตาราง categories
     ทำให้แอดมินเลือกประเภทให้สินค้าไม่ได้ และของสองฝั่งไม่เชื่อมกัน

2. สิ่งที่ทำ
   - เพิ่มแถวหมวดย่อยใน categories โดยตั้ง parent_id ชี้กลับไปหมวดหลัก
   - ใช้ชื่อ (name) ตรงกับ label ในหน้าร้านทุกตัวอักษร เพื่อให้ระบบ filter
     ของหน้าร้าน (ShopPage) จับคู่กับหมวดย่อยจริงใน DB ได้
   - slug ตั้งเป็นภาษาอังกฤษ ไม่ซ้ำกันทั้งตาราง (มี prefix ตามหมวดหลัก
     เพราะชื่อประเภท เช่น "เสื้อ" ซ้ำกันได้หลายหมวดหลัก)
   - Idempotent: ใช้ WHERE NOT EXISTS ตรวจสอบก่อน insert ทุกแถว รันซ้ำได้ปลอดภัย

3. ความปลอดภัย
   - ไม่แตะ RLS policies (ใช้ของเดิมที่มีอยู่กับตาราง categories)
   - ไม่กระทบสินค้าเดิม เพราะเป็นการ "เพิ่ม" หมวดย่อยใหม่ ไม่แก้ category_id
     ของสินค้าที่มีอยู่
*/

DO $$
DECLARE
  female_id uuid;
  boy_id uuid;
  unisex_id uuid;
  grad_id uuid;
BEGIN
  SELECT id INTO female_id FROM public.categories WHERE slug = 'female-uniform';
  SELECT id INTO boy_id FROM public.categories WHERE slug = 'university-uniform-boy';
  SELECT id INTO unisex_id FROM public.categories WHERE slug = 'unisex';
  SELECT id INTO grad_id FROM public.categories WHERE slug = 'graduation-formal';

  -- ============================================================
  -- นักศึกษาหญิง (female-uniform)
  -- ============================================================
  IF female_id IS NOT NULL THEN
    INSERT INTO public.categories (id, name, slug, parent_id, description, image_url, sort_order)
    SELECT gen_random_uuid(), v.name, v.slug, female_id, NULL, NULL, v.sort_order
    FROM (VALUES
      ('เสื้อ', 'female-uniform-shirt', 1),
      ('กระโปรง', 'female-uniform-skirt', 2),
      ('กางเกง', 'female-uniform-pants', 3),
      ('ชุดพละ', 'female-uniform-pe-set', 4),
      ('รองเท้า', 'female-uniform-shoes', 5),
      ('ถุงเท้า', 'female-uniform-socks', 6),
      ('อุปกรณ์', 'female-uniform-accessories', 7)
    ) AS v(name, slug, sort_order)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categories WHERE parent_id = female_id AND name = v.name
    );
  END IF;

  -- ============================================================
  -- นักศึกษาชาย (university-uniform-boy)
  -- ============================================================
  IF boy_id IS NOT NULL THEN
    INSERT INTO public.categories (id, name, slug, parent_id, description, image_url, sort_order)
    SELECT gen_random_uuid(), v.name, v.slug, boy_id, NULL, NULL, v.sort_order
    FROM (VALUES
      ('เสื้อ', 'boy-uniform-shirt', 1),
      ('กางเกง', 'boy-uniform-pants', 2),
      ('ชุดพละ', 'boy-uniform-pe-set', 3),
      ('รองเท้า', 'boy-uniform-shoes', 4),
      ('ถุงเท้า', 'boy-uniform-socks', 5),
      ('อุปกรณ์', 'boy-uniform-accessories', 6)
    ) AS v(name, slug, sort_order)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categories WHERE parent_id = boy_id AND name = v.name
    );
  END IF;

  -- ============================================================
  -- ยูนิเซ็กซ์ (unisex)
  -- ============================================================
  IF unisex_id IS NOT NULL THEN
    INSERT INTO public.categories (id, name, slug, parent_id, description, image_url, sort_order)
    SELECT gen_random_uuid(), v.name, v.slug, unisex_id, NULL, NULL, v.sort_order
    FROM (VALUES
      ('กระเป๋า', 'unisex-bags', 1),
      ('หมวก', 'unisex-hats', 2),
      ('ของใช้ทั่วไป', 'unisex-general-goods', 3)
    ) AS v(name, slug, sort_order)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categories WHERE parent_id = unisex_id AND name = v.name
    );
  END IF;

  -- ============================================================
  -- ชุดครุย/ชุดพิธีการ (graduation-formal)
  -- ============================================================
  IF grad_id IS NOT NULL THEN
    INSERT INTO public.categories (id, name, slug, parent_id, description, image_url, sort_order)
    SELECT gen_random_uuid(), v.name, v.slug, grad_id, NULL, NULL, v.sort_order
    FROM (VALUES
      ('ชุดครุย', 'graduation-formal-gown', 1),
      ('เสื้อเชิ้ต', 'graduation-formal-dress-shirt', 2),
      ('เนกไท', 'graduation-formal-necktie', 3),
      ('รองเท้า', 'graduation-formal-shoes', 4)
    ) AS v(name, slug, sort_order)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.categories WHERE parent_id = grad_id AND name = v.name
    );
  END IF;
END $$;
