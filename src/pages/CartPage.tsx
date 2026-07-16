import { useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import type { Coupon } from '../types';
import OptimizedImage from '../components/OptimizedImage';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, subtotal, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const shippingCost = subtotal >= 500 ? 0 : 50;
  const discount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.round((subtotal * appliedCoupon.value) / 100)
      : appliedCoupon.value
    : 0;
  const total = Math.max(0, subtotal + shippingCost - discount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      const c = data as Coupon;
      if (subtotal >= c.min_order) {
        setAppliedCoupon(c);
        setCouponError('');
      } else {
        setCouponError(`ต้องสั่งซื้อขั้นต่ำ ฿${c.min_order}`);
      }
    } else {
      setCouponError('ไม่พบโค้ดส่วนลดนี้');
    }
    setCouponLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 animate-fade-in">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 rounded-full bg-rose-50 flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-rose-300" />
          </div>
          <h1 className="font-prompt text-2xl font-bold text-taupe-600 mb-2">ตะกร้าสินค้าของคุณว่างเปล่า</h1>
          <p className="text-taupe-400 mb-6">ยังไม่มีสินค้าในตะกร้า เริ่มเลือกซื้อสินค้าที่คุณชื่นชอบได้เลย</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-8 py-3.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center gap-2"
          >
            เริ่มช้อปเลย <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="font-prompt text-2xl lg:text-3xl font-bold text-taupe-600 mb-6">ตะกร้าสินค้า</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.product_id}-${item.size}-${item.color}`}
              className="flex gap-4 bg-white rounded-2xl p-4 border border-rose-100"
            >
              <OptimizedImage
                src={item.image}
                alt={item.name}
                className="w-24 h-28 sm:w-28 sm:h-32 object-cover rounded-xl cursor-pointer"
                onClick={() => navigate(`/product/${item.slug}`)}
              />
              <div className="flex-1 min-w-0">
                <h3
                  className="font-medium text-taupe-600 cursor-pointer hover:text-rose-500 line-clamp-2"
                  onClick={() => navigate(`/product/${item.slug}`)}
                >
                  {item.name}
                </h3>
                <p className="text-sm text-taupe-400 mt-1">ไซส์: {item.size} | สี: {item.color}</p>
                <p className="font-prompt text-lg font-bold text-taupe-600 mt-1">
                  ฿{item.price.toLocaleString()}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="inline-flex items-center gap-1 bg-rose-50 rounded-full px-1">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-taupe-500 hover:text-rose-500"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium text-taupe-600">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-taupe-500 hover:text-rose-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-taupe-600">
                      ฿{(item.price * item.quantity).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product_id, item.size, item.color)}
                      className="p-2 text-taupe-300 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={clearCart}
              className="text-sm text-taupe-400 hover:text-rose-500 transition-colors"
            >
              ล้างตะกร้า
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="text-sm text-taupe-400 hover:text-rose-500 transition-colors flex items-center gap-1"
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> ช้อปต่อ
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-rose-100 sticky top-24">
            <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">สรุปคำสั่งซื้อ</h2>

            {/* Coupon */}
            <div className="mb-4">
              <label className="text-sm text-taupe-400 block mb-2">โค้ดส่วนลด</label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-rose-50 px-3 py-2.5 rounded-lg">
                  <span className="text-sm text-rose-500 font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {appliedCoupon.code}
                  </span>
                  <button
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                    className="text-taupe-400 hover:text-rose-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="ใส่โค้ดส่วนลด"
                    className="flex-1 px-3 py-2.5 text-sm border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="px-4 py-2.5 bg-taupe-500 text-white rounded-lg text-sm font-medium hover:bg-taupe-600 transition-colors disabled:opacity-50"
                  >
                    ใช้
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-rose-500 mt-1">{couponError}</p>}
              <p className="text-xs text-taupe-300 mt-1">ลอง: WELCOME10, SUMMER50, NEWSTUDENT</p>
            </div>

            <div className="space-y-2 text-sm border-t border-rose-100 pt-4">
              <div className="flex justify-between text-taupe-400">
                <span>ราคาสินค้า</span>
                <span className="text-taupe-600">฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-taupe-400">
                <span>ค่าจัดส่ง</span>
                <span className={shippingCost === 0 ? 'text-rose-500' : 'text-taupe-600'}>
                  {shippingCost === 0 ? 'ฟรี' : `฿${shippingCost}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>ส่วนลด</span>
                  <span>-฿{discount.toLocaleString()}</span>
                </div>
              )}
              {shippingCost > 0 && (
                <p className="text-xs text-taupe-300 pt-1">
                  ซื้อเพิ่ม ฿{(500 - subtotal).toLocaleString()} เพื่อรับส่งฟรี!
                </p>
              )}
            </div>

            <div className="flex justify-between items-baseline border-t border-rose-100 mt-4 pt-4">
              <span className="font-medium text-taupe-600">ยอดสุทธิ</span>
              <span className="font-prompt text-2xl font-bold text-taupe-600">
                ฿{total.toLocaleString()}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full mt-4 py-3.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2"
            >
              ดำเนินการชำระเงิน <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
