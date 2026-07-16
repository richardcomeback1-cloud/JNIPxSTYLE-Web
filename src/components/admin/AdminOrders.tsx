import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Truck, MapPin, CreditCard, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Order, OrderItem } from '../../types';
import OptimizedImage from '../OptimizedImage';

const PAGE_SIZE = 15;

interface Props {
  orders: Order[];
  onOrdersChange: (orders: Order[]) => void;
}

const statusLabels: Record<string, string> = {
  pending: 'รอชำระเงิน',
  paid: 'ชำระแล้ว',
  processing: 'กำลังเตรียมสินค้า',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ส่งถึงแล้ว',
  cancelled: 'ยกเลิก',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-200',
  paid: 'bg-blue-50 text-blue-600 border-blue-200',
  processing: 'bg-purple-50 text-purple-600 border-purple-200',
  shipped: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  delivered: 'bg-green-50 text-green-600 border-green-200',
  cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
};

const paymentLabels: Record<string, string> = {
  cod: 'เก็บเงินปลายทาง',
  transfer: 'โอนผ่านธนาคาร',
  promptpay: 'พร้อมเพย์',
};

export default function AdminOrders({ orders, onOrdersChange }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = orders;
    if (filterStatus !== 'all') result = result.filter((o) => o.status === filterStatus);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.shipping_address?.fullName?.toLowerCase().includes(q) ||
          o.shipping_address?.phone?.includes(q)
      );
    }
    return result;
  }, [orders, filterStatus, search]);

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    if (!orderItems[orderId]) {
      const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId);
      setOrderItems((prev) => ({ ...prev, [orderId]: (data as OrderItem[]) || [] }));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { alert('อัปเดตไม่สำเร็จ: ' + error.message); return; }
    onOrdersChange(orders.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const updateTracking = async (id: string, trackingNumber: string) => {
    const { error } = await supabase.from('orders').update({ tracking_number: trackingNumber }).eq('id', id);
    if (error) { alert('บันทึกไม่สำเร็จ: ' + error.message); return; }
    onOrdersChange(orders.map((o) => (o.id === id ? { ...o, tracking_number: trackingNumber } : o)));
  };

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div>
      <h2 className="font-prompt text-lg font-bold text-taupe-600 mb-4">คำสั่งซื้อทั้งหมด ({orders.length})</h2>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setFilterStatus('all'); setPage(0); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === 'all' ? 'bg-rose-500 text-white' : 'bg-white text-taupe-400 border border-rose-200'}`}
        >
          ทั้งหมด ({orders.length})
        </button>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setFilterStatus(key); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterStatus === key ? 'bg-rose-500 text-white' : 'bg-white text-taupe-400 border border-rose-200'}`}
          >
            {label} ({orders.filter((o) => o.status === key).length})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="ค้นหาด้วยเลขคำสั่งซื้อ, ชื่อ, หรือเบอร์โทร..."
          className="w-full px-4 py-2.5 border border-rose-200 rounded-full bg-white text-sm text-taupe-500 focus:outline-none focus:border-rose-400"
        />
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {pageItems.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
            {/* Order header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-cream/30 transition-colors"
              onClick={() => toggleExpand(o.id)}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="min-w-0">
                  <p className="font-medium text-taupe-600 text-sm">#{o.order_number}</p>
                  <p className="text-xs text-taupe-400">{new Date(o.created_at).toLocaleString('th-TH')}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColors[o.status] || 'bg-cream text-taupe-400 border-rose-100'}`}>
                  {statusLabels[o.status] || o.status}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-prompt text-lg font-bold text-taupe-600 hidden sm:block">฿{Number(o.total).toLocaleString()}</span>
                {expandedId === o.id ? <ChevronUp className="w-5 h-5 text-taupe-300" /> : <ChevronDown className="w-5 h-5 text-taupe-300" />}
              </div>
            </div>

            {/* Expanded detail */}
            {expandedId === o.id && (
              <div className="border-t border-rose-50 p-4 space-y-4">
                {/* Shipping address */}
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-taupe-500">
                    <p className="font-medium text-taupe-600 mb-1">ที่อยู่จัดส่ง</p>
                    <p>{o.shipping_address?.fullName || '-'} · {o.shipping_address?.phone || '-'}</p>
                    <p>{o.shipping_address?.address} {o.shipping_address?.floorRoom}</p>
                    <p>{o.shipping_address?.district} {o.shipping_address?.province} {o.shipping_address?.postalCode}</p>
                  </div>
                </div>

                {/* Payment info */}
                <div className="flex gap-3">
                  <CreditCard className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-taupe-500">
                    <p className="font-medium text-taupe-600 mb-1">การชำระเงิน</p>
                    <p>{paymentLabels[o.payment_method] || o.payment_method}</p>
                    <p>สถานะ: {o.payment_status === 'paid' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}</p>
                    {o.coupon_code && <p>คูปอง: {o.coupon_code}</p>}
                  </div>
                </div>

                {/* Order items */}
                <div className="flex gap-3">
                  <Package className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-taupe-600 mb-2 text-sm">สินค้าในคำสั่งซื้อ</p>
                    <div className="space-y-2">
                      {(orderItems[o.id] || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-sm">
                          <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0 bg-rose-50">
                            <OptimizedImage src={item.product_image || ''} alt={item.product_name} width={100} className="w-12 h-14 object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-taupe-600 line-clamp-1">{item.product_name}</p>
                            <p className="text-xs text-taupe-400">{item.size && `ไซส์: ${item.size}`} {item.color && `· สี: ${item.color}`}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-taupe-600">฿{Number(item.unit_price).toLocaleString()} × {item.quantity}</p>
                            <p className="text-xs text-taupe-400">฿{Number(item.subtotal).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {(!orderItems[o.id] || orderItems[o.id].length === 0) && (
                        <p className="text-taupe-400 text-sm">กำลังโหลด...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price summary */}
                <div className="bg-cream rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between text-taupe-400">
                    <span>ยอดสินค้า</span><span>฿{Number(o.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-taupe-400">
                    <span>ค่าจัดส่ง</span><span>฿{Number(o.shipping_cost).toLocaleString()}</span>
                  </div>
                  {Number(o.discount) > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>ส่วนลด</span><span>-฿{Number(o.discount).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-taupe-600 pt-1 border-t border-rose-100">
                    <span>รวมทั้งสิ้น</span><span>฿{Number(o.total).toLocaleString()}</span>
                  </div>
                </div>

                {/* Tracking number */}
                <div className="flex gap-2 items-center">
                  <Truck className="w-5 h-5 text-rose-400 shrink-0" />
                  <input
                    type="text"
                    defaultValue={o.tracking_number || ''}
                    placeholder="เลขพัสดุ..."
                    onBlur={(e) => { if (e.target.value !== (o.tracking_number || '')) updateTracking(o.id, e.target.value); }}
                    className="flex-1 px-3 py-2 border border-rose-200 rounded-lg bg-white text-sm text-taupe-500 focus:outline-none focus:border-rose-400"
                  />
                </div>

                {/* Status control */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-taupe-400 shrink-0">เปลี่ยนสถานะ:</span>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="text-sm px-3 py-2 border border-rose-200 rounded-full bg-white text-taupe-500 focus:outline-none focus:border-rose-400 cursor-pointer"
                  >
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {o.notes && (
                  <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
                    <span className="font-medium">หมายเหตุจากลูกค้า: </span>{o.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-taupe-400 text-center py-12">ไม่พบคำสั่งซื้อ</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 rounded-lg border border-rose-200 text-taupe-500 disabled:opacity-30 hover:bg-cream transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-taupe-500 px-2">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-lg border border-rose-200 text-taupe-500 disabled:opacity-30 hover:bg-cream transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
