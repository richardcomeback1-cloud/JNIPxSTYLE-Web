import { TrendingUp, ShoppingCart, Package, AlertTriangle, Clock, Banknote } from 'lucide-react';
import type { Product, Order } from '../../types';
import OptimizedImage from '../OptimizedImage';

interface Props {
  products: Product[];
  orders: Order[];
}

export default function AdminDashboard({ products, orders }: Props) {
  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= 10);
  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'paid');
  const recentOrders = orders.slice(0, 8);

  const today = new Date();
  const todayOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d.toDateString() === today.toDateString();
  });
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

  const stats = [
    { label: 'ยอดขายรวม', value: `฿${totalSales.toLocaleString()}`, icon: Banknote, color: 'text-green-600 bg-green-50' },
    { label: 'ยอดขายวันนี้', value: `฿${todaySales.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'คำสั่งซื้อทั้งหมด', value: totalOrders, icon: ShoppingCart, color: 'text-rose-600 bg-rose-50' },
    { label: 'รอดำเนินการ', value: pendingOrders.length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'สินค้าทั้งหมด', value: totalProducts, icon: Package, color: 'text-taupe-600 bg-cream' },
    { label: 'สต๊อกต่ำ', value: lowStockProducts.length, icon: AlertTriangle, color: 'text-orange-600 bg-orange-50' },
  ];

  const statusLabels: Record<string, string> = {
    pending: 'รอชำระเงิน',
    paid: 'ชำระแล้ว',
    processing: 'กำลังเตรียม',
    shipped: 'จัดส่งแล้ว',
    delivered: 'ส่งถึงแล้ว',
    cancelled: 'ยกเลิก',
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600',
    paid: 'bg-blue-50 text-blue-600',
    processing: 'bg-purple-50 text-purple-600',
    shipped: 'bg-indigo-50 text-indigo-600',
    delivered: 'bg-green-50 text-green-600',
    cancelled: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-rose-100">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-sm text-taupe-400">{s.label}</p>
            <p className="font-prompt text-2xl font-bold text-taupe-600">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-rose-100">
          <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">คำสั่งซื้อล่าสุด</h2>
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-rose-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-taupe-600">#{o.order_number}</p>
                  <p className="text-xs text-taupe-400">{new Date(o.created_at).toLocaleDateString('th-TH')}</p>
                </div>
                <span className="text-sm font-medium text-taupe-600 mr-3">฿{Number(o.total).toLocaleString()}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${statusColors[o.status] || 'bg-cream text-taupe-400'}`}>
                  {statusLabels[o.status] || o.status}
                </span>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-sm text-taupe-400 text-center py-4">ยังไม่มีคำสั่งซื้อ</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-rose-100">
          <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">สินค้าสต๊อกต่ำ</h2>
          <div className="space-y-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-rose-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-10 h-12 rounded-lg overflow-hidden shrink-0 bg-rose-50">
                    <OptimizedImage src={p.images[0]} alt={p.name} width={80} className="w-10 h-12 object-cover" />
                  </div>
                  <span className="text-sm text-taupe-600 line-clamp-1">{p.name}</span>
                </div>
                <span className={`text-sm font-bold ml-3 ${p.stock === 0 ? 'text-rose-500' : 'text-amber-500'}`}>
                  {p.stock === 0 ? 'หมด' : `${p.stock} ชิ้น`}
                </span>
              </div>
            ))}
            {lowStockProducts.length === 0 && <p className="text-sm text-taupe-400 text-center py-4">สินค้าทุกชิ้นมีสต๊อกเพียงพอ</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
