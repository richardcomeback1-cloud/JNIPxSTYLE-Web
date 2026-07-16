import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import type { CartItem, Product } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'jnip_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const user = session?.user ?? null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // เก็บค่า items ล่าสุดไว้ใน ref เพื่อใช้ตอน beforeunload (flush ก่อนปิดแท็บ)
  const itemsRef = useRef(items);
  const userRef = useRef(user);
  const loadedRef = useRef(loaded);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { loadedRef.current = loaded; }, [loaded]);

  // Load cart: from Supabase if logged in, otherwise from localStorage
  useEffect(() => {
    if (user) {
      (async () => {
        const { data } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        if (data) {
          const cartItems: CartItem[] = data.map((r: Record<string, unknown>) => ({
            product_id: r.product_id as string,
            name: r.name as string,
            slug: r.slug as string,
            price: Number(r.price),
            image: (r.image as string) || '',
            size: r.size as string,
            color: r.color as string,
            quantity: r.quantity as number,
            stock: r.stock as number,
          }));
          setItems(cartItems);
        }
        setLoaded(true);
      })();
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setItems(JSON.parse(stored));
      } catch {
        // ignore
      }
      setLoaded(true);
    }
  }, [user]);

  // Persist to localStorage when not logged in
  useEffect(() => {
    if (!user && loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, user, loaded]);

  const addToCart = useCallback(
    (product: Product, size: string, color: string, quantity: number) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.product_id === product.id && i.size === size && i.color === color
        );
        if (existing) {
          return prev.map((i) =>
            i.product_id === product.id && i.size === size && i.color === color
              ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
              : i
          );
        }
        return [
          ...prev,
          {
            product_id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.images[0] || '',
            size,
            color,
            quantity,
            stock: product.stock,
          },
        ];
      });
      setIsOpen(true);
    },
    []
  );

  // ฟังก์ชัน sync จริง — ยิง Promise.all (parallel) แทน sequential loop
  const syncToSupabase = useCallback(async (cartItems: CartItem[], userId: string) => {
    const { data: dbItems } = await supabase
      .from('cart_items')
      .select('id, product_id, size, color, quantity')
      .eq('user_id', userId);

    const dbMap = new Map(
      (dbItems || []).map((r: Record<string, unknown>) => [
        `${r.product_id}_${r.size}_${r.color}`,
        r,
      ])
    );
    const localKeys = new Set(
      cartItems.map((i) => `${i.product_id}_${i.size}_${i.color}`)
    );

    const toDelete = (dbItems || []).filter(
      (r: Record<string, unknown>) => !localKeys.has(`${r.product_id}_${r.size}_${r.color}`)
    );

    const promises: Promise<unknown>[] = [];

    if (toDelete.length > 0) {
      promises.push(
        Promise.resolve(
          supabase
            .from('cart_items')
            .delete()
            .in('id', toDelete.map((r: Record<string, unknown>) => r.id))
        )
      );
    }

    for (const item of cartItems) {
      const key = `${item.product_id}_${item.size}_${item.color}`;
      const existing = dbMap.get(key) as Record<string, unknown> | undefined;
      if (existing) {
        if (existing.quantity !== item.quantity) {
          promises.push(
            Promise.resolve(
              supabase
                .from('cart_items')
                .update({ quantity: item.quantity })
                .eq('id', existing.id as string)
            )
          );
        }
      } else {
        promises.push(
          Promise.resolve(
            supabase.from('cart_items').upsert({
              user_id: userId,
              product_id: item.product_id,
              name: item.name,
              slug: item.slug,
              price: item.price,
              image: item.image,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              stock: item.stock,
            }, { onConflict: 'user_id,product_id,size,color' })
          )
        );
      }
    }

    await Promise.all(promises);
  }, []);

  // Debounce sync — หน่วง 500ms ก่อนยิงจริง ส่วน setItems (UI) ทำทันทีแบบ optimistic
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || !loaded) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(() => {
      syncToSupabase(items, user.id);
    }, 500);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [items, user, loaded, syncToSupabase]);

  // Flush ก่อนปิดแท็บ/เปลี่ยนหน้า — กันข้อมูลหายถ้ากด +/- แล้วปิดทันทีก่อน debounce ทำงาน
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        if (loadedRef.current && userRef.current && itemsRef.current.length > 0) {
          // ยิง sync แบบ synchronous ผ่าน sendBeacon ไม่ได้กับ Supabase SDK
          // แต่อย่างน้อยยิง fetch ไว้ ถ้า browser ยอมรอ
          syncToSupabase(itemsRef.current, userRef.current.id);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncToSupabase]);

  const removeFromCart = useCallback((productId: string, size: string, color: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product_id === productId && i.size === size && i.color === color))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: string, color: string, quantity: number) => {
      if (quantity < 1) return;
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === productId && i.size === size && i.color === color
            ? { ...i, quantity: Math.min(quantity, i.stock) }
            : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // สำคัญมาก: ต้อง useMemo ค่า value ตรงนี้ เพราะถ้าใส่ object literal ตรง ๆ
  // จะได้ object ใหม่ทุกครั้งที่ CartProvider re-render (เช่นแค่เปิด/ปิดตะกร้า)
  // แล้วทุก component ที่เรียก useCart() (Header, ProductCard ทุกใบ, CartDrawer)
  // จะ re-render ตามหมด ทั้งที่ field ที่ตัวเองใช้ไม่ได้เปลี่ยนเลย
  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      subtotal,
      isOpen,
      setIsOpen,
    }),
    [items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
