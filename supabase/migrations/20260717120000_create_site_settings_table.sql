/*
# Create site_settings table

1. New Table
- `site_settings` (key text primary key, value jsonb, updated_at)
  Stores editable homepage/store content: hero slides, promo banner,
  category cover image overrides, and store contact info — so admins
  can change these from the Admin Panel instead of editing code.

2. Security
- Public (anon + authenticated) read access — content is shown on the
  public storefront (homepage, footer).
- Only admins (is_admin()) can insert/update/delete.

3. Seed data
- Seeds the current hardcoded homepage values as defaults so existing
  behavior is unchanged until an admin edits them.
*/

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "public_read_site_settings" on public.site_settings;
create policy "public_read_site_settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "admin_write_site_settings" on public.site_settings;
create policy "admin_write_site_settings"
  on public.site_settings for insert
  to authenticated
  with check (is_admin());

drop policy if exists "admin_update_site_settings" on public.site_settings;
create policy "admin_update_site_settings"
  on public.site_settings for update
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admin_delete_site_settings" on public.site_settings;
create policy "admin_delete_site_settings"
  on public.site_settings for delete
  to authenticated
  using (is_admin());

insert into public.site_settings (key, value) values
('hero_slides', '[
  {"title":"แต่งเต็มทุกช่วงวัยการเรียน","subtitle":"ชุดนักเรียน-นักศึกษาคุณภาพดี ในราคาที่คุณสัมผัสได้","cta":"ช้อปเลย","link":"/shop","image":"https://static.vecteezy.com/system/resources/previews/073/752/744/large_2x/white-dress-shirt-hanging-on-wooden-hanger-against-plain-background-free-photo.jpg"},
  {"title":"DEFINE YOUR STYLE","subtitle":"สินค้ามาใหม่ คอลเลกชั่นปีการศึกษาใหม่ พร้อมส่วนลดพิเศษ","cta":"ดูสินค้ามาใหม่","link":"/shop?filter=new","image":"https://static.vecteezy.com/system/resources/previews/073/349/438/non_2x/elegant-white-dress-shirt-hanging-in-a-modern-minimalist-wardrobe-free-photo.jpg"},
  {"title":"SALE สิ้นฤดู","subtitle":"ลดราคาสูงสุด 50% สินค้าคุณภาพ หมดปัญหาเรื่องชุด","cta":"ช้อปสินค้าลดราคา","link":"/category/on-sale","image":"https://static.vecteezy.com/system/resources/previews/072/114/380/non_2x/colorful-men-s-shirts-hanging-on-wooden-hangers-in-a-wardrobe-free-photo.jpeg"}
]'::jsonb),
('promo_banner', '{"eyebrow":"โปรโมชั่นพิเศษ","title":"ส่วนลด 15% สำหรับนักเรียนใหม่","subtitle":"ใส่โค้ด NEWSTUDENT ตอนชำระเงิน มีขั้นต่ำ ฿400","code":"NEWSTUDENT","minOrder":400,"ctaLabel":"ช้อปเลย","link":"/shop","image":"https://static.vecteezy.com/system/resources/previews/073/349/438/non_2x/elegant-white-dress-shirt-hanging-in-a-modern-minimalist-wardrobe-free-photo.jpg"}'::jsonb),
('category_covers', '{}'::jsonb),
('store_info', '{"phone":"02-123-4567, 081-234-5678","email":"support@jnipxstyle.com","address":"123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110","facebook":"","instagram":"","line":""}'::jsonb)
on conflict (key) do nothing;
