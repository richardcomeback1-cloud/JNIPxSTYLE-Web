import { useState, useEffect } from 'react';
import { Check, CreditCard, Truck, Wallet, Banknote, CheckCircle2, MapPin, ChevronDown, Tag, Ticket, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import { computeDiscount, couponLabel, isCouponValid } from '../lib/coupons';
import type { Address } from '../components/AddressManager';
import type { UserCoupon } from '../types';
import OptimizedImage from '../components/OptimizedImage';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    email: user?.email || '',
    address: '',
    addressName: '',
    floorRoom: '',
    district: '',
    province: '',
    postalCode: '',
    shippingMethod: 'standard',
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  const savedAddresses: Address[] = (profile?.addresses || []) as Address[];
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);

  const selectSavedAddress = (addr: Address) => {
    setSelectedAddrId(addr.id);
    setForm((f) => ({
      ...f,
      fullName: addr.fullName,
      phone: addr.phone,
      address: addr.address,
      addressName: addr.addressName || '',
      floorRoom: addr.floorRoom || '',
      district: addr.district,
      province: addr.province,
      postalCode: addr.postalCode,
    }));
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('user_id', user.id)
        .is('used_at', null)
        .order('saved_at', { ascending: false });
      setUserCoupons((data as UserCoupon[]) || []);
    })();
  }, [user]);

  const shippingCost = form.shippingMethod === 'express' ? 80 : subtotal >= 500 ? 0 : 50;

  const selectedCoupon = userCoupons.find((uc) => uc.id === selectedCouponId);
  const validCoupons = userCoupons.filter((uc) => isCouponValid(uc.coupon) && !uc.used_at);
  const { discount, shippingDiscount } = selectedCoupon
    ? computeDiscount(selectedCoupon.coupon, subtotal, shippingCost)
    : { discount: 0, shippingDiscount: 0 };
  const effectiveShipping = Math.max(0, shippingCost - shippingDiscount);
  const total = subtotal - discount + effectiveShipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const orderNum = `JNIP${Date.now().toString().slice(-8)}`;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNum,
          user_id: user.id,
          status: 'pending',
          subtotal,
          shipping_cost: effectiveShipping,
          discount: discount + shippingDiscount,
          total,
          coupon_code: selectedCoupon?.coupon.code || null,
          shipping_address: {
            fullName: form.fullName,
            phone: form.phone,
            email: form.email,
            address: form.address,
            addressName: form.addressName,
            floorRoom: form.floorRoom,
            district: form.district,
            province: form.province,
            postalCode: form.postalCode,
          },
          shipping_method: form.shippingMethod,
          payment_method: form.paymentMethod,
          payment_status: 'unpaid',
          notes: form.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        product_image: item.image,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      if (selectedCoupon) {
        await supabase
          .from('user_coupons')
          .update({ used_at: new Date().toISOString(), order_id: order.id })
          .eq('id', selectedCoupon.id);
        await supabase
          .from('coupons')
          .update({ used_count: (selectedCoupon.coupon.used_count || 0) + 1 })
          .eq('id', selectedCoupon.coupon.id);
      }

      setOrderNumber(orderNum);
      clearCart();
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
    setLoading(false);
  };

  if (items.length === 0 && step === 'form') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-taupe-400 text-lg mb-4">ตะกร้าสินค้าของคุณว่างเปล่า</p>
        <button onClick={() => navigate('/shop')} className="px-6 py-3 bg-rose-500 text-white rounded-full">
          ไปช้อปเลย
        </button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-14 h-14 text-rose-500" />
        </div>
        <h1 className="font-prompt text-3xl font-bold text-taupe-600 mb-3">สั่งซื้อสำเร็จ!</h1>
        <p className="text-taupe-400 mb-2">ขอบคุณสำหรับคำสั่งซื้อของคุณ</p>
        <p className="text-taupe-500 mb-6">หมายเลขคำสั่งซื้อ: <span className="font-bold text-rose-500">{orderNumber}</span></p>
        <div className="bg-white rounded-2xl p-6 border border-rose-100 mb-6 text-left">
          <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-3">ขั้นตอนต่อไป</h2>
          <ol className="space-y-2 text-sm text-taupe-500">
            <li>1. เราจะติดต่อคุณเพื่อยืนยันคำสั่งซื้อและการชำระเงิน</li>
            <li>2. หลังยืนยันการชำระเงิน เราจะจัดส่งสินค้าภายใน 1-3 วันทำการ</li>
            <li>3. คุณสามารถติดตามสถานะคำสั่งซื้อได้ที่หน้าบัญชีของฉัน</li>
          </ol>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/account')} className="px-6 py-3 border border-taupe-400 text-taupe-500 rounded-full font-medium hover:bg-taupe-50 transition-colors">
            ดูคำสั่งซื้อ
          </button>
          <button onClick={() => navigate('/shop')} className="px-6 py-3 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors">
            ช้อปต่อ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="font-prompt text-2xl lg:text-3xl font-bold text-taupe-600 mb-6">ชำระเงิน</h1>

      {!user && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-taupe-500">เข้าสู่ระบบเพื่อดำเนินการชำระเงิน</p>
          <button onClick={() => navigate('/login')} className="px-4 py-2 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors">
            เข้าสู่ระบบ
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-2xl p-6 border border-rose-100">
            <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-rose-500" />
              ที่อยู่จัดส่ง
            </h2>

            {/* Saved address selector */}
            {savedAddresses.length > 0 && (
              <div className="mb-4">
                <label className="text-sm text-taupe-400 block mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  เลือกจากที่อยู่ที่บันทึกไว้
                </label>
                <div className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => selectSavedAddress(addr)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selectedAddrId === addr.id
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-rose-200 bg-cream hover:border-rose-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {addr.label && (
                              <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full font-medium">
                                {addr.label}
                              </span>
                            )}
                            {addr.isDefault && (
                              <span className="text-xs px-2 py-0.5 bg-rose-500 text-white rounded-full font-medium">
                                หลัก
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-taupe-600">{addr.fullName} · {addr.phone}</p>
                          {addr.addressName && (
                            <span className="text-xs text-taupe-500 font-medium block truncate">{addr.addressName}</span>
                          )}
                          <p className="text-xs text-taupe-400 truncate">
                            {addr.address}{addr.floorRoom ? ` (${addr.floorRoom})` : ''} {addr.district} {addr.province} {addr.postalCode}
                          </p>
                        </div>
                        {selectedAddrId === addr.id && (
                          <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAddrId(null);
                      setForm((f) => ({ ...f, fullName: profile?.full_name || '', phone: profile?.phone || '', address: '', addressName: '', floorRoom: '', district: '', province: '', postalCode: '' }));
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      !selectedAddrId ? 'border-rose-400 bg-rose-50' : 'border-rose-200 bg-cream hover:border-rose-300'
                    }`}
                  >
                    <span className="text-sm text-taupe-500 flex items-center gap-1.5">
                      <ChevronDown className="w-4 h-4" />
                      กรอกที่อยู่ใหม่
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-taupe-400 block mb-1">ชื่อ-นามสกุล *</label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-sm text-taupe-400 block mb-1">เบอร์โทรศัพท์ *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-taupe-400 block mb-1">อีเมล *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-taupe-400 block mb-1">ชื่อที่อยู่ (ชื่อคอนโด อาคาร ซอย)</label>
                <input
                  type="text"
                  value={form.addressName}
                  onChange={(e) => setForm({ ...form, addressName: e.target.value })}
                  placeholder="เช่น คอนโด ดิ แอดเดรส ชิดลม, ซอยสุขุมวิท 23"
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-taupe-400 block mb-1">ที่อยู่ *</label>
                <input
                  required
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="บ้านเลขที่ ถนน แขวง/ตำบล"
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-taupe-400 block mb-1">ชั้น / เลขห้อง (ถ้ามี)</label>
                <input
                  type="text"
                  value={form.floorRoom}
                  onChange={(e) => setForm({ ...form, floorRoom: e.target.value })}
                  placeholder="เช่น ชั้น 5 ห้อง 502"
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-sm text-taupe-400 block mb-1">เขต/อำเภอ *</label>
                <input
                  required
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-sm text-taupe-400 block mb-1">จังหวัด *</label>
                <input
                  required
                  type="text"
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-sm text-taupe-400 block mb-1">รหัสไปรษณีย์ *</label>
                <input
                  required
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                />
              </div>
            </div>
          </div>

          {/* Shipping Method */}
          <div className="bg-white rounded-2xl p-6 border border-rose-100">
            <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">วิธีจัดส่ง</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${form.shippingMethod === 'standard' ? 'border-rose-400 bg-rose-50' : 'border-rose-200'}`}>
                <input type="radio" name="shipping" value="standard" checked={form.shippingMethod === 'standard'} onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })} className="accent-rose-500" />
                <Truck className="w-5 h-5 text-taupe-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-taupe-600">จัดส่งมาตรฐาน (1-3 วัน)</p>
                  <p className="text-xs text-taupe-400">Kerry / Flash / Thailand Post</p>
                </div>
                <span className="text-sm font-medium text-taupe-600">{subtotal >= 500 ? 'ฟรี' : '฿50'}</span>
              </label>
              <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${form.shippingMethod === 'express' ? 'border-rose-400 bg-rose-50' : 'border-rose-200'}`}>
                <input type="radio" name="shipping" value="express" checked={form.shippingMethod === 'express'} onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })} className="accent-rose-500" />
                <Truck className="w-5 h-5 text-taupe-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-taupe-600">จัดส่งด่วน (1-2 วัน)</p>
                  <p className="text-xs text-taupe-400">Flash Express</p>
                </div>
                <span className="text-sm font-medium text-taupe-600">฿80</span>
              </label>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl p-6 border border-rose-100">
            <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">วิธีชำระเงิน</h2>
            <div className="space-y-3">
              {[
                {
                  value: 'bank_transfer',
                  label: 'โอนเงินผ่านธนาคาร',
                  sublabel: 'KBANK, SCB, BBL, KTB, BAY',
                  icon: Wallet,
                  banks: [
                    { name: 'KBANK', bg: '#138F2D', text: '#fff' },
                    { name: 'SCB', bg: '#4E2A84', text: '#fff' },
                    { name: 'BBL', bg: '#1E4595', text: '#fff' },
                    { name: 'KTB', bg: '#1BA7EA', text: '#fff' },
                    { name: 'BAY', bg: '#003B7C', text: '#fff' },
                  ],
                },
                {
                  value: 'promptpay',
                  label: 'พร้อมเพย์',
                  sublabel: 'PromptPay QR Code',
                  icon: Wallet,
                  banks: [
                    { name: 'PromptPay', bg: '#0A6CFF', text: '#fff' },
                  ],
                },
                {
                  value: 'credit_card',
                  label: 'บัตรเครดิต',
                  sublabel: 'Visa, Mastercard, JCB',
                  icon: CreditCard,
                  banks: [
                    { name: 'VISA', bg: '#1A1F71', text: '#fff' },
                    { name: 'MC', bg: '#EB001B', text: '#fff' },
                    { name: 'JCB', bg: '#0E4C96', text: '#fff' },
                  ],
                },
                {
                  value: 'cod',
                  label: 'เก็บเงินปลายทาง (COD)',
                  sublabel: 'ชำระเงินเมื่อได้รับสินค้า',
                  icon: Banknote,
                  banks: [],
                },
              ].map((m) => (
                <label key={m.value} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${form.paymentMethod === m.value ? 'border-rose-400 bg-rose-50' : 'border-rose-200'}`}>
                  <input type="radio" name="payment" value={m.value} checked={form.paymentMethod === m.value} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="accent-rose-500" />
                  <m.icon className="w-5 h-5 text-taupe-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-taupe-600 block">{m.label}</span>
                    {m.sublabel && <span className="text-xs text-taupe-400 block">{m.sublabel}</span>}
                  </div>
                  {m.banks.length > 0 && (
                    <div className="flex gap-1 shrink-0">
                      {m.banks.map((b) => (
                        <span
                          key={b.name}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: b.bg, color: b.text }}
                        >
                          {b.name}
                        </span>
                      ))}
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl p-6 border border-rose-100">
            <label className="text-sm text-taupe-400 block mb-2">หมายเหตุ (ไม่บังคับ)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="หมายเหตุเพิ่มเติมสำหรับคำสั่งซื้อ..."
              className="w-full px-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400 resize-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-rose-100 sticky top-24">
            <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">สรุปคำสั่งซื้อ</h2>

            {user && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => setShowCoupons(!showCoupons)}
                  className="w-full flex items-center justify-between p-3 bg-rose-50 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-100 transition-colors"
                >
                  <span className="flex items-center gap-2"><Ticket className="w-4 h-4" /> ใช้คูปอง</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCoupons ? 'rotate-180' : ''}`} />
                </button>
                {showCoupons && (
                  <div className="mt-2 space-y-2">
                    {validCoupons.length === 0 ? (
                      <p className="text-xs text-taupe-400 text-center py-3">ไม่มีคูปองที่ใช้ได้ <button type="button" onClick={() => navigate('/promotions')} className="text-rose-500 hover:underline">ไปรับคูปอง</button></p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {validCoupons.map((uc) => {
                          const canUse = subtotal >= uc.coupon.min_order;
                          return (
                            <button
                              key={uc.id}
                              type="button"
                              disabled={!canUse}
                              onClick={() => setSelectedCouponId(selectedCouponId === uc.id ? null : uc.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                                selectedCouponId === uc.id ? 'border-rose-400 bg-rose-50' : canUse ? 'border-rose-200 hover:border-rose-300' : 'border-taupe-100 opacity-50 cursor-not-allowed'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-taupe-600 truncate">{couponLabel(uc.coupon)}</p>
                                <p className="text-xs text-taupe-400 font-mono">{uc.coupon.code}</p>
                              </div>
                              {selectedCouponId === uc.id ? (
                                <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0" />
                              ) : (
                                <Tag className="w-5 h-5 text-rose-300 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {selectedCoupon && (
                  <div className="mt-2 flex items-center justify-between p-2.5 bg-green-50 rounded-xl">
                    <span className="text-xs text-green-600 font-medium">ใช้ {selectedCoupon.coupon.code} แล้ว</span>
                    <button type="button" onClick={() => setSelectedCouponId(null)} className="text-green-600 hover:text-green-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {items.map((item) => (
                <div key={`${item.product_id}-${item.size}-${item.color}`} className="flex gap-3">
                  <div className="relative">
                    <OptimizedImage src={item.image} alt={item.name} className="w-14 h-16 object-cover rounded-lg" />
                    <span className="absolute -top-1 -right-1 bg-taupe-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-taupe-500 line-clamp-2">{item.name}</p>
                    <p className="text-xs text-taupe-400">{item.size} | {item.color}</p>
                    <p className="text-sm font-medium text-taupe-600">฿{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-rose-100 pt-4">
              <div className="flex justify-between text-taupe-400">
                <span>ราคาสินค้า</span>
                <span className="text-taupe-600">฿{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>ส่วนลดสินค้า</span>
                  <span>-฿{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-taupe-400">
                <span>ค่าจัดส่ง</span>
                <span className={effectiveShipping === 0 ? 'text-rose-500' : 'text-taupe-600'}>
                  {effectiveShipping === 0 ? 'ฟรี' : `฿${effectiveShipping}`}
                </span>
              </div>
              {shippingDiscount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>ส่วนลดค่าจัดส่ง</span>
                  <span>-฿{shippingDiscount.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-baseline border-t border-rose-100 mt-4 pt-4">
              <span className="font-medium text-taupe-600">ยอดสุทธิ</span>
              <span className="font-prompt text-2xl font-bold text-taupe-600">
                ฿{total.toLocaleString()}
              </span>
            </div>
            {error && <p className="text-sm text-rose-500 mt-3">{error}</p>}
            <button
              type="submit"
              disabled={loading || !user}
              className="w-full mt-4 py-3.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'กำลังดำเนินการ...' : (
                <>ยืนยันคำสั่งซื้อ <Check className="w-4 h-4" /></>
              )}
            </button>
            {!user && <p className="text-xs text-taupe-300 text-center mt-2">กรุณาเข้าสู่ระบบก่อนสั่งซื้อ</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
