import { useEffect, useState } from 'react';
import { Save, Phone, Mail, MapPin, Facebook, Instagram, Send } from 'lucide-react';
import { fetchSiteSettings, saveSiteSetting, DEFAULT_STORE_INFO, type StoreInfo } from '../../lib/siteSettings';
import { useToast } from '../../context/ToastContext';

export default function AdminSettings() {
  const { showToast } = useToast();
  const [info, setInfo] = useState<StoreInfo>(DEFAULT_STORE_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await fetchSiteSettings();
      setInfo(s.storeInfo);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const error = await saveSiteSetting('store_info', info);
    setSaving(false);
    if (error) showToast('บันทึกไม่สำเร็จ: ' + error.message, 'error');
    else showToast('บันทึกข้อมูลร้านค้าเรียบร้อย — แสดงผลใน Footer ทันที');
  };

  if (loading) return <div className="text-center text-taupe-400 py-20">กำลังโหลด...</div>;

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-prompt text-2xl font-bold text-taupe-600">ตั้งค่าร้านค้า</h1>
          <p className="text-sm text-taupe-400 mt-1">ข้อมูลติดต่อและโซเชียลที่แสดงในส่วนท้ายเว็บไซต์ (Footer)</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-rose-100 p-5 sm:p-6 space-y-4">
        <SettingField icon={Phone} label="เบอร์โทรศัพท์" value={info.phone} onChange={(v) => setInfo((i) => ({ ...i, phone: v }))} placeholder="02-123-4567, 08x-xxx-xxxx" />
        <SettingField icon={Mail} label="อีเมล" value={info.email} onChange={(v) => setInfo((i) => ({ ...i, email: v }))} placeholder="contact@example.com" />
        <SettingField icon={MapPin} label="ที่อยู่ร้าน" value={info.address} onChange={(v) => setInfo((i) => ({ ...i, address: v }))} placeholder="ที่อยู่สำหรับติดต่อ/จัดส่งคืน" />
        <div className="pt-2 border-t border-rose-50">
          <p className="text-xs text-taupe-400 mb-3">โซเชียลมีเดีย (ใส่ลิงก์เต็ม เช่น https://facebook.com/...)</p>
          <div className="space-y-3">
            <SettingField icon={Facebook} label="Facebook" value={info.facebook} onChange={(v) => setInfo((i) => ({ ...i, facebook: v }))} placeholder="https://facebook.com/yourpage" />
            <SettingField icon={Instagram} label="Instagram" value={info.instagram} onChange={(v) => setInfo((i) => ({ ...i, instagram: v }))} placeholder="https://instagram.com/yourpage" />
            <SettingField icon={Send} label="Line" value={info.line} onChange={(v) => setInfo((i) => ({ ...i, line: v }))} placeholder="https://line.me/ti/p/..." />
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-taupe-400 mb-1 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg border border-rose-100 text-sm text-taupe-600 focus:outline-none focus:ring-2 focus:ring-rose-200"
      />
    </label>
  );
}
