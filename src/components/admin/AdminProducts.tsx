import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product, Category } from '../../types';
import ProductFormModal from './ProductFormModal';
import OptimizedImage from '../OptimizedImage';

const PAGE_SIZE = 15;

interface Props {
  products: Product[];
  categories: Category[];
  onProductsChange: (products: Product[]) => void;
}

export default function AdminProducts({ products, categories, onProductsChange }: Props) {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q));
  }, [products, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบสินค้านี้ใช่หรือไม่? สินค้าจะหายจากระบบทันที')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
      return;
    }
    onProductsChange(products.filter((p) => p.id !== id));
  };

  const handleSave = async (data: Record<string, unknown>) => {
    if (editingProduct) {
      const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id);
      if (error) { alert('บันทึกไม่สำเร็จ: ' + error.message); return; }
      onProductsChange(products.map((p) => (p.id === editingProduct.id ? { ...p, ...data } as Product : p)));
    } else {
      const { data: newProd, error } = await supabase.from('products').insert(data).select().single();
      if (error) { alert('เพิ่มไม่สำเร็จ: ' + error.message); return; }
      onProductsChange([newProd as Product, ...products]);
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="font-prompt text-lg font-bold text-taupe-600">จัดการสินค้า ({products.length})</h2>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-taupe-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="ค้นหาสินค้า..."
              className="w-full pl-9 pr-4 py-2.5 border border-rose-200 rounded-full bg-white text-sm text-taupe-500 focus:outline-none focus:border-rose-400"
            />
          </div>
          <button
            onClick={() => { setEditingProduct(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> เพิ่มสินค้า
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr className="text-left text-xs text-taupe-400 uppercase tracking-wider">
                <th className="px-4 py-3">สินค้า</th>
                <th className="px-4 py-3">ราคา</th>
                <th className="px-4 py-3">สต๊อก</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">ขายแล้ว</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => (
                <tr key={p.id} className="border-t border-rose-50 hover:bg-cream/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-12 rounded-lg overflow-hidden shrink-0 bg-rose-50">
                        <OptimizedImage src={p.images[0]} alt={p.name} width={80} className="w-10 h-12 object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm text-taupe-600 line-clamp-1 block max-w-xs">{p.name}</span>
                        <span className="text-xs text-taupe-300">{p.images.length} รูป · {p.sizes.length} ไซส์ · {p.colors.length} สี</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-taupe-600">฿{Number(p.price).toLocaleString()}</span>
                    {p.compare_at_price && (
                      <span className="text-xs text-taupe-300 line-through ml-1">฿{Number(p.compare_at_price).toLocaleString()}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${p.stock === 0 ? 'text-rose-500' : p.stock <= 10 ? 'text-amber-500' : 'text-taupe-600'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {p.is_new && <span className="text-[10px] bg-taupe-100 text-taupe-500 px-1.5 py-0.5 rounded">ใหม่</span>}
                      {p.is_sale && <span className="text-[10px] bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded">ลด</span>}
                      {p.is_featured && <span className="text-[10px] bg-amber-100 text-amber-500 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />เด่น</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-taupe-400">{p.sold_count || 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingProduct(p); setShowForm(true); }} className="p-1.5 text-taupe-400 hover:text-rose-500 transition-colors" title="แก้ไข">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-taupe-400 hover:text-rose-500 transition-colors" title="ลบ">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-taupe-400 text-center py-12 text-sm">{search ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า'}</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg border border-rose-200 text-taupe-500 disabled:opacity-30 hover:bg-cream transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-taupe-500 px-2">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg border border-rose-200 text-taupe-500 disabled:opacity-30 hover:bg-cream transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showForm && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
