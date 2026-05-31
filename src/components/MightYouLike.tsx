import { Heart, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import type { Product } from '../types';
import LazyImage from './LazyImage';
import { objectToArray } from '../utils/publishedData';

interface MightYouLikeProps {
  onProductClick: (product: Product) => void;
  onCartClick: () => void;
}

export default function MightYouLike({ onProductClick, onCartClick }: MightYouLikeProps) {
  const { data: publishedData } = usePublishedData();
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart, isInCart, getItemQuantity, getCartItemId, updateQuantity } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    if (!publishedData?.products) return;

    const productsArray: Product[] = objectToArray<Product>(publishedData.products);
    const mightYouLikeProducts = productsArray.filter(p => p.might_you_like).slice(0, 8);
    setProducts(mightYouLikeProducts);
  }, [publishedData]);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gradient-to-b from-white to-teal-50/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-xs font-semibold text-teal-600 tracking-widest uppercase">Curated</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mt-2">You Might Also Like</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {products.map((product, index) => {
            const inCart = isInCart(product.id);
            const qty = getItemQuantity(product.id);
            const cartItemId = getCartItemId(product.id);
            const discount = product.compare_at_price && product.compare_at_price > product.price
              ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
              : 0;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer"
                style={{ animationDelay: `${index * 80}ms` }}
                onClick={() => onProductClick(product)}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-50">
                  <LazyImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {discount > 0 && (
                    <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      {discount}% OFF
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product);
                    }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/90 p-1.5 rounded-full hover:bg-white transition-all"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                        isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-2.5 sm:p-3">
                  <h3 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2 mb-1.5">
                    {product.name}
                  </h3>

                  <div className="flex items-baseline gap-1.5 mb-2.5">
                    <span className="text-sm sm:text-base font-bold text-gray-900">₹{product.price}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-[10px] sm:text-xs text-gray-400 line-through">₹{product.compare_at_price}</span>
                    )}
                  </div>

                  {inCart && qty > 0 ? (
                    <div
                      className="flex items-center justify-between bg-teal-50 rounded-full border border-teal-200 h-8 sm:h-9"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (cartItemId) {
                            if (qty <= 1) updateQuantity(cartItemId, 0);
                            else updateQuantity(cartItemId, qty - 1);
                          }
                        }}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-teal-700 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                      >
                        <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                      <span className="text-xs sm:text-sm font-bold text-teal-800 min-w-[16px] text-center">{qty}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-teal-700 hover:text-teal-900 transition-colors rounded-full hover:bg-teal-100"
                      >
                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      className="w-full flex items-center justify-center gap-1 bg-teal-600 text-white rounded-full h-8 sm:h-9 text-[11px] sm:text-xs font-medium hover:bg-teal-700 transition-all active:scale-[0.97]"
                    >
                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
