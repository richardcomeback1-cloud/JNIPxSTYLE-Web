import { useState, useEffect } from 'react';
import { Users, Mail, Phone, ShoppingBag, ChevronDown, ChevronUp, Crown, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types';

interface CustomerWithStats {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  loyalty_points: number | null;
  addresses: any;
  email?: string;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Record<string, Order[]>>({});

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_customer_stats');
      if (error) {
        console.warn('Could not fetch customer stats:', error.message);
      }
      setCustomers((data as CustomerWithStats[]) || []);
      setLoading(false);
    })();
  }, []);

  const toggleExpand = async (user_id: string) => {
    if (expandedId === user_id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(user_id);
    if (!customerOrders[user_id]) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      setCustomerOrders((prev) => ({ ...prev, [user_id]: (data as Order[]) || [] }));
    }
  };

  if (loading) return <p className="text-taupe-400 text-center py-12">กำลังโหลด...</p>;

  return (
    <div>
      <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">ลูกค้าทั้งหมด ({customers.length})</h2>
      <div className="space-y-3">
        {customers.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-cream/30 transition-colors"
              onClick={() => toggleExpand(c.user_id)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-taupe-600 line-clamp-1">{c.full_name || c.email}</p>
                    {c.is_admin && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-taupe-400 line-clamp-1">{c.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-taupe-600">{c.order_count} คำสั่งซื้อ</p>
                  <p className="text-xs text-taupe-400">฿{Number(c.total_spent).toLocaleString()}</p>
                </div>
                {expandedId === c.user_id ? <ChevronUp className="w-5 h-5 text-taupe-300" /> : <ChevronDown className="w-5 h-5 text-taupe-300" />}
              </div>
            </div>

            {expandedId === c.user_id && (
              <div className="border-t border-rose-50 p-4 space-y-3">
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-taupe-500">
                    <Mail className="w-4 h-4 text-rose-400" />
                    {c.email}
                  </div>
                  <div className="flex items-center gap-2 text-taupe-500">
                    <Phone className="w-4 h-4 text-rose-400" />
                    {c.phone || '-'}
                  </div>
                  <div className="flex items-center gap-2 text-taupe-500">
                    <ShoppingBag className="w-4 h-4 text-rose-400" />
                    สมาชิกใหม่ล่าสุด
                  </div>
                </div>
                <div className="bg-cream rounded-xl p-3">
                  <p className="text-sm font-medium text-taupe-600 mb-2">คำสั่งซื้อของลูกค้า</p>
                  <div className="space-y-2">
                    {(customerOrders[c.user_id] || []).map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-taupe-300" />
                          <span className="text-taupe-500">#{o.order_number}</span>
                          <span className="text-xs text-taupe-400">{new Date(o.created_at).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-taupe-400">{o.status}</span>
                          <span className="text-taupe-600 font-medium">฿{Number(o.total).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {(!customerOrders[c.user_id] || customerOrders[c.user_id].length === 0) && (
                      <p className="text-taupe-400 text-sm text-center py-2">ยังไม่มีคำสั่งซื้อ</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-taupe-400">
                  <span>คะแนนสะสม: {c.loyalty_points || 0}</span>
                  <span>ที่อยู่บันทึก: {c.addresses?.length || 0} รายการ</span>
                </div>
              </div>
            )}
          </div>
        ))}
        {customers.length === 0 && <p className="text-taupe-400 text-center py-12">ยังไม่มีลูกค้าสมัชค์</p>}
      </div>
    </div>
  );
}
