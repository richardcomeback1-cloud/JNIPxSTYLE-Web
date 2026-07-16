import { useEffect, useState } from 'react';
import { Tag, Clock, ArrowRight, Bookmark, BookmarkCheck, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { couponLabel, isCouponValid } from '../lib/coupons';
import type { Product, Coupon } from '../types';
import ProductCard from '../components/ProductCard';
import { navigate } from '../lib/router';

export default function PromotionPage() {
  const { user } = useAuth();
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    (async () => {
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('is_sale', true);
      setSaleProducts((prods as Product[]) || []);
      const { data: cps } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true);
      const validCoupons = ((cps as Coupon[]) || []).filter(isCouponValid);
      setCoupons(validCoupons);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('user_coupons')
        .select('coupon_id')
        .eq('user_id', user.id);
      if (data) setSavedIds(new Set(data.map((r: { coupon_id: string }) => r.coupon_id)));
    })();
  }, [user]);

  const saveCoupon = async (couponId: string) => {
    if (!user) { navigate('/login'); return; }
    if (savedIds.has(couponId)) return;
    const { error } = await supabase
      .from('user_coupons')
      .insert({ user_id: user.id, coupon_id: couponId });
    if (!error) setSavedIds((prev) => new Set(prev).add(couponId));
  };

  useEffect(() => {
    const target = new Date();
    target.setHours(23, 59, 59, 999);
    const timer = setInterval(() => {
      const diff = target.getTime() - Date.now();
      setTimeLeft({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Flash Sale Banner */}
      <div className="relative bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 rounded-3xl p-8 lg:p-12 mb-10 overflow-hidden">
        <div className="relative z-10 text-center text-white">
          <p className="text-sm tracking-[0.3em] uppercase mb-2 opacity-90">Flash Sale</p>
          <h1 className="font-prompt text-3xl lg:text-5xl font-bold mb-4">ลดราคาสูงสุด 50%</h1>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-5 h-5" />
            <span className="text-lg">สิ้นสุดใน</span>
            <div className="flex gap-2">
              {[
                { label: 'ชม.', value: timeLeft.hours },
                { label: 'นาที', value: timeLeft.minutes },
                { label: 'วิ', value: timeLeft.seconds },
              ].map((t, i) => (
                <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 min-w-[3rem]">
                  <p className="font-prompt text-xl font-bold">{String(t.value).padStart(2, '0')}</p>
                  <p className="text-[10px] opacity-80">{t.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Coupons */}
      {coupons.length > 0 && (
        <div className="mb-10">
          <h2 className="font-prompt text-2xl font-bold text-taupe-600 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-rose-500" /> โค้ดส่วนลด
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl p-5 border-2 border-dashed border-rose-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                    {c.type === 'shipping' ? <Truck className="w-5 h-5 text-rose-500" /> : <Tag className="w-5 h-5 text-rose-500" />}
                  </div>
                  <button
                    onClick={() => saveCoupon(c.id)}
                    disabled={savedIds.has(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      savedIds.has(c.id)
                        ? 'bg-green-50 text-green-600 cursor-default'
                        : 'bg-rose-50 text-rose-500 hover:bg-rose-100'
                    }`}
                  >
                    {savedIds.has(c.id) ? <><BookmarkCheck className="w-3.5 h-3.5" /> บันทึกแล้ว</> : <><Bookmark className="w-3.5 h-3.5" /> เก็บโค้ด</>}
                  </button>
                </div>
                <p className="font-prompt text-xl font-bold text-rose-500 mb-1">{couponLabel(c)}</p>
                <p className="text-xs text-taupe-400 mb-2">ขั้นต่ำ ฿{c.min_order}</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm font-bold text-taupe-600 bg-cream px-3 py-1.5 rounded-lg">{c.code}</p>
                  {c.valid_until && (
                    <span className="text-xs text-taupe-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(c.valid_until).toLocaleDateString('th-TH')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sale Products */}
      <div>
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-prompt text-2xl font-bold text-taupe-600">สินค้าลดราคา</h2>
          <button onClick={() => navigate('/category/on-sale')} className="text-sm text-taupe-400 hover:text-rose-500 flex items-center gap-1">
            ดูทั้งหมด <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-rose-100">
                <div className="aspect-[3/4] skeleton" />
                <div className="p-4 space-y-2">
                  <div className="h-3 skeleton rounded" />
                  <div className="h-5 w-1/3 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : saleProducts.length === 0 ? (
          <p className="text-taupe-400 text-center py-12">ยังไม่มีสินค้าลดราคาในขณะนี้</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {saleProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
