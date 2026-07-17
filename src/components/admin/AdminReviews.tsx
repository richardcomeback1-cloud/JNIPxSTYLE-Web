import { useEffect, useState, useMemo } from 'react';
import { Star, Trash2, Search, BadgeCheck, MessageSquareOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import type { ProductReview, Product } from '../../types';

type ReviewRow = ProductReview & { product_name: string | null; product_image: string | null };

export default function AdminReviews({ products }: { products: Product[] }) {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState(0);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('product_reviews').select('*').order('created_at', { ascending: false });
      const rows: ReviewRow[] = ((data as ProductReview[]) || []).map((r) => {
        const p = productMap.get(r.product_id);
        return { ...r, product_name: p?.name || null, product_image: p?.images?.[0] || null };
      });
      setReviews(rows);
      setLoading(false);
    })();
  }, [productMap]);

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q || r.product_name?.toLowerCase().includes(q) || r.comment?.toLowerCase().includes(q) || r.title?.toLowerCase().includes(q);
    const matchesRating = ratingFilter === 0 || r.rating === ratingFilter;
    return matchesSearch && matchesRating;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบรีวิวนี้ใช่หรือไม่?')) return;
    const { error } = await supabase.from('product_reviews').delete().eq('id', id);
    if (error) {
      showToast('ลบไม่สำเร็จ: ' + error.message, 'error');
      return;
    }
    setReviews((prev) => prev.filter((r) => r.id !== id));
    showToast('ลบรีวิวเรียบร้อย');
  };

  if (loading) return <div className="text-center text-taupe-400 py-20">กำลังโหลด...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-prompt text-2xl font-bold text-taupe-600">รีวิวสินค้า</h1>
          <p className="text-sm text-taupe-400 mt-1">{reviews.length} รีวิวทั้งหมด</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-taupe-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาสินค้า/ข้อความรีวิว"
              className="pl-9 pr-3 py-2 rounded-lg border border-rose-100 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-rose-100 text-sm text-taupe-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          >
            <option value={0}>ทุกคะแนน</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} ดาว
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-rose-100 py-20 text-center text-taupe-400">
          <MessageSquareOff className="w-10 h-10 mx-auto mb-3 text-taupe-300" />
          ยังไม่มีรีวิวที่ตรงเงื่อนไข
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-rose-100 p-4 sm:p-5 flex gap-4">
              <div className="w-12 h-14 rounded-lg overflow-hidden bg-cream shrink-0">
                {r.product_image && <img src={r.product_image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-medium text-taupe-600 line-clamp-1">{r.product_name || 'สินค้าถูกลบแล้ว'}</p>
                  {r.is_verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="w-3 h-3" /> ซื้อจริง
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-taupe-200'}`} />
                  ))}
                  <span className="text-xs text-taupe-400 ml-2">{new Date(r.created_at).toLocaleDateString('th-TH')}</span>
                </div>
                {r.title && <p className="text-sm font-medium text-taupe-600">{r.title}</p>}
                {r.comment && <p className="text-sm text-taupe-500 mt-0.5">{r.comment}</p>}
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="p-2 h-fit rounded-lg text-taupe-400 hover:bg-rose-50 hover:text-rose-500 transition-colors shrink-0"
                title="ลบรีวิว"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
