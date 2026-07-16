import { useEffect, useState, useMemo, useCallback } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronRight, Search, XCircle, Star, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { navigate } from '../lib/router';
import {
  CATEGORIES,
  SHORTCUT_CATEGORIES,
  getCategoryMeta,
  isShortcutSlug,
  getFiltersForCategory,
  type FilterGroup,
} from '../lib/categories';

interface Props {
  categorySlug?: string;
  subCategory?: string;
  searchQuery?: string;
  filter?: string;
}

const toArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val.map((v) => String(v).trim()).filter(Boolean);
  if (typeof val === 'string') {
    let current: unknown = val.trim();
    if (current === '') return [];
    for (let i = 0; i < 2; i++) {
      if (typeof current !== 'string') break;
      try { current = JSON.parse(current); } catch { break; }
    }
    if (Array.isArray(current)) return current.map((v) => String(v).trim()).filter(Boolean);
    if (typeof current === 'string' && current.trim() !== '') {
      return current.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    }
  }
  return [];
};

const SORT_OPTIONS = [
  { value: 'popular', label: 'ความนิยม' },
  { value: 'newest', label: 'มาใหม่' },
  { value: 'price-low', label: 'ราคาต่ำ-สูง' },
  { value: 'price-high', label: 'ราคาสูง-ต่ำ' },
  { value: 'rating', label: 'คะแนนรีวิว' },
  { value: 'best-selling', label: 'ขายดี' },
];

export default function ShopPage({ categorySlug, subCategory, searchQuery, filter }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  void categories; // สำหรับ DB-driven sidebar ในอนาคต — การ filter ประเภทย่อยด้านล่าง query DB ตรง ๆ ไม่ได้ใช้ state นี้
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [stockStatus, setStockStatus] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 12;

  const meta = categorySlug ? getCategoryMeta(categorySlug) : undefined;
  const isShortcut = categorySlug ? isShortcutSlug(categorySlug) : false;
  const activeSubCat = subCategory || undefined;

  // Filter groups for the current category + sub-category
  const filterGroups = useMemo(
    () => (categorySlug ? getFiltersForCategory(categorySlug, activeSubCat) : []),
    [categorySlug, activeSubCat]
  );

  // Fetch categories ครั้งเดียวตอน mount — ข้อมูลไม่เปลี่ยนระหว่าง session
  useEffect(() => {
    (async () => {
      const { data: cats } = await supabase.from('categories').select('*').order('sort_order');
      setCategories((cats as Category[]) || []);
    })();
  }, []);

  // Reset all filters when category/sub changes
  useEffect(() => {
    setActiveFilters({});
    setPriceRange([0, 3000]);
    setStockStatus('all');
    setMinRating(0);
    setSortBy('popular');
    setPage(1);
  }, [categorySlug, subCategory]);

  // Fetch products
  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from('products').select('*');

      if (categorySlug && !isShortcut) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .maybeSingle();

        if (cat) {
          // ถ้ามีการเลือกประเภทย่อย (chip "ประเภท") ให้หาหมวดย่อยที่ชื่อตรงกัน
          // ภายใต้หมวดหลักนี้ก่อน แล้ว query เฉพาะสินค้าที่ถูกผูกกับประเภทย่อยนั้น
          // (สินค้าจะมีประเภทย่อยได้ก็ต่อเมื่อแอดมินเลือก "ประเภท" ไว้ตอนสร้าง/แก้ไขสินค้า
          // ถ้าไม่มีหมวดย่อยที่ชื่อตรงกัน หรือไม่ได้เลือกประเภทย่อย ให้ query ทั้งหมวดหลักตามเดิม)
          let categoryIdToFilter = cat.id;
          if (subCategory) {
            const { data: subCat } = await supabase
              .from('categories')
              .select('id')
              .eq('parent_id', cat.id)
              .eq('name', subCategory)
              .maybeSingle();
            if (subCat) categoryIdToFilter = subCat.id;
          }
          query = query.eq('category_id', categoryIdToFilter);
        }
      } else if (categorySlug === 'new-arrivals') {
        query = query.eq('is_new', true);
      } else if (categorySlug === 'on-sale') {
        query = query.eq('is_sale', true);
      } else if (categorySlug === 'best-sellers') {
        query = query.gte('sold_count', 50).order('sold_count', { ascending: false });
      }

      if (searchQuery) query = query.ilike('name', `%${searchQuery}%`);
      if (filter === 'new') query = query.eq('is_new', true);

      const { data } = await query.order('created_at', { ascending: false });

      const normalized = ((data as Product[]) || []).map((p) => ({
        ...p,
        sizes: toArray(p.sizes),
        colors: toArray(p.colors),
      }));

      setProducts(normalized);
      setLoading(false);
      setPage(1);
    })();
  }, [categorySlug, subCategory, searchQuery, filter, isShortcut]);

  const toggleFilter = (groupKey: string, value: string) => {
    setActiveFilters((prev) => {
      const current = prev[groupKey] || [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [groupKey]: next };
    });
    setPage(1);
  };

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    setPriceRange([0, 3000]);
    setStockStatus('all');
    setMinRating(0);
    setPage(1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.values(activeFilters).forEach((arr) => (count += arr.length));
    if (stockStatus !== 'all') count++;
    if (minRating > 0) count++;
    if (priceRange[0] > 0 || priceRange[1] < 3000) count++;
    return count;
  }, [activeFilters, stockStatus, minRating, priceRange]);

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      // price range
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      // stock status
      if (stockStatus === 'in_stock' && p.stock <= 0) return false;
      if (stockStatus === 'preorder' && p.stock > 0) return false;
      // rating
      if (minRating > 0 && Number(p.rating) < minRating) return false;
      // category-specific filters — check against sizes array (for size filters) or product name/description
      for (const [groupKey, selectedValues] of Object.entries(activeFilters)) {
        if (selectedValues.length === 0) continue;
        // Size filters: check against product.sizes array
        if (groupKey.includes('size')) {
          if (!p.sizes.some((s) => selectedValues.includes(s))) return false;
          continue;
        }
        // Color filter: check against product.colors array
        if (groupKey === 'color') {
          if (!p.colors.some((c) => selectedValues.includes(c))) return false;
          continue;
        }
        // Other attribute filters: check against product name + description
        const searchText = `${p.name} ${p.description || ''}`.toLowerCase();
        const matched = selectedValues.some((v) => searchText.includes(v.toLowerCase()));
        if (!matched) return false;
      }
      return true;
    });

    switch (sortBy) {
      case 'price-low': result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price-high': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'newest': result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'rating': result = [...result].sort((a, b) => b.rating - a.rating); break;
      case 'best-selling': result = [...result].sort((a, b) => b.sold_count - a.sold_count); break;
      default: result = [...result].sort((a, b) => b.sold_count - a.sold_count);
    }
    return result;
  }, [products, activeFilters, priceRange, stockStatus, minRating, sortBy]);

  const paged = filtered.slice(0, page * perPage);
  const hasMore = filtered.length > paged.length;

  const renderFilterGroup = (group: FilterGroup) => {
    if (group.type === 'range') {
      return (
        <div key={group.key} className="space-y-3">
          <h3 className="font-prompt text-sm font-bold text-taupe-600">{group.label}</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) => { setPriceRange([Number(e.target.value), priceRange[1]]); setPage(1); }}
              className="w-20 px-2 py-1.5 text-sm border border-rose-200 rounded-lg bg-white text-taupe-500 focus:outline-none focus:border-rose-400"
            />
            <span className="text-taupe-400">—</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value)]); setPage(1); }}
              className="w-20 px-2 py-1.5 text-sm border border-rose-200 rounded-lg bg-white text-taupe-500 focus:outline-none focus:border-rose-400"
            />
            <span className="text-sm text-taupe-400">฿</span>
          </div>
          <input
            type="range"
            min={group.range?.[0] ?? 0}
            max={group.range?.[1] ?? 3000}
            value={priceRange[1]}
            onChange={(e) => { setPriceRange([priceRange[0], Number(e.target.value)]); setPage(1); }}
            className="w-full accent-rose-500"
          />
        </div>
      );
    }

    if (group.type === 'radio') {
      if (group.key === 'stock_status') {
        return (
          <div key={group.key} className="space-y-2">
            <h3 className="font-prompt text-sm font-bold text-taupe-600">{group.label}</h3>
            {group.options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="stock_status"
                  checked={stockStatus === opt.value}
                  onChange={() => { setStockStatus(opt.value); setPage(1); }}
                  className="w-4 h-4 accent-rose-500"
                />
                <span className="text-sm text-taupe-500">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      }
      if (group.key === 'rating') {
        return (
          <div key={group.key} className="space-y-2">
            <h3 className="font-prompt text-sm font-bold text-taupe-600">{group.label}</h3>
            {group.options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={String(minRating) === opt.value}
                  onChange={() => { setMinRating(Number(opt.value)); setPage(1); }}
                  className="w-4 h-4 accent-rose-500"
                />
                <span className="text-sm text-taupe-500 flex items-center gap-1">
                  {opt.value !== '0' && <Star className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />}
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        );
      }
    }

    if (group.type === 'chip') {
      return (
        <div key={group.key} className="space-y-2">
          <h3 className="font-prompt text-sm font-bold text-taupe-600">{group.label}</h3>
          <div className="flex flex-wrap gap-1.5">
            {group.options.map((opt) => {
              const selected = (activeFilters[group.key] || []).includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleFilter(group.key, opt.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selected
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-white text-taupe-500 border-rose-200 hover:border-rose-400'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // checkbox (default)
    return (
      <div key={group.key} className="space-y-2">
        <h3 className="font-prompt text-sm font-bold text-taupe-600">{group.label}</h3>
        <div className="space-y-1.5">
          {group.options.map((opt) => {
            const selected = (activeFilters[group.key] || []).includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selected ? 'bg-rose-500 border-rose-500' : 'border-rose-200 group-hover:border-rose-400'}`}>
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleFilter(group.key, opt.value)}
                  className="sr-only"
                />
                <span className="text-sm text-taupe-500">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const FilterContent = () => (
    <div className="space-y-5">
      {/* Category navigation */}
      <div>
        <h3 className="font-prompt text-sm font-bold text-taupe-600 mb-3">หมวดหมู่</h3>
        <div className="space-y-1">
          <button
            onClick={() => navigate('/shop')}
            className={`block w-full text-left text-sm py-1.5 ${!categorySlug ? 'text-rose-500 font-medium' : 'text-taupe-400 hover:text-rose-500'}`}
          >
            สินค้าทั้งหมด
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate(`/category/${c.slug}`)}
              className={`block w-full text-left text-sm py-1.5 ${categorySlug === c.slug && !activeSubCat ? 'text-rose-500 font-medium' : 'text-taupe-400 hover:text-rose-500'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {SHORTCUT_CATEGORIES.map((sc) => (
            <button
              key={sc.slug}
              onClick={() => navigate(`/category/${sc.slug}`)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${categorySlug === sc.slug ? 'bg-rose-500 text-white border-rose-500' : 'text-rose-500 border-rose-200 hover:border-rose-400'}`}
            >
              {sc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-category chips */}
      {meta && meta.subCategories.length > 0 && (
        <div>
          <h3 className="font-prompt text-sm font-bold text-taupe-600 mb-3">ประเภท</h3>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => navigate(`/category/${categorySlug}`)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${!activeSubCat ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-taupe-500 border-rose-200 hover:border-rose-400'}`}
            >
              ทั้งหมด
            </button>
            {meta.subCategories.map((sub) => (
              <button
                key={sub}
                onClick={() => navigate(`/category/${categorySlug}?sub=${encodeURIComponent(sub)}`)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${activeSubCat === sub ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-taupe-500 border-rose-200 hover:border-rose-400'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic filter groups */}
      {filterGroups.map((group) => renderFilterGroup(group))}

      {/* Clear filters button */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full py-2 text-sm text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-full transition-colors flex items-center justify-center gap-1.5"
        >
          <XCircle className="w-4 h-4" />
          ล้างตัวกรองทั้งหมด ({activeFilterCount})
        </button>
      )}
    </div>
  );

  // Breadcrumb
  const breadcrumbItems = [
    { label: 'หน้าแรก', path: '/' },
    { label: 'สินค้าทั้งหมด', path: '/shop' },
  ];
  if (meta && !isShortcut) {
    breadcrumbItems.push({ label: meta.name, path: `/category/${categorySlug}` });
    if (activeSubCat) {
      breadcrumbItems.push({ label: activeSubCat, path: `/category/${categorySlug}?sub=${encodeURIComponent(activeSubCat)}` });
    }
  } else if (meta && isShortcut) {
    breadcrumbItems.push({ label: meta.name, path: `/category/${categorySlug}` });
  }
  if (searchQuery) {
    breadcrumbItems.push({ label: `ค้นหา: ${searchQuery}`, path: '' });
  }

  const pageTitle = searchQuery
    ? `ผลการค้นหา: "${searchQuery}"`
    : meta
    ? activeSubCat
      ? `${meta.name} · ${activeSubCat}`
      : meta.name
    : 'สินค้าทั้งหมด';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs lg:text-sm text-taupe-400 mb-5 flex-wrap">
        {breadcrumbItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <ChevronRight className="w-3 h-3 text-taupe-300" />}
            {item.path ? (
              <button onClick={() => navigate(item.path)} className="hover:text-rose-500 transition-colors">
                {item.label}
              </button>
            ) : (
              <span className="text-taupe-500">{item.label}</span>
            )}
          </div>
        ))}
      </nav>

      {/* Title + result count */}
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="font-prompt text-2xl lg:text-3xl font-bold text-taupe-600">{pageTitle}</h1>
          <p className="text-sm text-taupe-400 mt-1">
            {loading ? 'กำลังโหลด...' : `พบ ${filtered.length} รายการ`}
            {activeFilterCount > 0 && !loading && ` · ${activeFilterCount} ตัวกรอง`}
          </p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar - Desktop (sticky) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            <FilterContent />
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 gap-4">
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-rose-200 rounded-full text-sm text-taupe-500 relative"
            >
              <SlidersHorizontal className="w-4 h-4" />
              ตัวกรอง
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-taupe-400 hidden sm:block">เรียงตาม:</span>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-rose-200 rounded-full text-sm bg-white text-taupe-500 focus:outline-none focus:border-rose-400 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-taupe-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Products Grid */}
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
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-rose-300" />
              </div>
              <p className="text-taupe-400 font-medium mb-1">ไม่พบสินค้าที่ตรงกับตัวกรอง</p>
              <p className="text-sm text-taupe-300 mb-4">ลองปรับตัวกรองหรือล้างตัวกรองแล้วลองใหม่</p>
              <button onClick={clearAllFilters} className="px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors">
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {paged.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {hasMore && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="px-8 py-3 border border-taupe-400 text-taupe-500 rounded-full text-sm font-medium hover:bg-taupe-50 transition-colors"
                  >
                    ดูเพิ่มเติม
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <>
          <div className="fixed inset-0 bg-taupe-900/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowFilters(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-cream z-50 shadow-2xl lg:hidden overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100 sticky top-0 bg-cream z-10">
              <h2 className="font-prompt text-lg font-bold text-taupe-500">ตัวกรอง</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 text-taupe-400 hover:text-rose-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <FilterContent />
            </div>
            <div className="p-5 sticky bottom-0 bg-cream border-t border-rose-100">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-3 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                ดู {filtered.length} รายการ
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
