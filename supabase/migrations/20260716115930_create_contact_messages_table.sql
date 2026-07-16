-- ตารางเก็บข้อความติดต่อจากลูกค้า (ฟอร์มหน้าติดต่อเรา)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- อนุญาตให้ทุกคน (รวม anonymous) ส่งข้อความติดต่อได้ เพราะฟอร์มไม่บังคับ login
DROP POLICY IF EXISTS "insert_contact_messages" ON public.contact_messages;
CREATE POLICY "insert_contact_messages" ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- อ่าน/แก้ไข/ลบ ได้เฉพาะแอดมินเท่านั้น
DROP POLICY IF EXISTS "admin_read_contact_messages" ON public.contact_messages;
CREATE POLICY "admin_read_contact_messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admin_update_contact_messages" ON public.contact_messages;
CREATE POLICY "admin_update_contact_messages" ON public.contact_messages
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_contact_messages" ON public.contact_messages;
CREATE POLICY "admin_delete_contact_messages" ON public.contact_messages
  FOR DELETE TO authenticated USING (is_admin());
