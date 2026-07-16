/*
# รองรับการเลือก "ประเภท" ได้มากกว่า 1 รายการต่อสินค้า

1. ปัญหาที่แก้
   - เดิม products.category_id เป็นค่าเดียว ทำให้ 1 สินค้าอยู่ได้แค่
     1 ประเภทย่อย (ประเภท) เท่านั้น เช่น เลือกได้แค่ "เสื้อ" หรือ "อุปกรณ์"
     อย่างใดอย่างหนึ่ง ทั้งที่บางสินค้าอาจจัดอยู่หลายประเภทพร้อมกันได้

2. สิ่งที่ทำ
   - เพิ่มคอลัมน์ category_ids (uuid[]) เก็บรายการ "ประเภท" (หมวดย่อย)
     ที่เลือกได้หลายรายการ
   - category_id (เดิม) เปลี่ยนบทบาทให้ใช้เป็น "หมวดหมู่หลัก" อย่างเดียว
     (ค่าคงเดิมสำหรับสินค้าที่เคยผูกกับหมวดหลักอยู่แล้วไม่กระทบ)
   - Backfill: ถ้าสินค้าไหนเคยถูกผูก category_id เข้ากับ "ประเภทย่อย" ตรง ๆ
     (จากฟีเจอร์เลือกประเภทเดี่ยวก่อนหน้านี้) ให้ย้ายค่านั้นไปเก็บใน category_ids
     แทน แล้วปรับ category_id กลับไปเป็นหมวดหลัก (parent) ของประเภทนั้น
     เพื่อไม่ให้ข้อมูลเดิมหาย
   - เพิ่ม GIN index บน category_ids เพื่อให้ query ด้วย @> / && เร็วขึ้น

3. ความปลอดภัย
   - ไม่ลบคอลัมน์เดิม ไม่กระทบ RLS policies ที่มีอยู่
   - ใช้ IF NOT EXISTS / idempotent ทุกจุด รันซ้ำได้ปลอดภัย
*/

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category_ids uuid[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_category_ids
  ON public.products USING GIN (category_ids);

-- Backfill: ย้ายสินค้าที่ category_id ชี้ตรงไปที่ "ประเภทย่อย" (มี parent_id)
-- ให้ไปอยู่ใน category_ids แทน แล้วดึง category_id กลับไปเป็นหมวดหลัก
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.id AS product_id, c.id AS sub_id, c.parent_id AS root_id
    FROM public.products p
    JOIN public.categories c ON c.id = p.category_id
    WHERE c.parent_id IS NOT NULL
  LOOP
    UPDATE public.products
    SET category_id = r.root_id,
        category_ids = (
          SELECT array_agg(DISTINCT x) FROM unnest(category_ids || ARRAY[r.sub_id]) AS x
        )
    WHERE id = r.product_id;
  END LOOP;
END $$;
