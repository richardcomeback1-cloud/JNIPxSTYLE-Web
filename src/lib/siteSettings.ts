import { supabase } from './supabase';

export interface HeroSlide {
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
}

export interface PromoBanner {
  eyebrow: string;
  title: string;
  subtitle: string;
  code: string;
  minOrder: number;
  ctaLabel: string;
  link: string;
  image: string;
}

export type CategoryCovers = Record<string, string>;

export interface StoreInfo {
  phone: string;
  email: string;
  address: string;
  facebook: string;
  instagram: string;
  line: string;
}

// ค่า default เผื่อยังไม่เคยตั้งค่าใน DB (แถวหายไป / โปรเจกต์เก่ายังไม่รัน migration)
// ให้ตรงกับของเดิมที่เคย hardcode ไว้ใน HomePage/Footer เพื่อไม่ให้หน้าเว็บเปลี่ยนพฤติกรรมกะทันหัน
export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    title: 'แต่งเต็มทุกช่วงวัยการเรียน',
    subtitle: 'ชุดนักเรียน-นักศึกษาคุณภาพดี ในราคาที่คุณสัมผัสได้',
    cta: 'ช้อปเลย',
    link: '/shop',
    image:
      'https://static.vecteezy.com/system/resources/previews/073/752/744/large_2x/white-dress-shirt-hanging-on-wooden-hanger-against-plain-background-free-photo.jpg',
  },
  {
    title: 'DEFINE YOUR STYLE',
    subtitle: 'สินค้ามาใหม่ คอลเลกชั่นปีการศึกษาใหม่ พร้อมส่วนลดพิเศษ',
    cta: 'ดูสินค้ามาใหม่',
    link: '/shop?filter=new',
    image:
      'https://static.vecteezy.com/system/resources/previews/073/349/438/non_2x/elegant-white-dress-shirt-hanging-in-a-modern-minimalist-wardrobe-free-photo.jpg',
  },
  {
    title: 'SALE สิ้นฤดูู',
    subtitle: 'ลดราคาสูงสุด 50% สินค้าคุณภาพ หมดปัญหาเรื่องชุด',
    cta: 'ช้อปสินค้าลดราคา',
    link: '/category/on-sale',
    image:
      'https://static.vecteezy.com/system/resources/previews/072/114/380/non_2x/colorful-men-s-shirts-hanging-on-wooden-hangers-in-a-wardrobe-free-photo.jpeg',
  },
];

export const DEFAULT_PROMO_BANNER: PromoBanner = {
  eyebrow: 'โปรโมชั่นพิเศษ',
  title: 'ส่วนลด 15% สำหรับนักเรียนใหม่',
  subtitle: 'ใส่โค้ด NEWSTUDENT ตอนชำระเงิน มีขั้นต่ำ ฿400',
  code: 'NEWSTUDENT',
  minOrder: 400,
  ctaLabel: 'ช้อปเลย',
  link: '/shop',
  image:
    'https://static.vecteezy.com/system/resources/previews/073/349/438/non_2x/elegant-white-dress-shirt-hanging-in-a-modern-minimalist-wardrobe-free-photo.jpg',
};

export const DEFAULT_STORE_INFO: StoreInfo = {
  phone: '02-123-4567, 081-234-5678',
  email: 'support@jnipxstyle.com',
  address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
  facebook: '',
  instagram: '',
  line: '',
};

export async function fetchSiteSettings() {
  const { data } = await supabase.from('site_settings').select('key, value');
  const map = new Map((data || []).map((row) => [row.key, row.value]));
  return {
    heroSlides: (map.get('hero_slides') as HeroSlide[] | undefined) || DEFAULT_HERO_SLIDES,
    promoBanner: (map.get('promo_banner') as PromoBanner | undefined) || DEFAULT_PROMO_BANNER,
    categoryCovers: (map.get('category_covers') as CategoryCovers | undefined) || {},
    storeInfo: (map.get('store_info') as StoreInfo | undefined) || DEFAULT_STORE_INFO,
  };
}

export async function saveSiteSetting(key: string, value: unknown) {
  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  return error;
}
