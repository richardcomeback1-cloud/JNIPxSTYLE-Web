import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Upload, Save, RotateCcw, ImageIcon } from 'lucide-react';
import {
  fetchSiteSettings,
  saveSiteSetting,
  DEFAULT_HERO_SLIDES,
  DEFAULT_PROMO_BANNER,
  type HeroSlide,
  type PromoBanner,
  type CategoryCovers,
} from '../../lib/siteSettings';
import { uploadSiteImage } from '../../lib/imageUpload';
import { useToast } from '../../context/ToastContext';
import type { Category } from '../../types';
import OptimizedImage from '../OptimizedImage';

interface Props {
  categories: Category[];
}

export default function AdminHomepage({ categories }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [promoBanner, setPromoBanner] = useState<PromoBanner>(DEFAULT_PROMO_BANNER);
  const [categoryCovers, setCategoryCovers] = useState<CategoryCovers>({});
  const [savingHero, setSavingHero] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);
  const [uploadingSlide, setUploadingSlide] = useState<number | null>(null);
  const [uploadingPromo, setUploadingPromo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState<string | null>(null);

  const rootCategories = categories.filter((c) => !c.parent_id);

  useEffect(() => {
    (async () => {
      const s = await fetchSiteSettings();
      setHeroSlides(s.heroSlides);
      setPromoBanner(s.promoBanner);
      setCategoryCovers(s.categoryCovers);
      setLoading(false);
    })();
  }, []);

  const updateSlide = (i: number, patch: Partial<HeroSlide>) => {
    setHeroSlides((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };

  const moveSlide = (i: number, dir: -1 | 1) => {
    setHeroSlides((prev) => {
      const next = [...prev];
      const target = i + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  };

  const removeSlide = (i: number) => {
    if (heroSlides.length <= 1) {
      showToast('ต้องมีอย่างน้อย 1 สไลด์', 'error');
      return;
    }
    setHeroSlides((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addSlide = () => {
    setHeroSlides((prev) => [
      ...prev,
      { title: 'หัวข้อใหม่', subtitle: 'คำอธิบายสั้นๆ', cta: 'ช้อปเลย', link: '/shop', image: '' },
    ]);
  };

  const handleSlideImageUpload = async (i: number, file: File) => {
    setUploadingSlide(i);
    const url = await uploadSiteImage(file, 'site/hero');
    if (url) {
      updateSlide(i, { image: url });
    } else {
      showToast('อัปโหลดรูปไม่สำเร็จ', 'error');
    }
    setUploadingSlide(null);
  };

  const saveHero = async () => {
    setSavingHero(true);
    const error = await saveSiteSetting('hero_slides', heroSlides);
    setSavingHero(false);
    if (error) showToast('บันทึกสไลด์ไม่สำเร็จ: ' + error.message, 'error');
    else showToast('บันทึกสไลด์หน้าแรกเรียบร้อย');
  };

  const handlePromoImageUpload = async (file: File) => {
    setUploadingPromo(true);
    const url = await uploadSiteImage(file, 'site/promo');
    if (url) setPromoBanner((p) => ({ ...p, image: url }));
    else showToast('อัปโหลดรูปไม่สำเร็จ', 'error');
    setUploadingPromo(false);
  };

  const savePromo = async () => {
    setSavingPromo(true);
    const error = await saveSiteSetting('promo_banner', promoBanner);
    setSavingPromo(false);
    if (error) showToast('บันทึกแบนเนอร์ไม่สำเร็จ: ' + error.message, 'error');
    else showToast('บันทึกแบนเนอร์โปรโมชั่นเรียบร้อย');
  };

  const handleCoverUpload = async (slug: string, file: File) => {
    setUploadingCover(slug);
    const url = await uploadSiteImage(file, 'site/category');
    if (url) {
      const next = { ...categoryCovers, [slug]: url };
      setCategoryCovers(next);
      const error = await saveSiteSetting('category_covers', next);
      if (error) showToast('บันทึกรูปหมวดหมู่ไม่สำเร็จ: ' + error.message, 'error');
      else showToast('อัปเดตรูปหมวดหมู่เรียบร้อย');
    } else {
      showToast('อัปโหลดรูปไม่สำเร็จ', 'error');
    }
    setUploadingCover(null);
  };

  const resetCover = async (slug: string) => {
    const next = { ...categoryCovers };
    delete next[slug];
    setCategoryCovers(next);
    const error = await saveSiteSetting('category_covers', next);
    if (error) showToast('รีเซ็ตไม่สำเร็จ: ' + error.message, 'error');
    else showToast('รีเซ็ตกลับไปใช้รูปสินค้าอัตโนมัติแล้ว');
  };

  if (loading) {
    return <div className="text-center text-taupe-400 py-20">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-prompt text-2xl font-bold text-taupe-600">จัดการหน้าแรก</h1>
        <p className="text-sm text-taupe-400 mt-1">แก้ไขรูปภาพและข้อความบนหน้าแรกได้เอง ไม่ต้องแก้โค้ด</p>
      </div>

      {/* Hero slides */}
      <section className="bg-white rounded-2xl border border-rose-100 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-prompt text-lg font-bold text-taupe-600">สไลด์หลัก (Hero)</h2>
            <p className="text-xs text-taupe-400 mt-0.5">รูปใหญ่บนสุดของหน้าแรก เลื่อนสไลด์อัตโนมัติ</p>
          </div>
          <button
            onClick={saveHero}
            disabled={savingHero}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {savingHero ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>

        <div className="space-y-4">
          {heroSlides.map((slide, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-rose-50 bg-cream/40">
              <SlideImagePicker
                image={slide.image}
                uploading={uploadingSlide === i}
                onUpload={(file) => handleSlideImageUpload(i, file)}
              />
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <Field label="หัวข้อ" value={slide.title} onChange={(v) => updateSlide(i, { title: v })} />
                <Field label="ปุ่ม (ข้อความ)" value={slide.cta} onChange={(v) => updateSlide(i, { cta: v })} />
                <Field
                  label="คำอธิบาย"
                  value={slide.subtitle}
                  onChange={(v) => updateSlide(i, { subtitle: v })}
                  className="sm:col-span-2"
                />
                <Field label="ลิงก์ปุ่ม" value={slide.link} onChange={(v) => updateSlide(i, { link: v })} />
              </div>
              <div className="flex sm:flex-col gap-1.5 justify-end sm:justify-start shrink-0">
                <button
                  onClick={() => moveSlide(i, -1)}
                  disabled={i === 0}
                  className="p-2 rounded-lg text-taupe-400 hover:bg-white hover:text-rose-500 disabled:opacity-30 transition-colors"
                  title="เลื่อนขึ้น"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveSlide(i, 1)}
                  disabled={i === heroSlides.length - 1}
                  className="p-2 rounded-lg text-taupe-400 hover:bg-white hover:text-rose-500 disabled:opacity-30 transition-colors"
                  title="เลื่อนลง"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeSlide(i)}
                  className="p-2 rounded-lg text-taupe-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                  title="ลบสไลด์"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addSlide}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-rose-200 text-taupe-400 hover:border-rose-400 hover:text-rose-500 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> เพิ่มสไลด์
        </button>
      </section>

      {/* Promo banner */}
      <section className="bg-white rounded-2xl border border-rose-100 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-prompt text-lg font-bold text-taupe-600">แบนเนอร์โปรโมชั่น</h2>
            <p className="text-xs text-taupe-400 mt-0.5">แถบโปรโมชั่นกลางหน้าแรก</p>
          </div>
          <button
            onClick={savePromo}
            disabled={savingPromo}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {savingPromo ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <SlideImagePicker image={promoBanner.image} uploading={uploadingPromo} onUpload={handlePromoImageUpload} />
          <div className="flex-1 grid sm:grid-cols-2 gap-3">
            <Field label="ป้ายเล็ก" value={promoBanner.eyebrow} onChange={(v) => setPromoBanner((p) => ({ ...p, eyebrow: v }))} />
            <Field label="ปุ่ม (ข้อความ)" value={promoBanner.ctaLabel} onChange={(v) => setPromoBanner((p) => ({ ...p, ctaLabel: v }))} />
            <Field label="หัวข้อ" value={promoBanner.title} onChange={(v) => setPromoBanner((p) => ({ ...p, title: v }))} className="sm:col-span-2" />
            <Field label="คำอธิบาย" value={promoBanner.subtitle} onChange={(v) => setPromoBanner((p) => ({ ...p, subtitle: v }))} className="sm:col-span-2" />
            <Field label="โค้ดส่วนลด" value={promoBanner.code} onChange={(v) => setPromoBanner((p) => ({ ...p, code: v }))} />
            <Field
              label="ยอดขั้นต่ำ (บาท)"
              value={String(promoBanner.minOrder)}
              onChange={(v) => setPromoBanner((p) => ({ ...p, minOrder: Number(v) || 0 }))}
              type="number"
            />
            <Field label="ลิงก์ปุ่ม" value={promoBanner.link} onChange={(v) => setPromoBanner((p) => ({ ...p, link: v }))} className="sm:col-span-2" />
          </div>
        </div>
      </section>

      {/* Category cover images */}
      <section className="bg-white rounded-2xl border border-rose-100 p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="font-prompt text-lg font-bold text-taupe-600">รูปหมวดหมู่หลัก</h2>
          <p className="text-xs text-taupe-400 mt-0.5">
            ปกติระบบจะสุ่มโชว์รูปสินค้าในหมวดนั้นๆ ให้อัตโนมัติ — อัปโหลดรูปที่นี่เพื่อบังคับใช้รูปที่กำหนดเองแทน
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {rootCategories.map((cat) => (
            <div key={cat.id} className="text-center">
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-cream border border-rose-100 mb-2 group">
                {categoryCovers[cat.slug] ? (
                  <OptimizedImage src={categoryCovers[cat.slug]} alt={cat.name} width={300} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-taupe-300">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <label className="absolute inset-0 bg-taupe-900/0 group-hover:bg-taupe-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                  {uploadingCover === cat.slug ? (
                    <span className="text-white text-xs">กำลังอัปโหลด...</span>
                  ) : (
                    <Upload className="w-5 h-5 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleCoverUpload(cat.slug, e.target.files[0])}
                  />
                </label>
              </div>
              <p className="text-xs font-medium text-taupe-600 line-clamp-1">{cat.name}</p>
              {categoryCovers[cat.slug] && (
                <button
                  onClick={() => resetCover(cat.slug)}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-taupe-400 hover:text-rose-500 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> ใช้รูปอัตโนมัติ
                </button>
              )}
            </div>
          ))}
          {rootCategories.length === 0 && (
            <p className="col-span-full text-sm text-taupe-400 text-center py-6">ยังไม่มีหมวดหมู่หลัก</p>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  className = '',
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  type?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-taupe-400 mb-1 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-rose-100 text-sm text-taupe-600 focus:outline-none focus:ring-2 focus:ring-rose-200"
      />
    </label>
  );
}

function SlideImagePicker({
  image,
  uploading,
  onUpload,
}: {
  image: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative w-full sm:w-40 h-32 sm:h-auto shrink-0 rounded-xl overflow-hidden bg-cream border border-rose-100 group">
      {image ? (
        <OptimizedImage src={image} alt="" width={320} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-taupe-300">
          <ImageIcon className="w-6 h-6" />
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 bg-taupe-900/0 group-hover:bg-taupe-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
      >
        {uploading ? <span className="text-white text-xs">กำลังอัปโหลด...</span> : <Upload className="w-5 h-5 text-white" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
      />
    </div>
  );
}
