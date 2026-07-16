import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import { Package, MapPin, Heart, LogOut, User as UserIcon, Truck, CheckCircle2, Clock, Ticket, Tag } from 'lucide-react';
import type { Order, OrderItem, Product, UserCoupon } from '../types';
import { couponLabel, isCouponValid } from '../lib/coupons';
import AddressManager, { type Address } from '../components/AddressManager';
import OptimizedImage from '../components/OptimizedImage';

export default function AccountPage() {
  const { user, profile, signOut, loading, refreshProfile } = useAuth();
  const [tab, setTab] = useState<'orders' | 'coupons' | 'profile' | 'addresses' | 'wishlist'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: ords } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      const ordersData = (ords as Order[]) || [];
      setOrders(ordersData);
      const itemsMap: Record<string, OrderItem[]> = {};
      for (const o of ordersData) {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', o.id);
        itemsMap[o.id] = (items as OrderItem[]) || [];
      }
      setOrderItems(itemsMap);

      const { data: wish } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id);
      if (wish && wish.length > 0) {
        const ids = wish.map((w: { product_id: string }) => w.product_id);
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .in('id', ids);
        setWishlist((prods as Product[]) || []);
      }

      const { data: ucs } = await supabase
        .from('user_coupons')
        .select('*, coupon:coupons(*)')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });
      setUserCoupons((ucs as UserCoupon[]) || []);
    })();
  }, [user]);

  if (loading || !user) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-taupe-400">กำลังโหลด...</div>;
  }

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
    pending: { label: 'รอชำระเงิน', color: 'text-amber-500 bg-amber-50', icon: Clock },
    paid: { label: 'ชำระแล้ว', color: 'text-blue-500 bg-blue-50', icon: CheckCircle2 },
    processing: { label: 'กำลังเตรียมสินค้า', color: 'text-blue-500 bg-blue-50', icon: Package },
    shipped: { label: 'จัดส่งแล้ว', color: 'text-purple-500 bg-purple-50', icon: Truck },
    delivered: { label: 'จัดส่งถึงแล้ว', color: 'text-green-500 bg-green-50', icon: CheckCircle2 },
    cancelled: { label: 'ยกเลิก', color: 'text-rose-500 bg-rose-50', icon: Clock },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
          <UserIcon className="w-8 h-8 text-rose-500" />
        </div>
        <div>
          <h1 className="font-prompt text-2xl font-bold text-taupe-600">
            สวัสดี, {profile?.full_name || user.email}
          </h1>
          <p className="text-sm text-taupe-400">
            แต้มสะสม: {profile?.loyalty_points || 0} คะแนน
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-4 border border-rose-100">
            <nav className="space-y-1">
              {[
                { key: 'orders', label: 'ประวัติคำสั่งซื้อ', icon: Package },
                { key: 'coupons', label: 'คูปองของฉัน', icon: Ticket },
                { key: 'profile', label: 'ข้อมูลส่วนตัว', icon: UserIcon },
                { key: 'addresses', label: 'ที่อยู่จัดส่ง', icon: MapPin },
                { key: 'wishlist', label: 'สินค้าที่ถูกใจ', icon: Heart },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as 'orders' | 'coupons' | 'profile' | 'addresses' | 'wishlist')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    tab === t.key ? 'bg-rose-50 text-rose-500' : 'text-taupe-400 hover:bg-rose-50/50'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
              <button
                onClick={() => { signOut(); navigate('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-taupe-400 hover:bg-rose-50/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          {tab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-prompt text-xl font-bold text-taupe-600 mb-4">ประวัติคำสั่งซื้อ</h2>
              {orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-rose-100 text-center">
                  <Package className="w-12 h-12 text-rose-300 mx-auto mb-4" />
                  <p className="text-taupe-400 mb-4">ยังไม่มีคำสั่งซื้อ</p>
                  <button onClick={() => navigate('/shop')} className="px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors">
                    เริ่มช้อปเลย
                  </button>
                </div>
              ) : (
                orders.map((o) => {
                  const sc = statusConfig[o.status] || statusConfig.pending;
                  return (
                    <div key={o.id} className="bg-white rounded-2xl p-5 border border-rose-100">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                          <p className="font-medium text-taupe-600">คำสั่งซื้อ #{o.order_number}</p>
                          <p className="text-xs text-taupe-400">{new Date(o.created_at).toLocaleDateString('th-TH', { dateStyle: 'full' })}</p>
                        </div>
                        <span className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${sc.color}`}>
                          <sc.icon className="w-3.5 h-3.5" />
                          {sc.label}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {(orderItems[o.id] || []).map((item) => (
                          <div key={item.id} className="flex gap-3 items-center">
                            <OptimizedImage src={item.product_image || ''} alt={item.product_name} className="w-12 h-14 object-cover rounded-lg" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-taupe-500 line-clamp-1">{item.product_name}</p>
                              <p className="text-xs text-taupe-400">{item.size} | {item.color} | จำนวน {item.quantity}</p>
                            </div>
                            <p className="text-sm font-medium text-taupe-600">฿{item.subtotal.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center border-t border-rose-100 mt-4 pt-3">
                        <span className="text-sm text-taupe-400">ยอดรวม</span>
                        <span className="font-prompt text-lg font-bold text-taupe-600">฿{o.total.toLocaleString()}</span>
                      </div>
                      {o.tracking_number && (
                        <p className="text-xs text-taupe-400 mt-2">หมายเลขพัสดุ: {o.tracking_number}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div className="bg-white rounded-2xl p-6 border border-rose-100">
              <h2 className="font-prompt text-xl font-bold text-taupe-600 mb-4">ข้อมูลส่วนตัว</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-taupe-400 block mb-1">ชื่อ-นามสกุล</label>
                  <p className="px-4 py-2.5 bg-cream rounded-lg text-taupe-500">{profile?.full_name || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-taupe-400 block mb-1">อีเมล</label>
                  <p className="px-4 py-2.5 bg-cream rounded-lg text-taupe-500">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm text-taupe-400 block mb-1">เบอร์โทรศัพท์</label>
                  <p className="px-4 py-2.5 bg-cream rounded-lg text-taupe-500">{profile?.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-taupe-400 block mb-1">แต้มสะสม</label>
                  <p className="px-4 py-2.5 bg-rose-50 rounded-lg text-rose-500 font-medium">{profile?.loyalty_points || 0} คะแนน</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'coupons' && (
            <div>
              <h2 className="font-prompt text-xl font-bold text-taupe-600 mb-4">คูปองของฉัน</h2>
              {userCoupons.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-rose-100 text-center">
                  <Ticket className="w-12 h-12 text-rose-300 mx-auto mb-4" />
                  <p className="text-taupe-400 mb-4">ยังไม่มีคูปองในบัญชี</p>
                  <button onClick={() => navigate('/promotions')} className="px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors">
                    ไปรับคูปอง
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {userCoupons.map((uc) => {
                    const valid = isCouponValid(uc.coupon) && !uc.used_at;
                    const expired = uc.coupon.valid_until && new Date(uc.coupon.valid_until) < new Date();
                    return (
                      <div key={uc.id} className={`bg-white rounded-2xl p-5 border-2 ${valid ? 'border-dashed border-rose-200' : 'border-taupe-100 opacity-60'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                            {uc.coupon.type === 'shipping' ? <Truck className="w-5 h-5 text-rose-500" /> : <Tag className="w-5 h-5 text-rose-500" />}
                          </div>
                          {uc.used_at ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-taupe-100 text-taupe-400">ใช้แล้ว</span>
                          ) : expired ? (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-taupe-100 text-taupe-400">หมดอายุ</span>
                          ) : (
                            <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-600">พร้อมใช้</span>
                          )}
                        </div>
                        <p className="font-prompt text-lg font-bold text-rose-500 mb-1">{couponLabel(uc.coupon)}</p>
                        <p className="text-xs text-taupe-400 mb-2">ขั้นต่ำ ฿{uc.coupon.min_order}</p>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-sm font-bold text-taupe-600 bg-cream px-3 py-1.5 rounded-lg">{uc.coupon.code}</p>
                          {uc.coupon.valid_until && (
                            <span className="text-xs text-taupe-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(uc.coupon.valid_until).toLocaleDateString('th-TH')}
                            </span>
                          )}
                        </div>
                        {valid && (
                          <button
                            onClick={() => navigate('/checkout')}
                            className="w-full mt-3 py-2 bg-rose-50 text-rose-500 rounded-full text-xs font-medium hover:bg-rose-100 transition-colors"
                          >
                            ใช้ตอนชำระเงิน
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 text-center">
                <button onClick={() => navigate('/promotions')} className="text-sm text-rose-500 hover:underline">
                  ดูคูปองทั้งหมด
                </button>
              </div>
            </div>
          )}

          {tab === 'addresses' && (
            <AddressManager
              addresses={(profile?.addresses || []) as Address[]}
              onSave={async (newAddresses) => {
                if (!user) return;
                await supabase
                  .from('profiles')
                  .update({ addresses: newAddresses, updated_at: new Date().toISOString() })
                  .eq('user_id', user.id);
                await refreshProfile();
              }}
            />
          )}

          {tab === 'wishlist' && (
            <div>
              <h2 className="font-prompt text-xl font-bold text-taupe-600 mb-4">สินค้าที่ถูกใจ</h2>
              {wishlist.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 border border-rose-100 text-center">
                  <Heart className="w-12 h-12 text-rose-300 mx-auto mb-4" />
                  <p className="text-taupe-400 mb-4">ยังไม่มีสินค้าที่ถูกใจ</p>
                  <button onClick={() => navigate('/shop')} className="px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors">
                    ดูสินค้า
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {wishlist.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl overflow-hidden border border-rose-100 cursor-pointer" onClick={() => navigate(`/product/${p.slug}`)}>
                      <OptimizedImage src={p.images[0]} alt={p.name} className="w-full aspect-[3/4] object-cover" />
                      <div className="p-3">
                        <p className="text-sm text-taupe-500 line-clamp-2">{p.name}</p>
                        <p className="font-bold text-taupe-600 mt-1">฿{p.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
