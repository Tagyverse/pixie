import { ArrowRight, Sparkles, Heart, Package, Star, ShoppingCart, MessageCircle, Shield } from 'lucide-react';
import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { db } from '../lib/firebase';
import { ref, get, onValue } from 'firebase/database';
import type { Product, Category } from '../types';
import FeaturedCategories from '../components/FeaturedCategories';
import CustomerReviews from '../components/CustomerReviews';
import WhatsAppFAB from '../components/WhatsAppFAB';
import SmartFeatureFAB from '../components/SmartFeatureFAB';
import TryOnProductList from '../components/TryOnProductList';
import ColorMatchProductList from '../components/ColorMatchProductList';
import EnquiryModal from '../components/EnquiryModal';
import BottomSheet from '../components/BottomSheet';
import ProductDetailsSheet from '../components/ProductDetailsSheet';
import ShimmerLoader from '../components/ShimmerLoader';
import MightYouLike from '../components/MightYouLike';
import LazyImage from '../components/LazyImage';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCardDesign, getCardStyles } from '../hooks/useCardDesign';
import DynamicSection from '../components/DynamicSection';
import InfoSection from '../components/InfoSection';
import VideoSection from '../components/VideoSection';
import VideoOverlaySection from '../components/VideoOverlaySection';
import { getPublishedData, objectToArray } from '../utils/publishedData';
import type { HomepageSection } from '../types';
import VirtualTryOn from '../components/VirtualTryOn';

interface InfoSectionData {
  id: string;
  title: string;
  content: string;
  theme: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'gradient';
  is_visible: boolean;
  order_index: number;
}

interface HomeProps {
  onNavigate: (page: 'shop', categoryId?: string) => void;
  onCartClick: () => void;
}

interface Policy {
  key: string;
  title: string;
  content: string;
  isEnabled: boolean;
}

export default function Home({ onNavigate, onCartClick }: HomeProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivalCategories, setNewArrivalCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [activePolicyKey, setActivePolicyKey] = useState<string | null>(null);
  const [carouselImages, setCarouselImages] = useState<string[]>([
    'https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3755710/pexels-photo-3755710.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=1200'
  ]);
  const [carouselSettings, setCarouselSettings] = useState({
    is_visible: false,
    autoplay: true,
    interval: 5000,
    show_indicators: true,
    show_navigation: true
  });
  const [dynamicSections, setDynamicSections] = useState<HomepageSection[]>([]);
  const [infoSections, setInfoSections] = useState<InfoSectionData[]>([]);
  const [marqueeSections, setMarqueeSections] = useState<any[]>([]);
  const [videoSections, setVideoSections] = useState<any[]>([]);
  const [videoSectionSettings, setVideoSectionSettings] = useState({
    is_visible: false,
    section_title: 'Watch Our Videos',
    section_subtitle: 'Explore our collection'
  });
  const [videoOverlaySections, setVideoOverlaySections] = useState<any[]>([]);
  const [defaultSectionsVisibility, setDefaultSectionsVisibility] = useState({
    banner_social: false,
    feature_boxes: false,
    all_categories: false,
    best_sellers: false,
    might_you_like: false,
    shop_by_category: false,
    customer_reviews: false,
    marquee: false
  });
  const [allSectionsOrder, setAllSectionsOrder] = useState<Array<{ id: string; type: 'default' | 'custom' | 'info' | 'video' | 'video_section' | 'marquee' | 'video_overlay'; order_index: number }>>([]);
  const [showSmartFeatureFAB, setShowSmartFeatureFAB] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [showColorMatchList, setShowColorMatchList] = useState(false);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const { addToCart, isInCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { design: allCategoriesDesign } = useCardDesign('all_categories');
  const allCategoriesCardStyles = getCardStyles(allCategoriesDesign);

  useEffect(() => {
    const handleOpenProductDetails = (event: CustomEvent) => {
      const product = event.detail;
      setSelectedProduct(product);
      setShowProductDetails(true);
      window.history.pushState({}, '', `/?product=${product.id}`);
    };

    window.addEventListener('openProductDetails', handleOpenProductDetails as EventListener);

    return () => {
      window.removeEventListener('openProductDetails', handleOpenProductDetails as EventListener);
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('[HOME] Starting data fetch...');
        
        // Try to load from R2 first (published data for users)
        const publishedData = await getPublishedData();
        
        if (publishedData) {
          console.log('[HOME] Published data loaded successfully');
          
          // Use published data from R2
          const allProducts: Product[] = objectToArray<Product>(publishedData.products);
          console.log(`[HOME] Loaded ${allProducts.length} products`);

          const featuredProducts = allProducts
            .filter(p => p.featured)
            .sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            })
            .slice(0, 3);

          const categoriesData: Category[] = objectToArray<Category>(publishedData.categories);
          const newArrivals = categoriesData.filter(c => c.new_arrival);
          categoriesData.sort((a, b) => a.name.localeCompare(b.name));
          newArrivals.sort((a, b) => a.name.localeCompare(b.name));

          if (publishedData.carousel_images) {
            const images = Object.keys(publishedData.carousel_images)
              .map(key => ({ ...publishedData.carousel_images![key], id: key }))
              .filter(img => img.isVisible)
              .sort((a, b) => a.order - b.order)
              .map(img => img.url);
            if (images.length > 0) {
              setCarouselImages(images);
            }
          }

          if (publishedData.carousel_settings) {
            setCarouselSettings(publishedData.carousel_settings);
          }

          const sectionsData: HomepageSection[] = [];
          if (publishedData.homepage_sections) {
            Object.entries(publishedData.homepage_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                sectionsData.push({ id, ...sectionData });
              }
            });
          }
          setDynamicSections(sectionsData);

          const infoSectionsData: InfoSectionData[] = [];
          if (publishedData.info_sections) {
            Object.entries(publishedData.info_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                infoSectionsData.push({ id, ...sectionData });
              }
            });
          }
          setInfoSections(infoSectionsData);

          const marqueeSectionsData: any[] = [];
          if (publishedData.marquee_sections) {
            Object.entries(publishedData.marquee_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                marqueeSectionsData.push({ id, ...sectionData });
              }
            });
          }
          setMarqueeSections(marqueeSectionsData);

          const videoSectionsData: any[] = [];
          if (publishedData.video_sections) {
            Object.entries(publishedData.video_sections).forEach(([id, videoData]: [string, any]) => {
              if (videoData.is_visible || videoData.isVisible) {
                videoSectionsData.push({ id, ...videoData });
              }
            });
            videoSectionsData.sort((a, b) => (a.order || 0) - (b.order || 0));
          }
          setVideoSections(videoSectionsData);
          console.log('[v0] Video sections loaded:', videoSectionsData.length);

          let videoSettings = {
            is_visible: false,
            section_title: 'Watch Our Videos',
            section_subtitle: 'Explore our collection',
            order_index: 7
          };
          if (publishedData.video_section_settings) {
            videoSettings = { ...videoSettings, ...publishedData.video_section_settings };
            setVideoSectionSettings(videoSettings);
            console.log('[v0] Video section settings:', videoSettings);
          }

  const videoOverlaySectionsData: any[] = [];
  if (publishedData.video_overlay_sections) {
    for (const [sectionId, sectionData] of Object.entries<any>(publishedData.video_overlay_sections)) {
      if (sectionData.is_visible && sectionData.videos) {
        const sectionVideos: any[] = [];
        if (publishedData.video_overlay_items) {
          sectionData.videos.forEach((videoId: string) => {
            if (publishedData.video_overlay_items![videoId] && publishedData.video_overlay_items![videoId].isVisible) {
              const videoData = {
                id: videoId,
                ...publishedData.video_overlay_items![videoId]
              };
              sectionVideos.push(videoData);
            }
          });
        }
        if (sectionVideos.length > 0) {
          videoOverlaySectionsData.push({
            id: sectionId,
            ...sectionData,
            videoItems: sectionVideos
          });
        }
      }
    }
    videoOverlaySectionsData.sort((a, b) => a.order_index - b.order_index);
  }
  setVideoOverlaySections(videoOverlaySectionsData);

          setFeaturedProducts(featuredProducts);
          setCategories(categoriesData);
          setNewArrivalCategories(newArrivals);
          
          if (publishedData.default_sections_visibility) {
            setDefaultSectionsVisibility(publishedData.default_sections_visibility);
          }

          // Build allSectionsOrder by merging default and custom sections
          const allSectionsOrderData: Array<{ id: string; type: 'default' | 'custom' | 'info' | 'video' | 'marquee'; order_index: number }> = [];
          
          // Add default sections with their visibility settings
          if (publishedData.default_sections_visibility) {
            const defaultVisibility = publishedData.default_sections_visibility;
            const defaultSectionKeys = ['banner_social', 'feature_boxes', 'all_categories', 'best_sellers', 'might_you_like', 'shop_by_category', 'customer_reviews', 'marquee'];
            
            defaultSectionKeys.forEach((key, index) => {
              const orderKey = `order_${key}`;
              const order_index = defaultVisibility[orderKey] !== undefined ? defaultVisibility[orderKey] : index;
              allSectionsOrderData.push({
                id: key,
                type: 'default',
                order_index
              });
            });
          }
          
          // Add custom sections
          if (publishedData.homepage_sections) {
            Object.entries(publishedData.homepage_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                allSectionsOrderData.push({
                  id,
                  type: 'custom',
                  order_index: sectionData.order_index || 100
                });
              }
            });
          }
          
          // Add info sections
          if (publishedData.info_sections) {
            Object.entries(publishedData.info_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                allSectionsOrderData.push({
                  id,
                  type: 'info',
                  order_index: sectionData.order_index || 100
                });
              }
            });
          }
          
          // Add individual video sections from published data
          if (publishedData.video_sections) {
            Object.entries(publishedData.video_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                allSectionsOrderData.push({
                  id,
                  type: 'video_section',
                  order_index: sectionData.order_index || 7
                });
              }
            });
          }
          
          // Add marquee sections
          if (publishedData.marquee_sections) {
            Object.entries(publishedData.marquee_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                allSectionsOrderData.push({
                  id,
                  type: 'marquee',
                  order_index: sectionData.order_index || 100
                });
              }
            });
          }
          
          // Add video overlay sections
          if (publishedData.video_overlay_sections) {
            Object.entries(publishedData.video_overlay_sections).forEach(([id, sectionData]: [string, any]) => {
              if (sectionData.is_visible) {
                allSectionsOrderData.push({
                  id,
                  type: 'video_overlay',
                  order_index: sectionData.order_index || 100
                });
              }
            });
          }
          
          // Use explicit order if available, otherwise use constructed order
          if (publishedData.all_sections_order) {
            const orderArray = Object.entries(publishedData.all_sections_order).map(([id, data]: [string, any]) => ({
              id,
              ...data
            }));
            orderArray.sort((a, b) => a.order_index - b.order_index);
            setAllSectionsOrder(orderArray);
          } else {
            // Sort by order_index and set
            allSectionsOrderData.sort((a, b) => a.order_index - b.order_index);
            setAllSectionsOrder(allSectionsOrderData);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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
    const fetchPolicies = async () => {
      try {
        const policiesRef = ref(db, 'policies');
        const snapshot = await get(policiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const policiesList = Object.entries(data).map(([key, value]: [string, any]) => ({
            key,
            ...value
          }));
          setPolicies(policiesList);
        }
      } catch (error) {
        console.error('Error fetching policies:', error);
      }
    };
    fetchPolicies();
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  useEffect(() => {
    if (carouselSettings.autoplay && carouselImages.length > 0) {
      autoSlideRef.current = setInterval(nextSlide, carouselSettings.interval);
    }
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [carouselSettings.autoplay, carouselSettings.interval, carouselImages.length]);

  const activePolicy = policies.find(p => p.key === activePolicyKey);

  const renderPolicyContent = (content: string) => {
    return (
      <div className="prose prose-sm max-w-none">
        {content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4 text-gray-600 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return <ShimmerLoader type="home" />;
  }

  return (
    <div className="min-h-screen bg-white">
      {carouselSettings.is_visible && carouselImages.length > 0 && (
        <section className="relative w-full overflow-hidden group bg-gray-100">
          {/* Responsive height: mobile first */}
          <div className="relative h-48 sm:h-80 md:h-96 lg:h-[600px] w-full">
            {carouselImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                  index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'
                }`}
              >
                <img
                  src={image}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}

            {carouselSettings.show_navigation && carouselImages.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform -translate-x-4 sm:group-hover:translate-x-0"
                  aria-label="Previous slide"
                >
                  <ArrowRight className="w-4 sm:w-6 h-4 sm:h-6 rotate-180" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white/50 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transform translate-x-4 sm:group-hover:translate-x-0"
                  aria-label="Next slide"
                >
                  <ArrowRight className="w-4 sm:w-6 h-4 sm:h-6" />
                </button>
              </>
            )}

            {carouselSettings.show_indicators && carouselImages.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-3">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-1 sm:h-1.5 transition-all duration-300 rounded-full ${
                      index === currentSlide ? 'w-6 sm:w-8 bg-white' : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {allSectionsOrder.map((section) => (
        <section key={section.id} className="w-full">
          {section.id === 'all_categories' && (defaultSectionsVisibility.all_categories !== false) && categories.length > 0 && (
            <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8 sm:mb-12">
                  <span className="text-xs sm:text-sm font-semibold text-teal-600 tracking-widest uppercase">Explore Our Collections</span>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-3 sm:mt-4 mb-4 sm:mb-6">
                    Shop by Category
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => onNavigate('shop', category.id)}
                      className={`group relative bg-white overflow-hidden transition-all duration-500 hover:shadow-2xl border-2 border-gray-100 ${allCategoriesCardStyles.container || 'rounded-3xl'}`}
                      style={{
                        ...allCategoriesCardStyles.style,
                        backgroundColor: category.bg_color || '#ffffff'
                      }}
                    >
                      <div className="aspect-square overflow-hidden bg-gray-50" style={allCategoriesCardStyles.imageStyle}>
                        <LazyImage
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center justify-between">
                          {category.name}
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:translate-x-1 transition-transform duration-300" />
                        </h3>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {section.id === 'best_sellers' && (defaultSectionsVisibility.best_sellers !== false) && (
            <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Best Sellers 🏆
                </h2>
                <p className="text-lg text-gray-600 mb-8">Our most popular products loved by customers</p>
                <p className="text-sm text-gray-500 italic">Coming soon - Configure products with "best_seller" flag in admin</p>
              </div>
            </section>
          )}

          {section.id === 'might_you_like' && (defaultSectionsVisibility.might_you_like !== false) && (
            <MightYouLike
              onProductClick={(product) => {
                setSelectedProduct(product);
                setShowProductDetails(true);
              }}
              onCartClick={onCartClick}
            />
          )}

          {section.id === 'shop_by_category' && (defaultSectionsVisibility.shop_by_category !== false) && (
            <section className="relative py-12 sm:py-16 lg:py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-12">
                  <span className="text-xs sm:text-sm font-semibold text-teal-600 tracking-widest uppercase">Featured</span>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-3 sm:mt-4 mb-4 sm:mb-6 px-4">
                    Shop by Category
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4 mb-8">
                    Discover our curated collections
                  </p>
                </div>
              </div>

              <div className="w-full">
                <FeaturedCategories
                  onNavigate={onNavigate}
                  onAddToCart={addToCart}
                  onCartClick={onCartClick}
                  onProductClick={(product) => {
                    setSelectedProduct(product);
                    setShowProductDetails(true);
                  }}
                />
              </div>
            </section>
          )}

          {section.id === 'customer_reviews' && (defaultSectionsVisibility.customer_reviews !== false) && <CustomerReviews />}

          {section.type === 'custom' && dynamicSections.find(s => s.id === section.id) && (
            <div className="bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <DynamicSection
                  section={dynamicSections.find(s => s.id === section.id)!}
                  onProductClick={(product) => {
                    setSelectedProduct(product);
                    setShowProductDetails(true);
                  }}
                  onCategoryClick={(categoryId) => onNavigate('shop', categoryId)}
                />
              </div>
            </div>
          )}

          {section.type === 'info' && infoSections.find(s => s.id === section.id) && (
            <section className="py-8 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <InfoSection
                  title={infoSections.find(s => s.id === section.id)!.title}
                  content={infoSections.find(s => s.id === section.id)!.content}
                  theme={infoSections.find(s => s.id === section.id)!.theme}
                />
              </div>
            </section>
          )}

          {section.type === 'video' && videoSections.length > 0 && videoSectionSettings.is_visible && (
            <VideoSection
              videos={videoSections}
              title={videoSectionSettings.section_title}
              subtitle={videoSectionSettings.section_subtitle}
            />
          )}

          {section.type === 'video_section' && videoSections.length > 0 && (
            <VideoSection
              videos={videoSections}
              title={videoSectionSettings.section_title}
              subtitle={videoSectionSettings.section_subtitle}
            />
          )}

          {section.type === 'marquee' && marqueeSections.find(s => s.id === section.id) && (
            <div
              className="w-full overflow-hidden py-3"
              style={{ backgroundColor: marqueeSections.find(s => s.id === section.id)!.bg_color }}
            >
              <div className={`whitespace-nowrap ${marqueeSections.find(s => s.id === section.id)!.speed === 'slow' ? 'animate-marquee-slow' : marqueeSections.find(s => s.id === section.id)!.speed === 'fast' ? 'animate-marquee-fast' : 'animate-marquee'}`} style={{ color: marqueeSections.find(s => s.id === section.id)!.text_color }}>
                <span className="inline-block px-4 text-lg font-semibold">{marqueeSections.find(s => s.id === section.id)!.text}</span>
                <span className="inline-block px-4 text-lg font-semibold">{marqueeSections.find(s => s.id === section.id)!.text}</span>
                <span className="inline-block px-4 text-lg font-semibold">{marqueeSections.find(s => s.id === section.id)!.text}</span>
                <span className="inline-block px-4 text-lg font-semibold">{marqueeSections.find(s => s.id === section.id)!.text}</span>
              </div>
            </div>
          )}

          {section.type === 'video_overlay' && videoOverlaySections.find(s => s.id === section.id) && (
            <VideoOverlaySection videos={videoOverlaySections.find(s => s.id === section.id)?.videoItems || []} />
          )}
        </section>
      ))}

      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <span className="text-xs sm:text-sm font-semibold text-teal-600 tracking-widest uppercase">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-3 sm:mt-4 mb-3 sm:mb-4">
              The Pixie Blooms Promise
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="group relative bg-white rounded-3xl overflow-hidden border-2 border-teal-200 hover:border-teal-400 transition-all duration-500 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-teal-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-8 sm:p-10 lg:p-12">
                <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                  <div className="relative bg-white rounded-2xl w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border-2 border-teal-200">
                    <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-teal-600 fill-teal-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">
                  Handmade with Love
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  Every piece is meticulously crafted by hand, ensuring unique quality and character in each accessory
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>

            <div className="group relative bg-white rounded-3xl overflow-hidden border-2 border-rose-200 hover:border-rose-400 transition-all duration-500 transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-rose-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative p-8 sm:p-10 lg:p-12">
                <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-6 sm:mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                  <div className="relative bg-white rounded-2xl w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border-2 border-rose-200">
                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-rose-600" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-rose-600 transition-colors">
                  Premium Quality
                </h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  We source only the finest materials to create accessories that last and look beautiful every day
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 to-rose-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <EnquiryModal isOpen={showEnquiryModal} onClose={() => setShowEnquiryModal(false)} />

      <ProductDetailsSheet
        product={selectedProduct}
        isOpen={showProductDetails}
        onClose={() => {
          setShowProductDetails(false);
          setSelectedProduct(null);
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('product')) {
            window.history.pushState({}, '', '/');
          }
        }}
        onCartClick={onCartClick}
      />

      {activePolicy && (
        <BottomSheet
          isOpen={!!activePolicy}
          onClose={() => setActivePolicyKey(null)}
          title={activePolicy.title}
        >
          {renderPolicyContent(activePolicy.content)}
        </BottomSheet>
      )}

      <BottomSheet isOpen={activePolicyKey === 'about'} onClose={() => setActivePolicyKey(null)} title="About Us">
        <div className="space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            Welcome to Pixie Blooms, where elegance meets craftsmanship.
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">
            We specialize in handcrafted floral baby headbands, hair clips, and custom accessories designed to add a magical touch to every little moment.
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}
