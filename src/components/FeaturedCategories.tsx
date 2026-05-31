import { ShoppingCart, Heart, Plus, Minus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import LazyImage from './LazyImage';
import Confetti from './Confetti';
import type { Category, Product } from '../types';
import { useCardDesign, getCardStyles } from '../hooks/useCardDesign';
import { objectToArray } from '../utils/publishedData';

interface FeaturedCategoriesProps {
  onNavigate: (page: 'shop', categoryId?: string) => void;
  onAddToCart: (product: Product) => void;
  onCartClick: () => void;
  onProductClick: (product: Product) => void;
}

interface CategoryWithProducts {
  category: Category;
  products: Product[];
}

export default function FeaturedCategories({ onNavigate, onAddToCart, onCartClick, onProductClick }: FeaturedCategoriesProps) {
  const { data: publishedData } = usePublishedData();
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [confettiActive, setConfettiActive] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 50, y: 50 });
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const { isInCart, addToCart, getItemQuantity, getCartItemId, updateQuantity } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { design } = useCardDesign('shop_by_category');
  const cardStyles = getCardStyles(design);

  const handleAddToCart = useCallback((product: Product, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    setConfettiOrigin({ x, y });
    setConfettiActive(true);
    addToCart(product);
  }, [addToCart]);

  useEffect(() => {
    if (!publishedData) {
      setLoading(false);
      return;
    }

    try {
      const categoriesArray: Category[] = objectToArray<Category>(publishedData.categories);
      const productsArray: Product[] = objectToArray<Product>(publishedData.products);

      const featuredCategories = categoriesArray.filter(cat => cat.featured === true);

      const categoriesWithProds: CategoryWithProducts[] = featuredCategories.map(category => ({
        category,
        products: productsArray.filter(product => {
          if (product.category_ids && product.category_ids.length > 0) {
            return product.category_ids.includes(category.id);
          }
          return product.category_id === category.id;
        }).slice(0, 4)
      })).filter(item => item.products.length > 0);

      setCategoriesWithProducts(categoriesWithProds);
      setLoading(false);
    } catch (error) {
      console.error('Error processing featured categories:', error);
      setLoading(false);
    }
  }, [publishedData]);

  if (loading || categoriesWithProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-12 bg-gradient-to-b from-white to-teal-50">
      {categoriesWithProducts.map(({ category, products }) => (
        <div key={category.id} className="mb-16 last:mb-0">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {category.name}
              </h2>
              {category.description && (
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">{category.description}</p>
              )}
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
                    style={{ ...cardStyles.style, animationDelay: `${index * 80}ms` }}
                    onClick={() => onProductClick(product)}
                  >
                    <div className="relative aspect-square overflow-hidden bg-gray-50" style={cardStyles.imageStyle}>
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
                        className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/90 p-1.5 rounded-full"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                            isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                          }`}
                        />
                      </button>
                      {product.sizes && product.sizes.length > 0 && (
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-1.5 py-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-1 overflow-x-auto no-scrollbar">
                            {product.sizes.map((size) => (
                              <button
                                key={size}
                                onClick={() => setSelectedSizes(prev => ({ ...prev, [product.id]: size }))}
                                className={`flex-shrink-0 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-medium transition-colors ${
                                  (selectedSizes[product.id] || product.sizes![0]) === size
                                    ? 'bg-white text-gray-900'
                                    : 'bg-white/30 text-white'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 sm:p-3">
                      <h3 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2 mb-1.5">
                        {product.name}
                      </h3>

                      <div className="flex items-baseline gap-1.5 mb-2.5">
                        {(() => {
                          const activeSize = selectedSizes[product.id] || (product.sizes && product.sizes[0]) || '';
                          const sizePrice = activeSize && product.size_pricing?.[activeSize];
                          return (
                            <>
                              <span className="text-sm sm:text-base font-bold text-gray-900">
                                ₹{sizePrice ? sizePrice.price : product.price}
                              </span>
                              {(sizePrice?.compare_at_price || (product.compare_at_price && product.compare_at_price > product.price)) && (
                                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                                  ₹{sizePrice?.compare_at_price || product.compare_at_price}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <div>
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
                              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-teal-700 hover:text-red-500 transition-colors rounded-full"
                            >
                              <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                            <span className="text-xs sm:text-sm font-bold text-teal-800 min-w-[16px] text-center">{qty}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product, e);
                              }}
                              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-teal-700 hover:text-teal-900 transition-colors rounded-full"
                            >
                              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product, e);
                            }}
                            className="w-full flex items-center justify-center gap-1 bg-teal-600 text-white rounded-full h-8 sm:h-9 text-[11px] sm:text-xs font-medium hover:bg-teal-700 transition-colors active:scale-[0.97]"
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => onNavigate('shop', category.id)}
                className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
              >
                View All {category.name}
              </button>
            </div>
          </div>
        </div>
      ))}

      <Confetti
        isActive={confettiActive}
        originX={confettiOrigin.x}
        originY={confettiOrigin.y}
        onComplete={() => setConfettiActive(false)}
      />
    </div>
  );
}
