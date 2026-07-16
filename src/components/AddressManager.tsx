import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Plus, Pencil, Trash2, Check, X, Search, Loader2, Star } from 'lucide-react';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressName: string;
  address: string;
  floorRoom: string;
  district: string;
  province: string;
  postalCode: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
}

interface AddressManagerProps {
  addresses: Address[];
  onSave: (addresses: Address[]) => Promise<void>;
}

export default function AddressManager({ addresses, onSave }: AddressManagerProps) {
  const [editing, setEditing] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [mapPos, setMapPos] = useState<{ lat: number; lng: number } | null>(null);
  const [form, setForm] = useState<Omit<Address, 'id'>>({
    label: '',
    fullName: '',
    phone: '',
    addressName: '',
    address: '',
    floorRoom: '',
    district: '',
    province: '',
    postalCode: '',
    lat: null,
    lng: null,
    isDefault: false,
  });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialize map when entering edit mode
  useEffect(() => {
    if (!editing || !mapRef.current) return;

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      if (!mapRef.current || leafletMap.current) return;

      const center: [number, number] = mapPos
        ? [mapPos.lat, mapPos.lng]
        : [13.7563, 100.5018];
      const zoom = mapPos ? 15 : 11;

      leafletMap.current = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(leafletMap.current);

      // Invalidate size after mount
      setTimeout(() => leafletMap.current?.invalidateSize(), 100);

      if (mapPos) {
        markerRef.current = L.marker([mapPos.lat, mapPos.lng]).addTo(leafletMap.current);
      }

      leafletMap.current.on('click', (e: L.LeafletMouseEvent) => {
        handlePick(e.latlng.lat, e.latlng.lng);
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  // Update marker when mapPos changes
  useEffect(() => {
    if (!leafletMap.current) return;
    if (mapPos) {
      if (markerRef.current) {
        markerRef.current.setLatLng([mapPos.lat, mapPos.lng]);
      } else {
        markerRef.current = L.marker([mapPos.lat, mapPos.lng]).addTo(leafletMap.current);
      }
      leafletMap.current.setView([mapPos.lat, mapPos.lng], 15);
    }
  }, [mapPos]);

  const resetForm = () => {
    setForm({
      label: '',
      fullName: '',
      phone: '',
      addressName: '',
      address: '',
      floorRoom: '',
      district: '',
      province: '',
      postalCode: '',
      lat: null,
      lng: null,
      isDefault: false,
    });
    setMapPos(null);
    setSearchQuery('');
    setSearchResults([]);
    setEditIndex(null);
    setEditing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=th&addressdetails=1`,
        { headers: { 'Accept-Language': 'th,en' } }
      );
      const data = await res.json();
      setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handlePick = async (lat: number, lng: number, label?: string) => {
    setMapPos({ lat, lng });
    setForm((f) => ({ ...f, lat, lng }));

    // Reverse geocode
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&countrycodes=th`,
        { headers: { 'Accept-Language': 'th,en' } }
      );
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        setForm((f) => ({
          ...f,
          lat,
          lng,
          address: a.road || a.pedestrian || a.footway || a.neighbourhood || a.house_number || '',
          district: a.suburb || a.district || a.county || a.city_district || '',
          province: a.city || a.state || a.province || a.town || '',
          postalCode: a.postcode || '',
        }));
        if (label) {
          setSearchQuery(label);
          setSearchResults([]);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.address.trim()) return;
    setSaving(true);

    let updated: Address[];
    if (editIndex !== null) {
      updated = [...addresses];
      if (form.isDefault) updated = updated.map((a) => ({ ...a, isDefault: false }));
      updated[editIndex] = { ...form, id: addresses[editIndex].id };
    } else {
      updated = [...addresses];
      if (form.isDefault) updated = updated.map((a) => ({ ...a, isDefault: false }));
      updated.push({ ...form, id: `addr_${Date.now()}` });
    }

    await onSave(updated);
    setSaving(false);
    resetForm();
  };

  const handleEdit = (addr: Address, index: number) => {
    setEditIndex(index);
    setForm({ ...addr });
    if (addr.lat && addr.lng) {
      setMapPos({ lat: addr.lat, lng: addr.lng });
    }
    setEditing(true);
  };

  const handleDelete = async (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    await onSave(updated);
  };

  const handleSetDefault = async (index: number) => {
    const updated = addresses.map((a, i) => ({ ...a, isDefault: i === index }));
    await onSave(updated);
  };

  if (editing) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-rose-100 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-prompt text-lg font-bold text-taupe-600">
            {editIndex !== null ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}
          </h3>
          <button onClick={resetForm} className="text-taupe-400 hover:text-rose-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Map picker */}
          <div>
            <label className="text-sm text-taupe-400 block mb-2">เลือกตำแหน่งบนแผนที่</label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-taupe-300" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  placeholder="ค้นหาสถานที่ เช่น ถนน เขต จังหวัด"
                  className="w-full pl-10 pr-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                ค้นหา
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-white border border-rose-200 rounded-lg max-h-40 overflow-y-auto mb-2">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      handlePick(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
                      setSearchQuery(r.display_name);
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-taupe-500 hover:bg-rose-50 border-b border-rose-100 last:border-0 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 inline mr-2 text-rose-400" />
                    {r.display_name}
                  </button>
                ))}
              </div>
            )}

            <div ref={mapRef} className="rounded-xl overflow-hidden border border-rose-200" style={{ height: '300px' }} />

            <p className="text-xs text-taupe-400 flex items-center gap-1 mt-2">
              <MapPin className="w-3 h-3" />
              {mapPos
                ? `พิกัด: ${mapPos.lat.toFixed(5)}, ${mapPos.lng.toFixed(5)}`
                : 'คลิกบนแผนที่หรือค้นหาสถานที่เพื่อปักหมุด'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-taupe-400 block mb-1">ชื่อ-นามสกุล *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
                placeholder="ชื่อ-นามสกุล"
              />
            </div>
            <div>
              <label className="text-sm text-taupe-400 block mb-1">เบอร์โทรศัพท์ *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
                placeholder="08x-xxx-xxxx"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-taupe-400 block mb-1">ชื่อที่อยู่ (เช่น บ้าน, ที่ทำงาน)</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
              placeholder="บ้าน / ที่ทำงาน / หอพัก"
            />
          </div>

          <div>
            <label className="text-sm text-taupe-400 block mb-1">ชื่อที่อยู่ (ชื่อคอนโด อาคาร ซอย)</label>
            <input
              type="text"
              value={form.addressName}
              onChange={(e) => setForm({ ...form, addressName: e.target.value })}
              className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
              placeholder="เช่น คอนโด ดิ แอดเดรส ชิดลม, ซอยสุขุมวิท 23"
            />
          </div>

          <div>
            <label className="text-sm text-taupe-400 block mb-1">ที่อยู่ (บ้านเลขที่ ถนน) *</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
              placeholder="บ้านเลขที่ ถนน ซอย"
            />
          </div>

          <div>
            <label className="text-sm text-taupe-400 block mb-1">ชั้น / เลขห้อง (ถ้ามี)</label>
            <input
              type="text"
              value={form.floorRoom}
              onChange={(e) => setForm({ ...form, floorRoom: e.target.value })}
              className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
              placeholder="เช่น ชั้น 5 ห้อง 502"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-taupe-400 block mb-1">เขต/อำเภอ</label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
                placeholder="เขต/อำเภอ"
              />
            </div>
            <div>
              <label className="text-sm text-taupe-400 block mb-1">จังหวัด</label>
              <input
                type="text"
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
                placeholder="จังหวัด"
              />
            </div>
            <div>
              <label className="text-sm text-taupe-400 block mb-1">รหัสไปรษณีย์</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 text-sm"
                placeholder="รหัสไปรษณีย์"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="accent-rose-500"
            />
            <span className="text-sm text-taupe-500">ตั้งเป็นที่อยู่หลัก</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.fullName.trim() || !form.phone.trim() || !form.address.trim()}
              className="flex-1 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 border border-rose-200 text-taupe-500 rounded-full font-medium hover:bg-rose-50 transition-colors text-sm"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-rose-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-prompt text-xl font-bold text-taupe-600">ที่อยู่จัดส่ง</h2>
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          เพิ่มที่อยู่
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-rose-300 mx-auto mb-4" />
          <p className="text-taupe-400 mb-1">ยังไม่มีที่อยู่ที่บันทึกไว้</p>
          <p className="text-sm text-taupe-300 mb-4">เพิ่มที่อยู่เพื่อใช้ในการจัดส่งสินค้า</p>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่มที่อยู่ใหม่
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr, i) => (
            <div
              key={addr.id}
              className={`p-4 rounded-xl border transition-colors ${
                addr.isDefault ? 'border-rose-400 bg-rose-50' : 'border-rose-100 bg-cream'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {addr.label && (
                      <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full font-medium">
                        {addr.label}
                      </span>
                    )}
                    {addr.isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-rose-500 text-white rounded-full font-medium flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        ที่อยู่หลัก
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-taupe-600">{addr.fullName}</p>
                  <p className="text-sm text-taupe-400">{addr.phone}</p>
                  {addr.addressName && (
                    <p className="text-sm text-taupe-500 font-medium">{addr.addressName}</p>
                  )}
                  <p className="text-sm text-taupe-400">
                    {addr.address}{addr.floorRoom ? ` (${addr.floorRoom})` : ''} {addr.district} {addr.province} {addr.postalCode}
                  </p>
                  {addr.lat && addr.lng && (
                    <p className="text-xs text-taupe-300 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      พิกัด: {addr.lat.toFixed(5)}, {addr.lng.toFixed(5)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(i)}
                      className="text-xs text-taupe-400 hover:text-rose-500 transition-colors px-2 py-1"
                    >
                      ตั้งเป็นหลัก
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(addr, i)}
                    className="text-taupe-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="text-taupe-400 hover:text-rose-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
