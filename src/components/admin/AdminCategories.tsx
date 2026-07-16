import { useState } from 'react';
import { Plus, Edit, Trash2, X, Folder } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Category } from '../../types';

interface Props {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

export default function AdminCategories({ categories, onCategoriesChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const handleSave = async (data: Partial<Category>) => {
    if (editing) {
      const { error } = await supabase.from('categories').update(data).eq('id', editing.id);
      if (error) { alert('บันทึกไม่สำเร็จ: ' + error.message); return; }
      onCategoriesChange(categories.map((c) => (c.id === editing.id ? { ...c, ...data } as Category : c)));
    } else {
      const { data: newCat, error } = await supabase.from('categories').insert(data).select().single();
      if (error) { alert('เพิ่มไม่สำเร็จ: ' + error.message); return; }
      onCategoriesChange([...categories, newCat as Category]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    const hasProducts = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category_id', id);
    if ((hasProducts.count ?? 0) > 0) {
      alert(`ไม่สามารถลบได้ มีสินค้า ${hasProducts.count} ชิ้นอยู่ในหมวดหมู่นี้ กรุณาย้ายสินค้าก่อน`);
      return;
    }
    if (!confirm('ต้องการลบหมวดหมู่นี้ใช่หรือไม่?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { alert('ลบไม่สำเร็จ: ' + error.message); return; }
    onCategoriesChange(categories.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-prompt text-lg font-bold text-taupe-600">จัดการหมวดหมู่ ({categories.length})</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((c) => {
          const children = categories.filter((child) => child.parent_id === c.id);
          return (
            <div key={c.id}>
              <div className="bg-white rounded-xl p-4 border border-rose-100 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-cream flex items-center justify-center shrink-0">
                    <Folder className="w-5 h-5 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-taupe-600 line-clamp-1">{c.name}</p>
                    <p className="text-xs text-taupe-300">/{c.slug} · ลำดับ {c.sort_order}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(c); setShowForm(true); }} className="p-1.5 text-taupe-400 hover:text-rose-500 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-taupe-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {children.length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  {children.map((child) => (
                    <div key={child.id} className="bg-cream rounded-xl p-3 border border-rose-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-2 h-2 rounded-full bg-rose-300 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-taupe-500 line-clamp-1">{child.name}</p>
                          <p className="text-xs text-taupe-300">/{child.slug}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setEditing(child); setShowForm(true); }} className="p-1.5 text-taupe-400 hover:text-rose-500 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(child.id)} className="p-1.5 text-taupe-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {categories.length === 0 && <p className="text-taupe-400 text-center py-12">ยังไม่มีหมวดหมู่</p>}
      </div>

      {showForm && <CategoryFormModal category={editing} categories={categories} onClose={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} />}
    </div>
  );
}

function CategoryFormModal({ category, categories, onClose, onSave }: { category: Category | null; categories: Category[]; onClose: () => void; onSave: (data: Partial<Category>) => void }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    parent_id: category?.parent_id || null,
    description: category?.description || '',
    image_url: category?.image_url || '',
    sort_order: category?.sort_order || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    onSave({
      name: form.name,
      slug,
      parent_id: form.parent_id || null,
      description: form.description || null,
      image_url: form.image_url || null,
      sort_order: Number(form.sort_order),
    });
  };

  const inputClass = 'w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-white text-taupe-500 focus:outline-none focus:border-rose-400 transition-colors';
  const rootCategories = categories.filter((c) => !c.parent_id && c.id !== category?.id);

  return (
    <div className="fixed inset-0 bg-taupe-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-cream rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-prompt text-xl font-bold text-taupe-600">{category ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</h2>
          <button onClick={onClose} className="p-2 text-taupe-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-taupe-400 block mb-1">ชื่อหมวดหมู่ *</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-taupe-400 block mb-1">Slug (URL)</label>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto ถ้าเว้นว่าง" className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-taupe-400 block mb-1">หมวดหมู่หลัก (ถ้าเป็นหมวดย่อย)</label>
            <select value={form.parent_id || ''} onChange={(e) => setForm({ ...form, parent_id: e.target.value || null })} className={inputClass}>
              <option value="">ไม่มี (หมวดหลัก)</option>
              {rootCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-taupe-400 block mb-1">คำอธิบาย</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className="text-sm text-taupe-400 block mb-1">URL รูปภาพ</label>
            <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className={inputClass} />
          </div>
          <div>
            <label className="text-sm text-taupe-400 block mb-1">ลำดับการแสดง</label>
            <input type="number" min="0" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className={inputClass} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-taupe-300 text-taupe-500 rounded-full font-medium hover:bg-taupe-50 transition-colors">ยกเลิก</button>
            <button type="submit" className="flex-1 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors">บันทึก</button>
          </div>
        </form>
      </div>
    </div>
  );
}
