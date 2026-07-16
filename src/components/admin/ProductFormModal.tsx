import { useState, useRef } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product, Category } from '../../types';

interface Props {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
}

export default function ProductFormModal({ product, categories, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    price: product?.price || 0,
    compare_at_price: product?.compare_at_price || null,
    category_id: product?.category_id || '',
    images: product?.images || [],
    sizes: product?.sizes || [],
    colors: product?.colors || [],
    stock: product?.stock || 0,
    is_featured: product?.is_featured || false,
    is_new: product?.is_new || false,
    is_sale: product?.is_sale || false,
    care_instructions: product?.care_instructions || '',
    size_chart: product?.size_chart || '',
  });
  const [uploading, setUploading] = useState(false);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (!error) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        uploaded.push(urlData.publicUrl);
      }
    }
    setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
    setUploading(false);
  };

  const handleUrlAdd = () => {
    const url = urlInputRef.current?.value.trim();
    if (url) {
      setForm((f) => ({ ...f, images: [...f.images, url] }));
      if (urlInputRef.current) urlInputRef.current.value = '';
    }
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const addSize = () => {
    if (newSize.trim()) {
      setForm((f) => ({ ...f, sizes: [...f.sizes, newSize.trim()] }));
      setNewSize('');
    }
  };

  const addColor = () => {
    if (newColor.trim()) {
      setForm((f) => ({ ...f, colors: [...f.colors, newColor.trim()] }));
      setNewColor('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    onSave({
      ...form,
      slug,
      images: form.images.filter(Boolean),
      price: Number(form.price),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      stock: Number(form.stock),
    });
  };

  const inputClass = 'w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-white text-taupe-500 focus:outline-none focus:border-rose-400 transition-colors';
  const labelClass = 'text-sm text-taupe-400 block mb-1';

  return (
    <div className="fixed inset-0 bg-taupe-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-cream rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-prompt text-xl font-bold text-taupe-600">{product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
          <button onClick={onClose} className="p-2 text-taupe-400 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>ชื่อสินค้า *</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>รายละเอียดสินค้า</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ราคา (฿) *</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ราคาก่อนลด (฿)</label>
              <input type="number" min="0" step="0.01" value={form.compare_at_price ?? ''} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>หมวดหมู่</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className={inputClass}>
                <option value="">เลือกหมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>สต๊อก</label>
              <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className={labelClass}>รูปภาพสินค้า</label>
            <div className="space-y-3">
              {/* Preview grid */}
              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-rose-200">
                      <img src={img} alt="" decoding="async" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-taupe-600/80 text-white text-[10px] text-center py-0.5">หลัก</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-rose-200 rounded-xl p-4 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                {uploading ? (
                  <p className="text-sm text-rose-500">กำลังอัปโหลด...</p>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-taupe-400">
                    <Upload className="w-6 h-6" />
                    <p className="text-sm">คลิกเพื่ออัปโหลดรูป (รองรับหลายรูป)</p>
                  </div>
                )}
              </div>

              {/* URL input */}
              <div className="flex gap-2">
                <input
                  ref={urlInputRef}
                  type="url"
                  placeholder="หรือวาง URL รูปภาพ..."
                  className="flex-1 px-4 py-2 border border-rose-200 rounded-lg bg-white text-taupe-500 text-sm focus:outline-none focus:border-rose-400"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleUrlAdd(); } }}
                />
                <button type="button" onClick={handleUrlAdd} className="px-4 py-2 bg-taupe-500 text-white rounded-lg text-sm font-medium hover:bg-taupe-600 transition-colors flex items-center gap-1">
                  <Plus className="w-4 h-4" /> เพิ่ม
                </button>
              </div>
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className={labelClass}>ไซส์ที่มี</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.sizes.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 rounded-full text-sm text-taupe-500">
                  {s}
                  <button type="button" onClick={() => setForm({ ...form, sizes: form.sizes.filter((_, idx) => idx !== i) })} className="text-rose-400 hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newSize} onChange={(e) => setNewSize(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSize(); } }} placeholder="เช่น S, M, L, XL" className={inputClass} />
              <button type="button" onClick={addSize} className="px-4 py-2 bg-cream border border-rose-200 rounded-lg text-sm text-taupe-500 hover:bg-rose-50 transition-colors flex items-center gap-1 whitespace-nowrap">
                <Plus className="w-4 h-4" /> เพิ่ม
              </button>
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className={labelClass}>สีที่มี</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.colors.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 rounded-full text-sm text-taupe-500">
                  {c}
                  <button type="button" onClick={() => setForm({ ...form, colors: form.colors.filter((_, idx) => idx !== i) })} className="text-rose-400 hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} placeholder="เช่น ขาว, ดำ, ครีม" className={inputClass} />
              <button type="button" onClick={addColor} className="px-4 py-2 bg-cream border border-rose-200 rounded-lg text-sm text-taupe-500 hover:bg-rose-50 transition-colors flex items-center gap-1 whitespace-nowrap">
                <Plus className="w-4 h-4" /> เพิ่ม
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>คำแนะนำการดูแล</label>
            <input type="text" value={form.care_instructions} onChange={(e) => setForm({ ...form, care_instructions: e.target.value })} placeholder="เช่น ซักเครื่องน้ำเย็น" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>ตารางไซส์ (URL รูป)</label>
            <input type="text" value={form.size_chart} onChange={(e) => setForm({ ...form, size_chart: e.target.value })} placeholder="https://..." className={inputClass} />
          </div>

          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-taupe-500 cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-rose-500 w-4 h-4" />
              สินค้าเด่น
            </label>
            <label className="flex items-center gap-2 text-sm text-taupe-500 cursor-pointer">
              <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="accent-rose-500 w-4 h-4" />
              มาใหม่
            </label>
            <label className="flex items-center gap-2 text-sm text-taupe-500 cursor-pointer">
              <input type="checkbox" checked={form.is_sale} onChange={(e) => setForm({ ...form, is_sale: e.target.checked })} className="accent-rose-500 w-4 h-4" />
              ลดราคา
            </label>
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
