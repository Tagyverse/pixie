import { useEffect, useState } from 'react';
import { Filter, SlidersHorizontal, ShoppingCart, Heart, Star, X, MessageCircle, Shield, Plus, Minus } from 'lucide-react';
import { db } from '../lib/firebase';
import { ref, get } from 'firebase/database';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCardDesign, getCardStyles } from '../hooks/useCardDesign';
import EnquiryModal from '../components/EnquiryModal';
import ProductDetailsSheet from '../components/ProductDetailsSheet';
import WhatsAppCustomization from '../components/WhatsAppCustomization';
import BottomSheet from '../components/BottomSheet';
import ShimmerLoader from '../components/ShimmerLoader';
import FilterBottomSheet from '../components/FilterBottomSheet';
import LazyImage from '../components/LazyImage';
import SmartFeatureFAB from '../components/SmartFeatureFAB';
import ColorMatchProductList from '../components/ColorMatchProductList';
import WhatsAppFAB from '../components/WhatsAppFAB';
import { onValue } from 'firebase/database';
import { getPublishedData, objectToArray } from '../utils/publishedData';
import type { Product, Category } from '../types';
import VirtualTryOn from '../components/VirtualTryOn';

interface ShopProps {
  onCartClick: () => void;
}

export default function Shop({ onCartClick }: ShopProps) {
  const { addToCart, isInCart, taxSettings, getItemQuantity, getCartItemId, updateQuantity } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { design } = useCardDesign('shop_page');
  const cardStyles = getCardStyles(design);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [activePolicyKey, setActivePolicyKey] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('featured');
  const [showInStock, setShowInStock] = useState(false);
  const [showOnSale, setShowOnSale] = useState(false);
  const [showSmartFeatureFAB, setShowSmartFeatureFAB] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [showColorMatchList, setShowColorMatchList] = useState(false);

  useEffect(() => {
    const visibilityRef = ref(db, 'default_sections_visibility/smart_feature_fab');
    const unsubscribe = onValue(visibilityRef, (snapshot) => {
      if (snapshot.exists()) {
        setShowSmartFeatureFAB(snapshot.val());
      } else {
        setShowSmartFeatureFAB(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        console.log('[SHOP] Loading categories...');
        
        // Try to load from R2 first
        const publishedData = await getPublishedData();
        
        let categoriesData: Category[] = [];
        
        if (publishedData && publishedData.categories) {
          categoriesData = objectToArray<Category>(publishedData.categories);
          categoriesData.sort((a, b) => a.name.localeCompare(b.name));
          console.log(`[SHOP] Loaded ${categoriesData.length} categories`);
        }

        setCategories(categoriesData);

        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        if (categoryParam) {
          setSelectedCategory(categoryParam);
          setTimeout(() => {
            const productsSection = document.getElementById('products-section');
            if (productsSection) {
              productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleOpenProductDetails = (event: CustomEvent) => {
      const product = event.detail;
      setSelectedProduct(product);
      setShowProductDetails(true);
      window.history.pushState({}, '', `/shop?product=${product.id}`);
    };

    window.addEventListener('openProductDetails', handleOpenProductDetails as EventListener);

    return () => {
      window.removeEventListener('openProductDetails', handleOpenProductDetails as EventListener);
    };
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        console.log('[SHOP] Loading products...');
        
        // Try to load from R2 first
        const publishedData = await getPublishedData();
        
        let productsData: Product[] = [];
        
        if (publishedData && publishedData.products) {
          productsData = objectToArray<Product>(publishedData.products);
          console.log(`[SHOP] Loaded ${productsData.length} products`);
        }

        if (selectedCategory) {
          productsData = productsData.filter(p => {
            if (p.category_ids && p.category_ids.length > 0) {
              return p.category_ids.includes(selectedCategory);
            }
            return p.category_id === selectedCategory;
          });
        }

        if (showInStock) {
          productsData = productsData.filter(p => p.in_stock);
        }

        if (showOnSale) {
          productsData = productsData.filter(p => p.compare_at_price && p.compare_at_price > p.price);
        }

        switch (sortBy) {
          case 'newest':
            productsData.sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            });
            break;
          case 'price-low':
            productsData.sort((a, b) => a.price - b.price);
            break;
          case 'price-high':
            productsData.sort((a, b) => b.price - a.price);
            break;
          case 'name-az':
            productsData.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'name-za':
            productsData.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case 'featured':
          default:
            productsData.sort((a, b) => {
              if (a.featured && !b.featured) return -1;
              if (!a.featured && b.featured) return 1;
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            });
            break;
        }

        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory, sortBy, showInStock, showOnSale]);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-b from-white via-teal-50/30 to-white border-b border-gray-100 py-6 sm:py-8 lg:py-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-0">
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg border-4 border-teal-700 group-hover:border-teal-800 transition-all group-hover:scale-110">
                  <span>1</span>
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 mt-2 sm:mt-3 whitespace-nowrap">Browse</span>
              </div>

              <div className="w-12 sm:w-16 lg:w-24 h-1 bg-gradient-to-r from-teal-500 to-mint-400 mx-1 sm:mx-2 border-2 border-teal-600 rounded-full"></div>

              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 text-white flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg border-4 border-mint-700 group-hover:border-mint-800 transition-all group-hover:scale-110">
                  <span>2</span>
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 mt-2 sm:mt-3 whitespace-nowrap">Customize</span>
              </div>

              <div className="w-12 sm:w-16 lg:w-24 h-1 bg-gradient-to-r from-mint-400 to-peach-400 mx-1 sm:mx-2 border-2 border-mint-600 rounded-full"></div>

              <div className="flex flex-col items-center group cursor-pointer">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-peach-400 to-peach-600 text-white flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg border-4 border-peach-700 group-hover:border-peach-800 transition-all group-hover:scale-110">
                  <span>3</span>
                </div>
                <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-gray-700 mt-2 sm:mt-3 whitespace-nowrap">Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative bg-gradient-to-br from-teal-50 via-mint-50 to-peach-100 py-8 sm:py-12 lg:py-16 xl:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="hidden md:block absolute top-10 right-20 w-64 h-64 bg-gradient-to-br from-teal-300/30 to-mint-400/30 blob"></div>
        <div className="hidden lg:block absolute bottom-10 left-20 w-80 h-80 bg-gradient-to-br from-peach-300/20 to-teal-300/20 blob" style={{ animationDelay: '3s' }}></div>

        <div className="relative max-w-7xl mx-auto text-center">
          <span className="inline-block text-[10px] sm:text-xs md:text-sm font-semibold text-teal-600 tracking-widest uppercase mb-2 sm:mb-3 md:mb-4">
            Handcrafted Collection
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-2">
            Discover Your <span className="text-teal-600">Perfect</span> Style
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-teal-600" />
                  Categories
                </h3>
                <div className="flex flex-wrap lg:flex-col gap-1.5">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`chip-animate group relative px-3.5 py-2 text-[11px] sm:text-xs font-medium tracking-wide transition-all duration-300 rounded-full ${
                      selectedCategory === null
                        ? 'bg-[#2D4A3A] text-white ring-1 ring-[#7BAF7B]/40'
                        : 'bg-[#F0F5F0] text-[#3D4A3D] hover:bg-[#E5EDE5] border border-[#C8D4C8]'
                    }`}
                    style={{ animationDelay: '0ms' }}
                  >
                    <span className="relative flex items-center gap-1.5">
                      {selectedCategory === null && <span className="w-1.5 h-1.5 rounded-full bg-[#7BAF7B] animate-[pulse_2s_ease-in-out_infinite]" />}
                      All
                    </span>
                  </button>
                  {categories.map((category, index) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`chip-animate group relative px-3.5 py-2 text-[11px] sm:text-xs font-medium tracking-wide transition-all duration-300 rounded-full ${
                        selectedCategory === category.id
                          ? 'bg-[#2D4A3A] text-white ring-1 ring-[#7BAF7B]/40'
                          : 'bg-[#F0F5F0] text-[#3D4A3D] hover:bg-[#E5EDE5] border border-[#C8D4C8]'
                      }`}
                      style={{ animationDelay: `${(index + 1) * 60}ms` }}
                    >
                      <span className="relative flex items-center gap-1.5">
                        {selectedCategory === category.id && <span className="w-1.5 h-1.5 rounded-full bg-[#7BAF7B] animate-[pulse_2s_ease-in-out_infinite]" />}
                        {category.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8" id="products-section">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500 font-medium">{products.length} Products</span>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto bg-white border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:border-teal-500 transition-colors cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">New Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-az">Name: A-Z</option>
                  <option value="name-za">Name: Z-A</option>
                </select>
                
                <button
                  onClick={() => setFilterOpen(true)}
                  className="lg:hidden p-2 bg-white border-2 border-gray-100 rounded-xl hover:border-teal-200 transition-all"
                >
                  <Filter className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-gray-100 rounded-2xl mb-3"></div>
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters or category selection</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
                {products.map((product, index) => {
                  const inCart = isInCart(product.id);
                  const qty = getItemQuantity(product.id);
                  const cartItemId = getCartItemId(product.id);
                  const discount = product.compare_at_price
                    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                    : 0;

                  return (
                    <div
                      key={product.id}
                      className={`group bg-white overflow-hidden ${cardStyles.container || 'border border-gray-100 rounded-2xl'}`}
                      style={cardStyles.style}
                    >
                      <div
                        className="aspect-square overflow-hidden relative cursor-pointer"
                        style={cardStyles.imageStyle}
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductDetails(true);
                        }}
                      >
                        <LazyImage
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.featured && (
                          <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] sm:text-xs font-semibold text-gray-700 px-2 py-0.5 rounded-md">
                            Featured
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-2 right-10 sm:right-11 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md">
                            -{discount}%
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product.id);
                          }}
                          className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-full bg-white/90 backdrop-blur-sm transition-colors"
                        >
                          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                        </button>
                        {!product.in_stock && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="bg-white text-gray-900 px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 sm:p-3.5">
                        <h3
                          className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2 mb-1.5 cursor-pointer hover:text-teal-600 transition-colors"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowProductDetails(true);
                          }}
                        >
                          {product.name}
                        </h3>

                        <div className="flex items-baseline gap-1.5 mb-2">
                          <span className="text-sm sm:text-base font-bold text-gray-900">₹{product.price}</span>
                          {product.compare_at_price && (
                            <span className="text-[10px] sm:text-xs text-gray-400 line-through">₹{product.compare_at_price}</span>
                          )}
                        </div>

                        {inCart && qty > 0 ? (
                          <div className="flex items-center justify-between bg-teal-50 rounded-full border border-teal-200 h-9 sm:h-10">
                            <button
                              onClick={() => {
                                if (cartItemId) {
                                  if (qty <= 1) {
                                    updateQuantity(cartItemId, 0);
                                  } else {
                                    updateQuantity(cartItemId, qty - 1);
                                  }
                                }
                              }}
                              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-teal-700 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                            >
                              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <span className="text-sm sm:text-base font-bold text-teal-800 min-w-[20px] text-center">{qty}</span>
                            <button
                              onClick={() => addToCart(product)}
                              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-teal-700 hover:text-teal-900 transition-colors rounded-full hover:bg-teal-100"
                            >
                              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            disabled={!product.in_stock}
                            className="w-full flex items-center justify-center gap-1.5 bg-teal-600 text-white rounded-full h-9 sm:h-10 text-xs sm:text-sm font-medium hover:bg-teal-700 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      <EnquiryModal isOpen={showEnquiryModal} onClose={() => setShowEnquiryModal(false)} />
      <ProductDetailsSheet
        product={selectedProduct}
        isOpen={showProductDetails}
        onClose={() => {
          setShowProductDetails(false);
          setSelectedProduct(null);
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('product')) {
            window.history.pushState({}, '', '/shop');
          }
        }}
        onCartClick={onCartClick}
      />
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        showInStock={showInStock}
        showOnSale={showOnSale}
        onInStockChange={setShowInStock}
        onOnSaleChange={setShowOnSale}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <WhatsAppFAB />

      {showSmartFeatureFAB && (
        <SmartFeatureFAB
          onTryOnClick={() => setShowTryOn(true)}
          onColorMatchClick={() => setShowColorMatchList(true)}
        />
      )}

      <VirtualTryOn
        isOpen={showTryOn}
        onClose={() => setShowTryOn(false)}
      />

      <ColorMatchProductList
        isOpen={showColorMatchList}
        onClose={() => setShowColorMatchList(false)}
      />
    </div>
  );
}
