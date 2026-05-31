import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Heart, Plus, Minus } from 'lucide-react';
import { Product, Category, HomepageSection } from '../types';
import { usePublishedData } from '../contexts/PublishedDataContext';
import LazyImage from './LazyImage';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCardDesign, getCardStyles } from '../hooks/useCardDesign';

interface DynamicSectionProps {
  section: HomepageSection;
  onProductClick?: (product: Product) => void;
  onCategoryClick?: (categoryId: string) => void;
}

export default function DynamicSection({ section, onProductClick, onCategoryClick }: DynamicSectionProps) {
  const { data: publishedData } = usePublishedData();
  const [items, setItems] = useState<(Product | Category)[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart, isInCart, getItemQuantity, getCartItemId, updateQuantity } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const { design } = useCardDesign(`custom_${section.id}`);
  const cardStyles = getCardStyles(design);

  useEffect(() => {
    fetchItems();
  }, [section, publishedData]);

  const fetchItems = async () => {
    if (!publishedData) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const itemsData: (Product | Category)[] = [];

      const selectedItems = section.selected_items || [];
      const dataSource = section.content_type === 'product' ? publishedData.products : publishedData.categories;

      if (dataSource) {
        for (const itemId of selectedItems) {
          if (dataSource[itemId]) {
            itemsData.push({ id: itemId, ...dataSource[itemId] });
          }
        }
      }

      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (section.display_type === 'carousel') {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (section.display_type === 'carousel') {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const handleItemClick = (item: Product | Category) => {
    if (section.content_type === 'category' && onCategoryClick) {
      onCategoryClick(item.id);
    } else if (section.content_type === 'product' && onProductClick) {
      onProductClick(item as Product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    });
  };

  const handleToggleFavorite = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    toggleFavorite(productId);
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  const renderItem = (item: Product | Category, index: number) => {
    const isProduct = section.content_type === 'product';
    const product = isProduct ? (item as Product) : null;
    const category = !isProduct ? (item as Category) : null;

    return (
      <div
        key={item.id}
        onClick={() => handleItemClick(item)}
        className={`group cursor-pointer ${
          section.display_type === 'horizontal' || section.display_type === 'swipable'
            ? 'flex-shrink-0 w-64'
            : section.display_type === 'grid'
            ? ''
            : 'w-full'
        }`}
      >
        <div
          className={`relative bg-white overflow-hidden transition-all duration-300 ${cardStyles.container || 'rounded-2xl border-2 border-gray-100 hover:border-teal-300 hover:shadow-lg'}`}
          style={{
            ...cardStyles.style,
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            if (cardStyles.hoverTransform) {
              e.currentTarget.style.transform = cardStyles.hoverTransform;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div className="aspect-square relative overflow-hidden" style={cardStyles.imageStyle}>
            <LazyImage
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {isProduct && product && (
              <>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
                  </div>
                )}
                <button
                  onClick={(e) => handleToggleFavorite(e, product.id)}
                  className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    favorites.includes(product.id)
                      ? 'bg-red-500 text-white scale-110'
                      : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${favorites.includes(product.id) ? 'fill-current' : ''}`} />
                </button>
              </>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{item.name}</h3>
            {isProduct && product && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-teal-600">₹{product.price}</span>
                  {product.compare_at_price && product.compare_at_price > product.price && (
                    <span className="text-sm text-gray-400 line-through">₹{product.compare_at_price}</span>
                  )}
                </div>
                {isInCart(product.id) && getItemQuantity(product.id) > 0 ? (
                  <div
                    className="flex items-center justify-between bg-gray-50 rounded-full border border-gray-200 h-9 sm:h-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const cid = getCartItemId(product.id);
                        if (cid) {
                          const q = getItemQuantity(product.id);
                          if (q <= 1) updateQuantity(cid, 0);
                          else updateQuantity(cid, q - 1);
                        }
                      }}
                      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                    >
                      <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <span className="text-sm sm:text-base font-bold text-gray-900 min-w-[20px] text-center">{getItemQuantity(product.id)}</span>
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
                    onClick={(e) => handleAddToCart(e, product)}
                    className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white rounded-full h-9 sm:h-10 text-xs sm:text-sm font-medium hover:bg-gray-800 transition-all active:scale-[0.97]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </>
            )}
            {!isProduct && category && (
              <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCarousel = () => (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item, index) => (
            <div key={item.id} className="w-full flex-shrink-0 px-2">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>
          <div className="flex justify-center gap-2 mt-4">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-teal-500 w-8' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderHorizontalScroll = () => (
    <div className="relative group -mx-4 md:-mx-6 lg:-mx-0">
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-4 md:px-6 lg:px-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, index) => renderItem(item, index))}
      </div>
      <button
        onClick={handlePrev}
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        <ChevronLeft className="w-5 h-5 text-gray-800" />
      </button>
      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        <ChevronRight className="w-5 h-5 text-gray-800" />
      </button>
    </div>
  );

  const renderVertical = () => (
    <div className="space-y-4">
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );

  return (
    <section className="py-8">
      <div className={`mb-6 ${(section.display_type === 'horizontal' || section.display_type === 'swipable') ? 'px-0' : ''}`}>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{section.title}</h2>
        {section.subtitle && (
          <p className="text-gray-600">{section.subtitle}</p>
        )}
      </div>

      {section.display_type === 'carousel' && renderCarousel()}
      {section.display_type === 'horizontal' && renderHorizontalScroll()}
      {section.display_type === 'swipable' && renderHorizontalScroll()}
      {section.display_type === 'vertical' && renderVertical()}
      {section.display_type === 'grid' && renderGrid()}
    </section>
  );
}
