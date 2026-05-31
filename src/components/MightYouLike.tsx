import { Heart, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import type { Product } from '../types';
import LazyImage from './LazyImage';
import { useCardDesign, getCardStyles } from '../hooks/useCardDesign';
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
  const { design } = useCardDesign('might_you_like');
  const cardStyles = getCardStyles(design);

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
    <div className="py-12 bg-gradient-to-b from-white to-teal-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">You Might Also Like</h2>
          <p className="text-gray-600 text-lg">Handpicked recommendations just for you</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {products.map((product) => {
            const inCart = isInCart(product.id);
            const qty = getItemQuantity(product.id);
            const cartItemId = getCartItemId(product.id);

            return (
              <div
                key={product.id}
                className={cardStyles.container}
                onClick={() => onProductClick(product)}
              >
                <div className="relative">
                  <LazyImage
                    src={product.image_url}
                    alt={product.name}
                    className={cardStyles.image}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product);
                    }}
                    className="absolute top-2 right-2 bg-white/90 p-1.5 sm:p-2 rounded-full hover:bg-white transition-all"
                  >
                    <Heart
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                      }`}
                    />
                  </button>
                </div>

                <div className={cardStyles.content}>
                  <h3 className={cardStyles.title}>{product.name}</h3>

                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={cardStyles.price}>₹{product.price}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className={cardStyles.comparePrice}>₹{product.compare_at_price}</span>
                    )}
                  </div>

                  <div className="mt-3">
                    {inCart && qty > 0 ? (
                      <div
                        className="flex items-center justify-between bg-gray-50 rounded-full border border-gray-200 h-9 sm:h-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (cartItemId) {
                              if (qty <= 1) {
                                updateQuantity(cartItemId, 0);
                              } else {
                                updateQuantity(cartItemId, qty - 1);
                              }
                            }
                          }}
                          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                        >
                          <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <span className="text-sm sm:text-base font-bold text-gray-900 min-w-[20px] text-center">{qty}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                          }}
                          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:text-teal-600 transition-colors rounded-full hover:bg-teal-50"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white rounded-full h-9 sm:h-10 text-xs sm:text-sm font-medium hover:bg-gray-800 transition-all active:scale-[0.97]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
