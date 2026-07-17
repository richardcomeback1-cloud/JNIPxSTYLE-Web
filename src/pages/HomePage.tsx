import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Truck, ShieldCheck, RefreshCw, Lock, Star, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { navigate } from '../lib/router';
import { SHORTCUT_CATEGORIES } from '../lib/categories';
import OptimizedImage from '../components/OptimizedImage';
import CategoryShowcaseCard from '../components/CategoryShowcaseCard';
import { fetchSiteSettings, DEFAULT_HERO_SLIDES, DEFAULT_PROMO_BANNER, type HeroSlide, type PromoBanner } from '../lib/siteSettings';

const trustItems = [
  { icon: Truck, title: 'จัดส่งฟรี', desc: 'สั่งซื้อ ฿500 ขึ้นไป' },
  { icon: ShieldCheck, title: 'รับประกันคุณภาพ', desc: 'ของแท้ 100%' },
  { icon: RefreshCw, title: 'เปลี่ยน/คืนได้', desc: 'ภายใน 3 วัน' },
  { icon: Lock, title: 'ชำระเงินปลอดภัย', desc: 'หลายช่องทาง' },
];

const testimonials = [
  { name: 'น้องเฟิร์น ม.5', text: 'ชุดนักเรียนคุณภาพดีมาก ใส่สบาย ไม่ยับ ราคาเบาๆ กระเป๋านักเรียน', rating: 5 },
  { name: 'พี่เบนซ์ ปี1', text: 'ชุดนักศึกษาสวยมาก ได้ของเร็ว บริการดี แนะนำเลยครับ', rating: 5 },
  { name: 'คุณแม่ม.ลูก', text: 'ซื้อให้ลูก 2 ชุด คุณภาพดีกว่าร้านใกล้บ้าน ราคาถูกกว่าด้วย', rating: 5 },
  { name: 'น้องกิ๊ฟ ปี3', text: 'ช้อปหลายรอบแล้ว สินค้าดี จัดส่งเร็ว ป้ายชื่อปักสวยมาก', rating: 5 },
];

export default function HomePage() {
  const [slide, setSlide] = useState(0);
  // เก็บว่า slide ไหนเคยถูกเลื่อนไปดูแล้วบ้าง — โหลดรูปแค่ slide ที่เคยเห็นจริง ๆ
  // แทนที่จะโหลดรูปใหญ่ทั้ง 3 รูปพร้อมกันตั้งแต่เปิดหน้าแรก
  const [viewedSlides, setViewedSlides] = useState<Set<number>>(() => new Set([0]));
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryImages, setCategoryImages] = useState<Record<string, string[]>>({});
  const [categoryCovers, setCategoryCovers] = useState<Record<string, string>>({});
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [promoBanner, setPromoBanner] = useState<PromoBanner>(DEFAULT_PROMO_BANNER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setViewedSlides((prev) => (prev.has(slide) ? prev : new Set(prev).add(slide)));
  }, [slide]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide((s) => (s + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    (async () => {
      const [best, latest, sale, cats, catProducts, settings] = await Promise.all([
        supabase.from('products').select('*').order('sold_count', { ascending: false }).limit(8),
        supabase.from('products').select('*').eq('is_new', true).order('created_at', { ascending: false }).limit(8),
        supabase.from('products').select('*').eq('is_sale', true).limit(4),
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('products').select('category_id, images').order('created_at', { ascending: false }).limit(120),
        fetchSiteSettings(),
      ]);
      setBestSellers((best.data as Product[]) || []);
      setNewArrivals((latest.data as Product[]) || []);
      setSaleProducts((sale.data as Product[]) || []);
      setCategories((cats.data as Category[]) || []);
      setHeroSlides(settings.heroSlides);
      setPromoBanner(settings.promoBanner);
      setCategoryCovers(settings.categoryCovers);

      // จัดกลุ่มรูปสินค้าจริงตามหมวดหมู่หลัก (category_id) เอาไว้เลื่อนโชว์ในการ์ดหมวดหมู่
      const imagesByCategory: Record<string, string[]> = {};
      ((catProducts.data as Pick<Product, 'category_id' | 'images'>[]) || []).forEach((p) => {
        if (!p.category_id) return;
        const firstImage = p.images?.[0];
        if (!firstImage) return;
        const list = imagesByCategory[p.category_id] || (imagesByCategory[p.category_id] = []);
        if (list.length < 6) list.push(firstImage);
      });
      setCategoryImages(imagesByCategory);

      setLoading(false);
    })();
  }, []);

  const categoryIcons: Record<string, string> = {
    'female-uniform': 'https://images.pexels.com/photos/8617715/pexels-photo-8617715.jpeg',
    'university-uniform-boy': 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg',
    'unisex': 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg',
    'graduation-formal': 'https://images.pexels.com/photos/1438072/pexels-photo-1438072.jpeg',
  };

  return (
    <div className="animate-fade-in">
      {/* Preload เฉพาะ hero image แรกเท่านั้น รูปที่เหลือโหลดตอนเลื่อนไปดูจริง */}
      <link rel="preload" as="image" href={heroSlides[0].image} fetchpriority="high" />
      <link rel="prefetch" as="image" href={heroSlides[1].image} />
      {/* Hero Slider */}
      <section className="relative h-[500px] sm:h-[600px] lg:h-[680px] overflow-hidden gpu">
        {heroSlides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === slide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cream via-cream/90 to-cream/40 z-10" />
            {viewedSlides.has(i) && (
              <OptimizedImage src={s.image} alt={s.title} priority={i === 0} loading={i === 0 ? 'eager' : 'lazy'} width={1600} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 z-20 flex items-center">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="max-w-xl">
                  <h1 className="font-prompt text-4xl sm:text-5xl lg:text-6xl font-bold text-taupe-600 mb-4 leading-tight animate-fade-up">
                    {s.title}
                  </h1>
                  <p className="text-lg text-taupe-400 mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    {s.subtitle}
                  </p>
                  <button
                    onClick={() => navigate(s.link)}
                    className="group inline-flex items-center gap-2 px-8 py-3.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-all hover:shadow-lg animate-fade-up"
                    style={{ animationDelay: '0.2s' }}
                  >
                    {s.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Controls */}
        <button
          onClick={() => setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-taupe-500 hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setSlide((s) => (s + 1) % heroSlides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center text-taupe-500 hover:bg-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`h-2 rounded-full transition-all ${i === slide ? 'w-8 bg-rose-500' : 'w-2 bg-taupe-300'}`}
            />
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white border-y border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trustItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-taupe-500">{item.title}</p>
                  <p className="text-xs text-taupe-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">Shop by Category</p>
          <h2 className="font-prompt text-3xl lg:text-4xl font-bold text-taupe-600">เลือกซื้อตามหมวดหมู่</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories
            .filter((c) => c.parent_id === null && !SHORTCUT_CATEGORIES.some((sc) => sc.slug === c.slug))
            .map((cat, idx) => (
              <CategoryShowcaseCard
                key={cat.id}
                category={cat}
                images={categoryCovers[cat.slug] ? [categoryCovers[cat.slug]] : categoryImages[cat.id] || []}
                fallbackImage={
                  categoryIcons[cat.slug] || cat.image_url || 'https://images.pexels.com/photos/8617715/pexels-photo-8617715.jpeg'
                }
                intervalOffset={idx * 450}
                onClick={() => navigate(`/category/${cat.slug}`)}
              />
            ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 cv-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">Best Sellers</p>
            <h2 className="font-prompt text-3xl lg:text-4xl font-bold text-taupe-600">สินค้าขายดี</h2>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="text-sm text-taupe-400 hover:text-rose-500 transition-colors flex items-center gap-1"
          >
            ดูทั้งหมด <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-rose-100">
                <div className="aspect-[3/4] skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-3 skeleton rounded" />
                  <div className="h-3 w-2/3 skeleton rounded" />
                  <div className="h-5 w-1/3 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Promo Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 cv-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-rose-200 via-accent to-rose-100 p-8 lg:p-16">
          <div className="relative z-10 max-w-lg">
            <p className="text-rose-600 text-sm tracking-[0.3em] uppercase mb-3">{promoBanner.eyebrow}</p>
            <h2 className="font-prompt text-3xl lg:text-5xl font-bold text-taupe-600 mb-4">
              {promoBanner.title}
            </h2>
            <p className="text-taupe-400 mb-6 text-lg">
              ใส่โค้ด <span className="font-bold text-rose-500 bg-white/50 px-2 py-0.5 rounded">{promoBanner.code}</span> ตอนชำระเงิน มีขั้นต่ำ ฿{promoBanner.minOrder.toLocaleString()}
            </p>
            <button
              onClick={() => navigate(promoBanner.link)}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-taupe-500 text-white rounded-full font-medium hover:bg-taupe-600 transition-all hover:shadow-lg"
            >
              {promoBanner.ctaLabel} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 hidden lg:block">
            <OptimizedImage src={promoBanner.image} alt="" width={900} className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 cv-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">New Arrivals</p>
            <h2 className="font-prompt text-3xl lg:text-4xl font-bold text-taupe-600">สินค้ามาใหม่</h2>
          </div>
          <button
            onClick={() => navigate('/category/new-arrivals')}
            className="text-sm text-taupe-400 hover:text-rose-500 transition-colors flex items-center gap-1"
          >
            ดูทั้งหมด <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {newArrivals.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Sale Section */}
      {saleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 cv-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">On Sale</p>
              <h2 className="font-prompt text-3xl lg:text-4xl font-bold text-taupe-600">สินค้าลดราคา</h2>
            </div>
            <button
              onClick={() => navigate('/category/on-sale')}
              className="text-sm text-taupe-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              ดูทั้งหมด <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {saleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="bg-white border-y border-rose-100 py-16 mt-8 cv-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-rose-500 text-sm tracking-[0.3em] uppercase mb-2">Testimonials</p>
            <h2 className="font-prompt text-3xl lg:text-4xl font-bold text-taupe-600">รีวิวจากลูกค้า</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-cream rounded-2xl p-6 border border-rose-100">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-rose-400 text-rose-400" />
                  ))}
                </div>
                <p className="text-sm text-taupe-500 leading-relaxed mb-4 italic">"{t.text}"</p>
                <p className="text-sm font-medium text-taupe-600">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
