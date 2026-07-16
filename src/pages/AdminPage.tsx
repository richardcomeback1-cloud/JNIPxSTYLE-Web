import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../lib/router';
import { BarChart3, Package, ShoppingCart, Tag, Mail, Users, FolderTree, Menu, X, LogOut } from 'lucide-react';
import type { Product, Order, Category, ContactMessage } from '../types';

import AdminDashboard from '../components/admin/AdminDashboard';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import AdminCoupons from '../components/admin/AdminCoupons';
import AdminCategories from '../components/admin/AdminCategories';
import AdminMessages from '../components/admin/AdminMessages';
import AdminCustomers from '../components/admin/AdminCustomers';

type Tab = 'dashboard' | 'products' | 'orders' | 'coupons' | 'categories' | 'messages' | 'customers';

const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: 'dashboard', label: 'ภาพรวม', icon: BarChart3 },
  { key: 'products', label: 'สินค้า', icon: Package },
  { key: 'orders', label: 'คำสั่งซื้อ', icon: ShoppingCart },
  { key: 'coupons', label: 'คูปอง', icon: Tag },
  { key: 'categories', label: 'หมวดหมู่', icon: FolderTree },
  { key: 'customers', label: 'ลูกค้า', icon: Users },
  { key: 'messages', label: 'ข้อความติดต่อ', icon: Mail },
];

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set());
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user && profile && !profile.is_admin) {
      navigate('/');
    } else if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, profile, authLoading]);

  // Initial load: only dashboard data (products + orders for stats)
  useEffect(() => {
    if (!user || !profile?.is_admin) return;
    (async () => {
      const [prods, ords] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
      ]);
      setProducts((prods.data as Product[]) || []);
      setOrders((ords.data as Order[]) || []);
      setLoading(false);
      setLoadedTabs(new Set(['dashboard', 'products']));
    })();
  }, [user, profile?.is_admin]);

  // Lazy-load data when a tab is first opened
  useEffect(() => {
    if (!user || !profile?.is_admin || loadedTabs.has(tab)) return;
    setTabLoading(true);
    (async () => {
      if (tab === 'categories') {
        const { data } = await supabase.from('categories').select('*').order('sort_order');
        setCategories((data as Category[]) || []);
      } else if (tab === 'messages') {
        const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(50);
        setMessages((data as ContactMessage[]) || []);
      }
      setLoadedTabs((prev) => new Set(prev).add(tab));
      setTabLoading(false);
    })();
  }, [tab, user, profile?.is_admin, loadedTabs]);

  if (authLoading || loading || (user && !profile)) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-taupe-400">กำลังโหลด...</div>;
  }

  if (!user || !profile?.is_admin) return null;

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-rose-100 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent tab={tab} setTab={setTab} profileName={profile.full_name} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-taupe-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white border-r border-rose-100 flex flex-col animate-fade-in">
            <SidebarContent tab={tab} setTab={(t) => { setTab(t); setSidebarOpen(false); }} profileName={profile.full_name} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-rose-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-taupe-500 hover:text-rose-500">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-prompt font-bold text-taupe-600">Admin Panel</span>
          <div className="w-9" />
        </div>

        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          {tabLoading ? (
            <div className="text-center text-taupe-400 py-20">กำลังโหลด...</div>
          ) : (
            <>
          {tab === 'dashboard' && <AdminDashboard products={products} orders={orders} />}
          {tab === 'products' && <AdminProducts products={products} categories={categories} onProductsChange={setProducts} />}
          {tab === 'orders' && <AdminOrders orders={orders} onOrdersChange={setOrders} />}
          {tab === 'coupons' && <AdminCoupons />}
          {tab === 'categories' && <AdminCategories categories={categories} onCategoriesChange={setCategories} />}
          {tab === 'customers' && <AdminCustomers />}
          {tab === 'messages' && <AdminMessages messages={messages} onMessagesChange={setMessages} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ tab, setTab, profileName }: { tab: Tab; setTab: (t: Tab) => void; profileName: string | null }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <>
      <div className="p-6 border-b border-rose-50">
        <h1 className="font-serif text-xl font-bold text-taupe-600">JNIP Admin</h1>
        <p className="text-xs text-taupe-400 mt-1">ระบบจัดการร้านค้า</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-rose-500 text-white' : 'text-taupe-400 hover:bg-rose-50 hover:text-rose-500'
            }`}
          >
            <t.icon className="w-5 h-5 shrink-0" />
            {t.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-rose-50">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-taupe-400">เข้าสู่ระบบในฐานะ</p>
          <p className="text-sm font-medium text-taupe-600 line-clamp-1">{profileName || 'Admin'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-taupe-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          ออกจากระบบ
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-taupe-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"
        >
          <X className="w-5 h-5 shrink-0" />
          กลับหน้าร้าน
        </button>
      </div>
    </>
  );
}
