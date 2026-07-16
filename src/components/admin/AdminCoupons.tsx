import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Tag, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Coupon } from '../../types';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      setCoupons((data as Coupon[]) || []);
      setLoading(false);
    })();
  }, []);

  const handleSave = async (formData: Partial<Coupon>) => {
    if (editing) {
      const { error } = await supabase.from('coupons').update(formData).eq('id', editing.id);
      if (error) { alert('บันทึกไม่สำเร็จ: ' + error.message); return; }
      setCoupons(coupons.map((c) => (c.id === editing.id ? { ...c, ...formData } as Coupon : c)));
    } else {
      const { data, error } = await supabase.from('coupons').insert(formData).select().single();
      if (error) { alert('เพิ่มไม่สำเร็จ: ' + error.message); return; }
      setCoupons([data as Coupon, ...coupons]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบคูปองนี้ใช่หรือไม่?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) { alert('ลบไม่สำเร็จ: ' + error.message); return; }
    setCoupons(coupons.filter((c) => c.id !== id));
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) return;
    setCoupons(coupons.map((cp) => (cp.id === c.id ? { ...cp, is_active: !cp.is_active } : cp)));
  };

  if (loading) return <p className="text-taupe-400 text-center py-12">กำลังโหลด...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-prompt text-lg font-bold text-taupe-600">จัดการคูปอง ({coupons.length})</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> เพิ่มคูปอง
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className={`bg-white rounded-2xl p-5 border ${c.is_active ? 'border-rose-100' : 'border-taupe-100 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Tag className="w-5 h-5 text-rose-500" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(c); setShowForm(true); }} className="p-1.5 text-taupe-400 hover:text-rose-500 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 text-taupe-400 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="font-mono font-bold text-lg text-taupe-600 mb-1">{c.code}</p>
            <p className="text-sm text-taupe-500 mb-2">
              {c.type === 'percent' ? `ลด ${c.value}%` : c.type === 'shipping' ? (c.value === 0 ? 'ฟรีค่าจัดส่ง' : `ลดค่าจัดส่ง ฿${Number(c.value).toLocaleString()}`) : `ลด ฿${Number(c.value).toLocaleString()}`}
            </p>
            <p className="text-xs text-taupe-400 mb-3">ขั้นต่ำ ฿{Number(c.min_order).toLocaleString()}</p>
            <div className="flex items-center gap-2 text-xs text-taupe-400 mb-3">
              <Calendar className="w-3.5 h-3.5" />
              {c.valid_until ? `หมดอายุ ${new Date(c.valid_until).toLocaleDateString('th-TH')}` : 'ไม่มีกำหนด'}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-taupe-400">ใช้แล้ว {c.used_count || 0}/{c.max_uses || '∞'}</span>
              <button
                onClick={() => toggleActive(c)}
                className={`px-2.5 py-1 rounded-full transition-colors ${c.is_active ? 'bg-green-50 text-green-600' : 'bg-taupe-100 text-taupe-400'}`}
              >
                {c.is_active ? 'เปิดใช้งาน' : 'ปิดแล้ว'}
              </button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-12 border border-rose-100 text-center">
            <Tag className="w-12 h-12 text-rose-300 mx-auto mb-4" />
            <p className="text-taupe-400">ยังไม่มีคูปอง กดเพิ่มคูปองเพื่อสร้างใหม่</p>
          </div>
        )}
      </div>

      {showForm && <CouponFormModal coupon={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} />}
    </div>
  );
}

function CouponFormModal({ coupon, onClose, onSave }: { coupon: Coupon | null; onClose: () => void; onSave: (data: Partial<Coupon>) => void }) {
  const [form, setForm] = useState({
    code: coupon?.code || '',
    type: coupon?.type || 'percent',
    value: coupon?.value || 10,
    min_order: coupon?.min_order || 0,
    max_uses: coupon?.max_uses || null,
    valid_from: coupon?.valid_from?.split('T')[0] || '',
    valid_until: coupon?.valid_until?.split('T')[0] || '',
    is_active: coupon?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: Number(form.value),
      min_order: Number(form.min_order),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      is_active: form.is_active,
    });
  };

  const inputClass = 'w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-white text-taupe-500 focus:outline-none focus:border-rose-400 transition-colors';

  return (
    <div className="fixed inset-0 bg-taupe-900/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-cream rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-prompt text-xl font-bold text-taupe-600">{coupon ? 'แก้ไขคูปอง' : 'เพิ่มคูปองใหม่'}</h2>
          <button onClick={onClose} className="p-2 text-taupe-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-taupe-400 block mb-1">รหัสคูปอง *</label>
            <input required type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" className={`${inputClass} font-mono`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-taupe-400 block mb-1">ประเภท</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' | 'shipping' })} className={inputClass}>
                <option value="percent">ลดเปอร์เซ็นต์ (%)</option>
                <option value="fixed">ลดจำนวนเงิน (฿)</option>
                <option value="shipping">ส่วนลดค่าจัดส่ง</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-taupe-400 block mb-1">{form.type === 'shipping' ? 'ค่าส่วนลด (0=ฟรีค่าส่ง)' : 'ค่าส่วนลด *'}</label>
              <input required type="number" min={form.type === 'shipping' ? '0' : '1'} step={form.type === 'percent' ? '1' : '0.01'} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-taupe-400 block mb-1">ขั้นต่ำ (฿)</label>
              <input type="number" min="0" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: Number(e.target.value) })} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-taupe-400 block mb-1">จำนวดใช้สูงสุด</label>
              <input type="number" min="1" value={form.max_uses ?? ''} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? Number(e.target.value) : null })} placeholder="ไม่จำกัด" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-taupe-400 block mb-1">เริ่มต้น</label>
              <input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-sm text-taupe-400 block mb-1">สิ้นสุด</label>
              <input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-taupe-500 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-rose-500 w-4 h-4" />
            เปิดใช้งานคูปอง
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-taupe-300 text-taupe-500 rounded-full font-medium hover:bg-taupe-50 transition-colors">ยกเลิก</button>
            <button type="submit" className="flex-1 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors">บันทึก</button>
          </div>
        </form>
      </div>
    </div>
  );
}
