import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../lib/router';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Tag,
  Mail,
  Users,
  FolderTree,
  Menu,
  X,
  LogOut,
  Image as ImageIcon,
  Star,
  Settings,
  Store,
} from 'lucide-react';
import type { Product, Order, Category, ContactMessage } from '../types';

import AdminDashboard from '../components/admin/AdminDashboard';
import AdminProducts from '../components/admin/AdminProducts';
import AdminOrders from '../components/admin/AdminOrders';
import AdminCoupons from '../components/admin/AdminCoupons';
import AdminCategories from '../components/admin/AdminCategories';
import AdminMessages from '../components/admin/AdminMessages';
import AdminCustomers from '../components/admin/AdminCustomers';
import AdminHomepage from '../components/admin/AdminHomepage';
import AdminReviews from '../components/admin/AdminReviews';
import AdminSettings from '../components/admin/AdminSettings';

type Tab =
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'coupons'
  | 'categories'
  | 'customers'
  | 'reviews'
  | 'messages'
  | 'homepage'
  | 'settings';

interface TabDef {
  key: Tab;
  label: string;
  icon: typeof BarChart3;
}

// จัดกลุ่มเมนูให้หาแท็บที่ต้องการง่ายขึ้น แทนที่จะเรียงยาวๆ ทั้งหมดในลิสต์เดียว
const navGroups: { title: string; items: TabDef[] }[] = [
  {
    title: 'ภาพรวมร้านค้า',
    items: [
      { key: 'dashboard', label: 'ภาพรวม', icon: BarChart3 },
      { key: 'orders', label: 'คำสั่งซื้อ', icon: ShoppingCart },
      { key: 'customers', label: 'ลูกค้า', icon: Users },
    ],
  },
  {
    title: 'สินค้า',
    items: [
      { key: 'products', label: 'สินค้า', icon: Package },
      { key: 'categories', label: 'หมวดหมู่', icon: FolderTree },
      { key: 'reviews', label: 'รีวิวสินค้า', icon: Star },
      { key: 'coupons', label: 'คูปอง', icon: Tag },
    ],
  },
  {
    title: 'เนื้อหาหน้าเว็บ',
    items: [
      { key: 'homepage', label: 'หน้าแรก', icon: ImageIcon },
      { key: 'messages', label: 'ข้อความติดต่อ', icon: Mail },
      { key: 'settings', label: 'ตั้งค่าร้านค้า', icon: Settings },
    ],
  },
];

const allTabs = navGroups.flatMap((g) => g.items);

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

  // Initial load: dashboard data (products + orders for stats) + categories.
  // หมวดหมู่ต้องโหลดมาตั้งแต่แรก เพราะฟอร์มเพิ่ม/แก้สินค้าในแท็บ "สินค้า" และ
  // แท็บ "หน้าแรก" (รูปหมวดหมู่) ใช้ dropdown/รายการหมวดหมู่ — ถ้ารอให้โหลดตอนกด
  // แท็บ "หมวดหมู่" เท่านั้น แอดมินที่ยังไม่เคยกดแท็บนั้นจะเจอตัวเลือกว่างเปล่า
  useEffect(() => {
    if (!user || !profile?.is_admin) return;
    (async () => {
      const [prods, ords, cats] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('sort_order'),
      ]);
      setProducts((prods.data as Product[]) || []);
      setOrders((ords.data as Order[]) || []);
      setCategories((cats.data as Category[]) || []);
      setLoading(false);
      setLoadedTabs(new Set(['dashboard', 'products', 'categories', 'homepage']));
    })();
  }, [user, profile?.is_admin]);

  // Lazy-load data when a tab is first opened
  useEffect(() => {
    if (!user || !profile?.is_admin || loadedTabs.has(tab)) return;
    setTabLoading(true);
    (async () => {
      if (tab === 'messages') {
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

  const currentTabLabel = allTabs.find((t) => t.key === tab)?.label || '';

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-rose-100 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent tab={tab} setTab={setTab} profileName={profile.full_name} />
      </aside>

      {/* Sidebar — mobile drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-taupe-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] bg-white border-r border-rose-100 flex flex-col animate-slide-in-left">
            <SidebarContent
              tab={tab}
              setTab={(t) => {
                setTab(t);
                setSidebarOpen(false);
              }}
              profileName={profile.full_name}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-rose-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-taupe-500 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-prompt font-bold text-taupe-600">{currentTabLabel}</span>
          <div className="w-9" />
        </div>

        {/* Desktop header */}
        <div className="hidden lg:block sticky top-0 z-20 bg-cream/80 backdrop-blur-sm px-8 pt-6 pb-2">
          <p className="text-xs text-taupe-400 tracking-wide uppercase">Admin Panel</p>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 lg:pt-2">
          {tabLoading ? (
            <AdminSkeleton />
          ) : (
            <div key={tab} className="animate-fade-up">
              {tab === 'dashboard' && <AdminDashboard products={products} orders={orders} />}
              {tab === 'products' && <AdminProducts products={products} categories={categories} onProductsChange={setProducts} />}
              {tab === 'orders' && <AdminOrders orders={orders} onOrdersChange={setOrders} />}
              {tab === 'coupons' && <AdminCoupons />}
              {tab === 'categories' && <AdminCategories categories={categories} onCategoriesChange={setCategories} />}
              {tab === 'customers' && <AdminCustomers />}
              {tab === 'reviews' && <AdminReviews products={products} />}
              {tab === 'messages' && <AdminMessages messages={messages} onMessagesChange={setMessages} />}
              {tab === 'homepage' && <AdminHomepage categories={categories} />}
              {tab === 'settings' && <AdminSettings />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl skeleton" />
        ))}
      </div>
      <div className="h-64 rounded-2xl skeleton" />
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
      <div className="p-6 border-b border-rose-50 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-rose-500 flex items-center justify-center shrink-0">
          <Store className="w-[18px] h-[18px] text-white" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold text-taupe-600 leading-tight">JNIP Admin</h1>
          <p className="text-xs text-taupe-400">ระบบจัดการร้านค้า</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-4 mb-1.5 text-[11px] font-semibold text-taupe-300 uppercase tracking-wider">{group.title}</p>
            <div className="space-y-1">
              {group.items.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    tab === t.key
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                      : 'text-taupe-400 hover:bg-rose-50 hover:text-rose-500'
                  }`}
                >
                  <t.icon className="w-5 h-5 shrink-0" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
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
