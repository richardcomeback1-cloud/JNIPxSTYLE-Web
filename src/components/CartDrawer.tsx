import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { navigate } from '../lib/router';
import OptimizedImage from './OptimizedImage';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-taupe-900/40 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-cream z-50 shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-500" />
            <h2 className="font-prompt text-lg font-bold text-taupe-500">
              ตะกร้าสินค้า {totalItems > 0 && `(${totalItems})`}
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-taupe-400 hover:text-rose-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 text-rose-300" />
              </div>
              <p className="text-taupe-400 font-medium mb-1">ยังไม่มีสินค้าในตะกร้า</p>
              <p className="text-sm text-taupe-300 mb-4">เริ่มเลือกซื้อสินค้าที่คุณชื่นชอบได้เลย</p>
              <button
                onClick={() => { setIsOpen(false); navigate('/shop'); }}
                className="px-6 py-2.5 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
              >
                เลือกซื้อสินค้า
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product_id}-${item.size}-${item.color}`}
                  className="flex gap-3 bg-white rounded-xl p-3 border border-rose-100"
                >
                  <OptimizedImage
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-24 object-cover rounded-lg cursor-pointer"
                    onClick={() => { setIsOpen(false); navigate(`/product/${item.slug}`); }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-sm font-medium text-taupe-500 line-clamp-2 cursor-pointer hover:text-rose-500"
                      onClick={() => { setIsOpen(false); navigate(`/product/${item.slug}`); }}
                    >
                      {item.name}
                    </h3>
                    <p className="text-xs text-taupe-400 mt-0.5">
                      ไซส์: {item.size} | สี: {item.color}
                    </p>
                    <p className="text-sm font-bold text-taupe-600 mt-1">
                      ฿{item.price.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-rose-50 rounded-full px-1">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-taupe-500 hover:text-rose-500"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.size, item.color, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-taupe-500 hover:text-rose-500"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product_id, item.size, item.color)}
                        className="p-1.5 text-taupe-300 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-rose-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-taupe-400 text-sm">ยอดรวม</span>
              <span className="font-prompt text-xl font-bold text-taupe-600">
                ฿{subtotal.toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => { setIsOpen(false); navigate('/cart'); }}
              className="w-full py-3 border border-taupe-400 text-taupe-500 rounded-full text-sm font-medium hover:bg-taupe-50 transition-colors"
            >
              ดูตะกร้าสินค้า
            </button>
            <button
              onClick={() => { setIsOpen(false); navigate('/checkout'); }}
              className="w-full py-3 bg-rose-500 text-white rounded-full text-sm font-medium hover:bg-rose-600 transition-colors"
            >
              ดำเนินการชำระเงิน
            </button>
          </div>
        )}
      </div>
    </>
  );
}
