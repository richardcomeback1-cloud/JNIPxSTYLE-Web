import { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, ShoppingBag, User, ChevronDown, CornerDownRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { navigate } from '../lib/router';
import { CATEGORIES, SHORTCUT_CATEGORIES } from '../lib/categories';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';
import OptimizedImage from './OptimizedImage';

export default function Header() {
  const { totalItems, setIsOpen } = useCart();
  const { user, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [mobileCatOpen, setMobileCatOpen] = useState<string | null>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, images, price, compare_at_price')
        .ilike('name', `%${searchQuery.trim()}%`)
        .limit(5);
      setSuggestions((data as Product[]) || []);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setSuggestions([]);
    }
  };

  const navLink = (path: string, label: string) => (
    <button
      onClick={() => navigate(path)}
      className="text-taupe-500 hover:text-rose-500 transition-colors duration-200 text-sm font-medium tracking-wide relative group"
    >
      {label}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-rose-500 transition-all duration-300 group-hover:w-full" />
    </button>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-md border-b border-rose-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl lg:text-2xl font-bold text-taupe-500 tracking-tight">
                  JNIP <span className="text-rose-500">X</span> Style
                </span>
                <span className="text-[9px] lg:text-[10px] tracking-[0.3em] text-taupe-400 uppercase">
                  Define Your Style
                </span>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLink('/', 'หน้าแรก')}
              <div ref={catRef} className="relative">
                <button
                  onClick={() => setCatOpen(!catOpen)}
                  className="flex items-center gap-1 text-taupe-500 hover:text-rose-500 transition-colors text-sm font-medium tracking-wide"
                >
                  หมวดหมู่สินค้า
                  <ChevronDown className={`w-4 h-4 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                </button>
                <div
                  className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] bg-white rounded-2xl shadow-xl border border-rose-100 py-3 origin-top transition-all duration-200 ease-out ${
                    catOpen
                      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                  }`}
                >
                  <div className="px-4 pb-2 mb-1 border-b border-rose-50">
                    <p className="text-xs uppercase tracking-wider text-rose-500 font-medium">หมวดหมู่สินค้า</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 px-2">
                    {CATEGORIES.map((cat) => (
                      <div key={cat.slug} className="py-1">
                        <button
                          onClick={() => {
                            navigate(`/category/${cat.slug}`);
                            setCatOpen(false);
                          }}
                          className="block w-full text-left px-3 py-1.5 text-sm font-medium text-taupe-600 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                        >
                          {cat.name}
                        </button>
                        <div className="pl-3 space-y-0.5">
                          {cat.subCategories.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => {
                                navigate(`/category/${cat.slug}?sub=${encodeURIComponent(sub)}`);
                                setCatOpen(false);
                              }}
                              className="flex items-center gap-1 w-full text-left px-3 py-1 text-xs text-taupe-400 hover:text-rose-500 transition-colors"
                            >
                              <CornerDownRight className="w-3 h-3 shrink-0 opacity-50" />
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pt-2 mt-1 border-t border-rose-50">
                    <div className="flex gap-2">
                      {SHORTCUT_CATEGORIES.map((sc) => (
                        <button
                          key={sc.slug}
                          onClick={() => {
                            navigate(`/category/${sc.slug}`);
                            setCatOpen(false);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-rose-500 bg-rose-50 rounded-full hover:bg-rose-100 transition-colors"
                        >
                          {sc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {navLink('/promotion', 'โปรโมชั่น')}
              {navLink('/about', 'เกี่ยวกับเรา')}
              {navLink('/contact', 'ติดต่อเรา')}
              {profile?.is_admin && navLink('/admin', 'แอดมิน')}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-taupe-500 hover:text-rose-500 transition-colors"
                aria-label="ค้นหา"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(user ? '/account' : '/login')}
                className="p-2 text-taupe-500 hover:text-rose-500 transition-colors hidden sm:block"
                aria-label="บัญชีผู้ใช้"
              >
                <User className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-taupe-500 hover:text-rose-500 transition-colors relative"
                aria-label="ตะกร้าสินค้า"
              >
                <ShoppingBag className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 text-taupe-500 hover:text-rose-500 transition-colors lg:hidden"
                aria-label="เมนู"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar with Autosuggest */}
        {searchOpen && (
          <div ref={searchRef} className="absolute top-full left-0 right-0 bg-white border-b border-rose-100 shadow-lg animate-fade-in">
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาสินค้า..."
                    autoFocus
                    className="w-full px-4 py-3 bg-cream rounded-full border border-rose-200 focus:outline-none focus:border-rose-400 text-taupe-500"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden z-10">
                      {suggestions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            navigate(`/product/${p.slug}`);
                            setSearchOpen(false);
                            setSearchQuery('');
                            setSuggestions([]);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-rose-50 transition-colors text-left"
                        >
                          <OptimizedImage src={(p.images?.[0]) || ''} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-taupe-600 truncate">{p.name}</p>
                            <p className="text-xs text-rose-500">฿{Number(p.price).toLocaleString()}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="px-6 py-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors font-medium">
                  ค้นหา
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-cream border-t border-rose-100 animate-fade-in">
            <nav className="px-4 py-4 space-y-3">
              <button onClick={() => { navigate('/'); setMobileOpen(false); }} className="block w-full text-left py-2 text-taupe-500 font-medium">
                หน้าแรก
              </button>
              <div className="py-2">
                <p className="text-taupe-400 text-xs uppercase tracking-wider mb-2">หมวดหมู่สินค้า</p>
                {CATEGORIES.map((cat) => (
                  <div key={cat.slug}>
                    <button
                      onClick={() => setMobileCatOpen(mobileCatOpen === cat.slug ? null : cat.slug)}
                      className="flex items-center justify-between w-full text-left py-1.5 text-sm text-taupe-500 font-medium"
                    >
                      {cat.name}
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileCatOpen === cat.slug ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileCatOpen === cat.slug && (
                      <div className="pl-4 pb-1">
                        {cat.subCategories.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => { navigate(`/category/${cat.slug}?sub=${encodeURIComponent(sub)}`); setMobileOpen(false); }}
                            className="block w-full text-left py-1 text-xs text-taupe-400 hover:text-rose-500"
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SHORTCUT_CATEGORIES.map((sc) => (
                    <button
                      key={sc.slug}
                      onClick={() => { navigate(`/category/${sc.slug}`); setMobileOpen(false); }}
                      className="px-3 py-1 text-xs font-medium text-rose-500 bg-rose-50 rounded-full"
                    >
                      {sc.name}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { navigate('/promotion'); setMobileOpen(false); }} className="block w-full text-left py-2 text-taupe-500 font-medium">
                โปรโมชั่น
              </button>
              <button onClick={() => { navigate('/about'); setMobileOpen(false); }} className="block w-full text-left py-2 text-taupe-500 font-medium">
                เกี่ยวกับเรา
              </button>
              <button onClick={() => { navigate('/contact'); setMobileOpen(false); }} className="block w-full text-left py-2 text-taupe-500 font-medium">
                ติดต่อเรา
              </button>
              {profile?.is_admin && (
                <button onClick={() => { navigate('/admin'); setMobileOpen(false); }} className="block w-full text-left py-2 text-rose-500 font-bold">
                  แอดมิน
                </button>
              )}
              <button onClick={() => { navigate(user ? '/account' : '/login'); setMobileOpen(false); }} className="block w-full text-left py-2 text-taupe-500 font-medium">
                {user ? 'บัญชีของฉัน' : 'เข้าสู่ระบบ / สมัครสมาชิก'}
              </button>
            </nav>
          </div>
        )}
      </header>
      <div className="h-16 lg:h-20" />
    </>
  );
}
