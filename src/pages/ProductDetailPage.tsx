import { useEffect, useState } from 'react';
import { Star, Minus, Plus, ShoppingBag, Zap, Truck, ShieldCheck, RefreshCw, ChevronRight, Ruler, Heart, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, ProductReview } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../lib/router';
import ProductCard from '../components/ProductCard';
import OptimizedImage from '../components/OptimizedImage';

type ParsedSizeChart = { type?: string; headers: string[]; rows: string[][] };

// The `size_chart` column stores either a JSON string like
// {"type":"skirt","headers":[...],"rows":[[...]]}, a plain image URL,
// or a plain text note. This tries JSON first so we can render a real
// table; otherwise the caller falls back to an image or plain text.
function parseSizeChart(raw: string | null | undefined): ParsedSizeChart | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.headers) && Array.isArray(data.rows)) {
      return data as ParsedSizeChart;
    }
  } catch {
    return null;
  }
  return null;
}

function SizeChartTable({ data }: { data: ParsedSizeChart }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-rose-50">
            {data.headers.map((header, i) => (
              <th
                key={i}
                className="border border-rose-100 px-3 py-2 text-taupe-600 font-semibold text-center whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-rose-50/40'}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-rose-100 px-3 py-2 text-taupe-500 text-center whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Renders whatever is stored in `size_chart`: a parsed table when it's
// the structured JSON format, an <img> when it's a URL, plain text
// otherwise, or a fallback message when there's nothing stored.
function SizeChartContent({ sizeChart }: { sizeChart: string | null | undefined }) {
  const data = parseSizeChart(sizeChart);
  if (data) return <SizeChartTable data={data} />;
  if (!sizeChart) return <p className="text-taupe-500">ไม่มีข้อมูลตารางไซส์</p>;
  if (/^https?:\/\//.test(sizeChart.trim())) {
    return <img src={sizeChart} alt="ตารางไซส์" className="max-w-full rounded-lg border border-rose-100" />;
  }
  return <p className="text-taupe-500 whitespace-pre-line">{sizeChart}</p>;
}

export default function ProductDetailPage({ slug }: { slug: string }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'size' | 'care' | 'reviews'>('description');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Guards against a race condition: if `slug` changes before the
    // previous fetch resolves, we must not let the stale response
    // overwrite the state for the newer product.
    let cancelled = false;

    (async () => {
      // Reset all per-product UI state up front so nothing leaks
      // over from whatever product was shown before.
      setLoading(true);
      setFetchError('');
      setProduct(null);
      setRelated([]);
      setReviews([]);
      setActiveImage(0);
      setSelectedSize('');
      setSelectedColor('');
      setQuantity(1);
      setActiveTab('description');
      setError('');
      setLiked(false);

      const { data: prod, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (cancelled) return;

      if (prodError) {
        setFetchError('เกิดข้อผิดพลาดในการโหลดสินค้า กรุณาลองใหม่อีกครั้ง');
        setLoading(false);
        return;
      }

      if (prod) {
        // Normalize array-like fields defensively. Supabase can return
        // null for an empty column, or (depending on how the column was
        // seeded) a JSON string instead of an actual array — either of
        // which would crash any `.map()` call downstream.
        const toArray = (val: unknown): string[] => {
          if (Array.isArray(val)) return val;
          if (typeof val === 'string' && val.trim().length > 0) {
            try {
              const parsed = JSON.parse(val);
              return Array.isArray(parsed) ? parsed : [val];
            } catch {
              return [val];
            }
          }
          return [];
        };

        const p = {
          ...(prod as Product),
          sizes: toArray((prod as Product).sizes),
          colors: toArray((prod as Product).colors),
          images: toArray((prod as Product).images),
        } as Product;

        setProduct(p);
        setSelectedSize(p.sizes[0] || '');
        setSelectedColor(p.colors[0] || '');
        setQuantity(p.stock > 0 ? 1 : 0);

        const [{ data: rel, error: relError }, { data: revs, error: revError }] = await Promise.all([
          supabase.from('products').select('*').eq('category_id', p.category_id).neq('id', p.id).limit(4),
          supabase.from('product_reviews').select('*').eq('product_id', p.id).order('created_at', { ascending: false }),
        ]);

        if (cancelled) return;

        if (!relError) setRelated((rel as Product[]) || []);
        if (!revError) setReviews((revs as ProductReview[]) || []);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const validateSelection = () => {
    if (!product) return false;
    if (product.sizes.length > 0 && !selectedSize) {
      setError('กรุณาเลือกไซส์');
      return false;
    }
    if (product.colors.length > 0 && !selectedColor) {
      setError('กรุณาเลือกสี');
      return false;
    }
    setError('');
    return true;
  };

  const handleAddToCart = () => {
    if (!product || !validateSelection()) return;
    addToCart(product, selectedSize || 'ฟรีไซส์', selectedColor || '-', quantity);
  };

  const handleBuyNow = () => {
    if (!product || !validateSelection()) return;
    addToCart(product, selectedSize || 'ฟรีไซส์', selectedColor || '-', quantity);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 skeleton rounded w-3/4" />
            <div className="h-6 skeleton rounded w-1/3" />
            <div className="h-4 skeleton rounded" />
            <div className="h-4 skeleton rounded" />
            <div className="h-12 skeleton rounded-full w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-rose-500 text-lg">{fetchError}</p>
        <button onClick={() => navigate('/shop')} className="mt-4 px-6 py-2.5 bg-rose-500 text-white rounded-full">
          กลับไปช้อป
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-taupe-400 text-lg">ไม่พบสินค้า</p>
        <button onClick={() => navigate('/shop')} className="mt-4 px-6 py-2.5 bg-rose-500 text-white rounded-full">
          กลับไปช้อป
        </button>
      </div>
    );
  }

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  // Defensive clamp: never index past the end of the images array,
  // even if activeImage somehow ends up stale.
  const safeActiveImage = Math.min(activeImage, Math.max(product.images.length - 1, 0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-taupe-400 mb-6 flex-wrap">
        <button onClick={() => navigate('/')} className="hover:text-rose-500">หน้าแรก</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => navigate('/shop')} className="hover:text-rose-500">สินค้า</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-taupe-500 line-clamp-2">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-rose-100 mb-4 relative group">
            {product.images.length > 0 ? (
              <OptimizedImage
                src={product.images[safeActiveImage]}
                alt={product.name}
                priority
                loading="eager"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-taupe-300 text-sm">
                ไม่มีรูปภาพ
              </div>
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-rose-500 text-white text-sm font-medium px-3 py-1.5 rounded-full">
                -{discount}%
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                    i === safeActiveImage ? 'border-rose-500' : 'border-rose-100 hover:border-rose-300'
                  }`}
                >
                  <OptimizedImage src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.is_new && <span className="bg-taupe-500 text-white text-xs px-2.5 py-1 rounded-full">มาใหม่</span>}
            {product.is_sale && <span className="bg-rose-500 text-white text-xs px-2.5 py-1 rounded-full">ลดราคา</span>}
          </div>
          <h1 className="font-prompt text-2xl lg:text-3xl font-bold text-taupe-600 mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-rose-400 text-rose-400' : 'text-rose-200'}`}
                />
              ))}
            </div>
            <span className="text-sm text-taupe-400">{product.rating.toFixed(1)} ({product.review_count} รีวิว)</span>
            <span className="text-sm text-taupe-300">|</span>
            <span className="text-sm text-taupe-400">ขายแล้ว {product.sold_count} ชิ้น</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-prompt text-3xl font-bold text-rose-500">
              ฿{product.price.toLocaleString()}
            </span>
            {typeof product.compare_at_price === 'number' && product.compare_at_price > 0 && (
              <span className="text-lg text-taupe-300 line-through">
                ฿{product.compare_at_price.toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-taupe-400 text-sm leading-relaxed mb-6">{product.description}</p>

          {/* Size */}
          {product.sizes.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-taupe-600">ไซส์: <span className="text-rose-500">{selectedSize}</span></span>
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="text-xs text-taupe-400 hover:text-rose-500 flex items-center gap-1"
                >
                  <Ruler className="w-3.5 h-3.5" /> ไซส์ไกด์
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`min-w-[3rem] px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSize === s
                        ? 'bg-taupe-500 text-white border-taupe-500'
                        : 'bg-white text-taupe-500 border-rose-200 hover:border-rose-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color */}
          {product.colors.length > 0 && (
            <div className="mb-5">
              <span className="text-sm font-medium text-taupe-600 block mb-2">สี: <span className="text-rose-500">{selectedColor}</span></span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedColor === c
                        ? 'bg-taupe-500 text-white border-taupe-500'
                        : 'bg-white text-taupe-500 border-rose-200 hover:border-rose-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-5">
            <span className="text-sm font-medium text-taupe-600 block mb-2">จำนวน</span>
            <div className="inline-flex items-center gap-1 bg-white border border-rose-200 rounded-full px-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={product.stock === 0}
                className="w-9 h-9 flex items-center justify-center text-taupe-500 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-medium text-taupe-600">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={product.stock === 0}
                className="w-9 h-9 flex items-center justify-center text-taupe-500 hover:text-rose-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {product.stock <= 10 && product.stock > 0 && (
              <p className="text-xs text-rose-500 mt-2">เหลือสินค้าเพียง {product.stock} ชิ้น!</p>
            )}
            {product.stock === 0 && <p className="text-xs text-rose-500 mt-2">สินค้าหมด</p>}
          </div>

          {error && <p className="text-sm text-rose-500 mb-3">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 py-3.5 border-2 border-taupe-500 text-taupe-500 rounded-full font-medium hover:bg-taupe-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingBag className="w-5 h-5" />
              เพิ่มลงตะกร้า
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 py-3.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-5 h-5" />
              ซื้อเลย
            </button>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setLiked(!liked)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-taupe-400 hover:text-rose-500 transition-colors"
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
              {liked ? 'ถูกใจแล้ว' : 'ถูกใจ'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-taupe-400 hover:text-rose-500 transition-colors">
              <Share2 className="w-4 h-4" />
              แชร์
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-white rounded-2xl border border-rose-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
              <span className="text-xs text-taupe-500">รับประกันของแท้ 100%</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-rose-500" />
              <span className="text-xs text-taupe-500">จัดส่งไว 1-3 วัน</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-rose-500" />
              <span className="text-xs text-taupe-500">เปลี่ยน/คืนได้ 3 วัน</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-500" />
              <span className="text-xs text-taupe-500">ชำระเงินปลอดภัย</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex gap-6 border-b border-rose-100 mb-6 overflow-x-auto no-scrollbar">
          {[
            { key: 'description', label: 'รายละเอียดสินค้า' },
            { key: 'size', label: 'ตารางไซส์' },
            { key: 'care', label: 'การดูแลรักษา' },
            { key: 'reviews', label: `รีวิว (${reviews.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'description' | 'size' | 'care' | 'reviews')}
              className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-rose-500 text-rose-500'
                  : 'border-transparent text-taupe-400 hover:text-taupe-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-rose-100">
          {activeTab === 'description' && (
            <p className="text-taupe-500 leading-relaxed whitespace-pre-line">{product.description}</p>
          )}
          {activeTab === 'size' && (
            <div>
              <h3 className="font-prompt text-lg font-bold text-taupe-600 mb-3">ตารางไซส์</h3>
              <SizeChartContent sizeChart={product.size_chart} />
            </div>
          )}
          {activeTab === 'care' && (
            <div>
              <h3 className="font-prompt text-lg font-bold text-taupe-600 mb-3">วิธีดูแลรักษา</h3>
              <p className="text-taupe-500 whitespace-pre-line">{product.care_instructions || 'ซักด้วยน้ำเย็น ตากในร่มเงา'}</p>
            </div>
          )}
          {activeTab === 'reviews' && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-taupe-400 mb-2">ยังไม่มีรีวิวสำหรับสินค้านี้</p>
                  {user && <p className="text-sm text-taupe-300">เป็นคนแรกที่รีวิวสินค้านี้!</p>}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-rose-100 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-rose-400 text-rose-400' : 'text-rose-200'}`} />
                          ))}
                        </div>
                        {r.is_verified_purchase && (
                          <span className="text-xs bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full">ซื้อสินค้าแล้ว</span>
                        )}
                        <span className="text-xs text-taupe-300 ml-auto">
                          {new Date(r.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      {r.title && <p className="font-medium text-taupe-600 mb-1">{r.title}</p>}
                      <p className="text-taupe-500 text-sm">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-prompt text-2xl font-bold text-taupe-600 mb-6">สินค้าที่เกี่ยวข้อง</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-taupe-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSizeGuide(false)}>
          <div className="bg-cream rounded-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-prompt text-xl font-bold text-taupe-600 mb-4">ไซส์ไกด์</h3>
            <div className="mb-4">
              <SizeChartContent sizeChart={product.size_chart} />
            </div>
            <button onClick={() => setShowSizeGuide(false)} className="w-full py-3 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors">
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
