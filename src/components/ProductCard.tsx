import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '../types';
import OptimizedImage from './OptimizedImage';
import { useCart } from '../context/CartContext';
import { navigate } from '../lib/router';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const [liked, setLiked] = useState(false);

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, product.sizes[0] || 'ฟรีไซส์', product.colors[0] || '-', 1);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.slug}`)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-rose-100 hover:shadow-xl hover:border-rose-200 transition-shadow duration-300"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-rose-50">
        <OptimizedImage
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new && (
            <span className="bg-taupe-500 text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
              มาใหม่
            </span>
          )}
          {discount > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
              -{discount}%
            </span>
          )}
        </div>
        {/* Wishlist */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          aria-label="ถูกใจ"
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : 'text-taupe-400'}`} />
        </button>
        {/* Quick Add */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleQuickAdd}
            className="w-full bg-taupe-500/95 backdrop-blur-sm text-white py-2.5 rounded-full text-sm font-medium hover:bg-rose-500 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            หยิบใส่ตะกร้า
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1 mb-1.5">
          <Star className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
          <span className="text-xs text-taupe-400">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-taupe-300">({product.review_count})</span>
          <span className="text-xs text-taupe-300 ml-auto">ขายแล้ว {product.sold_count}</span>
        </div>
        <h3 className="text-sm font-medium text-taupe-500 line-clamp-2 mb-2 group-hover:text-rose-500 transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-prompt font-bold text-taupe-600">
            ฿{product.price.toLocaleString()}
          </span>
          {product.compare_at_price && (
            <span className="text-xs text-taupe-300 line-through">
              ฿{product.compare_at_price.toLocaleString()}
            </span>
          )}
        </div>
        {product.stock <= 10 && product.stock > 0 && (
          <p className="text-xs text-rose-500 mt-1">เหลือสินค้า {product.stock} ชิ้น</p>
        )}
        {product.stock === 0 && <p className="text-xs text-rose-500 mt-1">สินค้าหมด</p>}
      </div>
    </div>
  );
}
