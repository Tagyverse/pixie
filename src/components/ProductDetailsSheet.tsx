import { useState, useEffect, useRef } from 'react';
import { X, ShoppingCart, ChevronLeft, ChevronRight, Heart, ZoomIn, Sparkles, ShoppingBag, TrendingUp, Eye, Tag, CheckCircle2, Zap, Scan, Box, Share2, Copy, Check, Upload, Palette } from 'lucide-react';
import Confetti from './Confetti';
import type { Product } from '../types';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { objectToArray } from '../utils/publishedData';
import { getProxiedImageUrl } from '../utils/imageUrlHandler';
import LazyImage from './LazyImage';
import VirtualTryOn from './VirtualTryOn';
import DressColorMatcher from './DressColorMatcher';

interface ProductDetailsSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onCartClick?: () => void;
}

const colorMap: { [key: string]: string } = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#6B7280',
  grey: '#6B7280',
  pink: '#EC4899',
  purple: '#A855F7',
  orange: '#F97316',
  brown: '#92400E',
  navy: '#1E3A8A',
  beige: '#D4C5B9',
  cream: '#FFFDD0',
  maroon: '#800000',
  gold: '#FFD700',
  silver: '#C0C0C0',
  teal: '#14B8A6',
  cyan: '#06B6D4',
  lime: '#84CC16',
  indigo: '#6366F1',
};

const getColorCode = (colorName: string): string => {
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || '#9CA3AF';
};



export default function ProductDetailsSheet({ product, isOpen, onClose, onCartClick }: ProductDetailsSheetProps) {
  const { data: publishedData } = usePublishedData();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [justAdded, setJustAdded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [viewersCount, setViewersCount] = useState(0);
  const [imageZoom, setImageZoom] = useState({ x: 0, y: 0, show: false });
  const [showTryOn, setShowTryOn] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, distance: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showColorMatcher, setShowColorMatcher] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite, favorites } = useFavorites();

  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
      setQuantity(1);
      setSelectedSize(product.default_size || (product.sizes && product.sizes[0]) || '');
      setSelectedColor(product.default_color || '');
      setFullScreenImage(null);
      setJustAdded(false);
      setShowConfetti(false);
      setViewersCount(Math.floor(Math.random() * 30) + 15);
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
      setIsDragging(false);
      setShowShareDialog(false);
      setCopySuccess(false);
      setShowColorMatcher(false);
      loadSuggestedProducts();
    }
  }, [product?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setViewersCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + change;
        return Math.max(10, Math.min(50, newCount));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const loadSuggestedProducts = async () => {
    if (!product || !publishedData?.products) return;

    try {
      const allProducts = objectToArray<Product>(publishedData.products)
        .filter((p: Product) => p.id !== product.id && p.in_stock && (p.isVisible !== false));

      const sameCategoryProducts = allProducts.filter(
        (p: Product) => p.category === product.category
      );

      const nameMatchedProducts = allProducts.filter((p: Product) => {
        const productWords = product.name.toLowerCase().split(' ');
        const pWords = p.name.toLowerCase().split(' ');
        return productWords.some((word) => pWords.includes(word));
      });

      const shuffled = [...new Set([...sameCategoryProducts, ...nameMatchedProducts, ...allProducts])]
          .sort(() => Math.random() - 0.5)
          .slice(0, 6);

      setSuggestedProducts(shuffled);
    } catch (error) {
      console.error('Error loading suggested products:', error);
    }
  };

  const loadWishlistProducts = async () => {
    if (favorites.length === 0 || !publishedData?.products) {
      setWishlistProducts([]);
      return;
    }

    try {
      const allProducts = objectToArray<Product>(publishedData.products)
        .filter((p: Product) => favorites.includes(p.id) && (p.isVisible !== false));

      setWishlistProducts(allProducts);
    } catch (error) {
      console.error('Error loading wishlist products:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWishlistProducts();
    }
  }, [favorites, isOpen]);

  if (!product || !isOpen) return null;

  const allImages = [product.image_url, ...(product.gallery_images || [])].filter(Boolean);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor);
    setJustAdded(true);
    setShowConfetti(true);
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setImageZoom({ x, y, show: true });
  };

  const handleImageMouseLeave = () => {
    setImageZoom({ x: 0, y: 0, show: false });
  };

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setTouchStart({ x: 0, y: 0, distance });
    } else if (e.touches.length === 1 && imageScale > 1) {
      setIsDragging(true);
      setTouchStart({
        x: e.touches[0].clientX - imagePosition.x,
        y: e.touches[0].clientY - imagePosition.y,
        distance: 0
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      if (touchStart.distance > 0) {
        const scale = (distance / touchStart.distance) * imageScale;
        setImageScale(Math.min(Math.max(1, scale), 4));
      }
    } else if (e.touches.length === 1 && isDragging && imageScale > 1) {
      e.preventDefault();
      setImagePosition({
        x: e.touches[0].clientX - touchStart.x,
        y: e.touches[0].clientY - touchStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setTouchStart({ x: 0, y: 0, distance: 0 });
    setIsDragging(false);
    if (imageScale <= 1) {
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleGoToCart = () => {
    onClose();
    if (onCartClick) {
      setTimeout(() => onCartClick(), 300);
    }
  };

  const getCurrentPrice = () => {
    if (selectedSize && product.size_pricing && product.size_pricing[selectedSize]) {
      return product.size_pricing[selectedSize].price;
    }
    return product.price;
  };

  const getCurrentComparePrice = () => {
    if (selectedSize && product.size_pricing && product.size_pricing[selectedSize]) {
      return product.size_pricing[selectedSize].compare_at_price;
    }
    return product.compare_at_price;
  };

  const currentPrice = getCurrentPrice();
  const currentComparePrice = getCurrentComparePrice();
  const discount = currentComparePrice
    ? Math.round(((currentComparePrice - currentPrice) / currentComparePrice) * 100)
    : 0;

  const totalSavings = currentComparePrice ? (currentComparePrice - currentPrice) * quantity : 0;

  const getProductShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}?product=${product.id}`;
  };

  const handleShare = async () => {
    const shareUrl = getProductShareUrl();
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - ₹${currentPrice}`,
      url: shareUrl,
    };

    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setShowShareDialog(true);
        }
      }
    } else {
      setShowShareDialog(true);
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = getProductShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShareDialog(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <>
      <div className="relative z-[100]">
        <VirtualTryOn
          isOpen={showTryOn}
          onClose={() => setShowTryOn(false)}
          product={product}
        />
        <DressColorMatcher
          isOpen={showColorMatcher}
          onClose={() => setShowColorMatcher(false)}
          currentProduct={product || undefined}
        />
      </div>
      <Confetti isActive={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div
        className={`fixed inset-0 z-50 transition-all duration-500 ${
          isOpen ? 'visible' : 'invisible'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${
            isOpen ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={onClose}
        />

        <div
          className={`absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden transition-all duration-500 ${
            isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-full scale-95 opacity-0'
          }`}
        >
          <div className="sticky top-0 z-20 bg-gradient-to-r from-mint-50 via-teal-50 to-green-50 backdrop-blur-xl border-b-2 border-mint-300 px-4 sm:px-6 py-4 shadow-sm" style={{ backgroundColor: '#f0f9f6' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-10 bg-gradient-to-b from-mint-400 via-mint-500 to-teal-500 rounded-full shadow-lg" style={{ background: 'linear-gradient(to bottom, #A8D5BA, #8FC9AA, #76BCAA)' }}></div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight" style={{ background: 'linear-gradient(to right, #5FA587, #76BCAA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Product Details</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 rounded-full border border-green-200 animate-pulse shadow-sm">
                      <Eye className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-xs font-bold text-green-700">{viewersCount} viewing now</span>
                    </div>
                    {discount > 20 && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full animate-heartbeat shadow-md" style={{ background: 'linear-gradient(to right, #5FA587, #76BCAA, #8FC9AA)' }}>
                        <Zap className="w-3 h-3 text-white fill-white" />
                        <span className="text-xs font-bold text-white">Hot Deal!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-full transition-all duration-300 hover:scale-110 group"
                  style={{ backgroundColor: 'rgba(168, 213, 186, 0.2)' }}
                  title="Share Product"
                >
                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#5FA587' }} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-full transition-all duration-300 hover:rotate-90 group"
                  style={{ backgroundColor: 'rgba(168, 213, 186, 0.2)' }}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" style={{ color: '#5FA587' }} />
                </button>
              </div>
            </div>

            {totalSavings > 0 && (
              <div className="text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 mt-3 shadow-lg" style={{ background: 'linear-gradient(to right, #5FA587, #76BCAA, #8FC9AA)' }}>
                <Tag className="w-4 h-4" />
                <span className="text-sm font-bold">You're saving ₹{totalSavings} on this order!</span>
              </div>
            )}
          </div>

          <div className="overflow-y-auto h-[calc(100vh-4rem)] pb-32">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6">
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 group">
                    <div
                      ref={imageRef}
                      className="aspect-square relative overflow-hidden"
                      onMouseMove={handleImageMouseMove}
                      onMouseLeave={handleImageMouseLeave}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <LazyImage
                        src={getProxiedImageUrl(allImages[currentImageIndex])}
                        alt={product.name}
                        className="w-full h-full object-cover cursor-zoom-in transition-transform duration-300"
                        onClick={() => setFullScreenImage(allImages[currentImageIndex])}
                        style={{
                          transform: `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
                          transformOrigin: imageZoom.show ? `${imageZoom.x}% ${imageZoom.y}%` : 'center',
                          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                        }}
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {product.try_on_enabled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowTryOn(true);
                          }}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/60 group/tryon"
                        >
                          <div
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl shadow-2xl border-2 transform transition-all duration-300 group-hover/tryon:scale-110"
                            style={{
                              background: 'linear-gradient(135deg, #76BCAA, #8FC9AA, #A8D5BA)',
                              borderColor: '#5FA587'
                            }}
                          >
                            <div className="relative">
                              <div
                                className="absolute inset-0 rounded-full animate-ping"
                                style={{
                                  background: 'radial-gradient(circle, rgba(168, 213, 186, 0.5) 0%, transparent 70%)'
                                }}
                              />
                              <svg
                                className="w-8 h-8 text-white relative z-10"
                                style={{ transform: 'rotate(-45deg)' }}
                                fill="none"
                                strokeWidth="2.5"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                              </svg>
                            </div>
                            <span className="text-2xl font-black text-white tracking-wide drop-shadow-lg">
                              Try On
                            </span>
                          </div>
                        </button>
                      )}

                      <button
                        onClick={() => setFullScreenImage(allImages[currentImageIndex])}
                        className="absolute top-4 right-4 backdrop-blur-md p-3 rounded-xl transition-all duration-300 group/zoom border-2 shadow-lg"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderColor: '#A8D5BA'
                        }}
                      >
                        <ZoomIn className="w-5 h-5" style={{ color: '#5FA587' }} />
                      </button>

                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 backdrop-blur-md p-3 rounded-full transition-all duration-300 hover:-translate-x-1 group/prev border-2 shadow-lg"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderColor: '#A8D5BA'
                            }}
                          >
                            <ChevronLeft className="w-5 h-5" style={{ color: '#5FA587' }} />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 backdrop-blur-md p-3 rounded-full transition-all duration-300 hover:translate-x-1 group/next border-2 shadow-lg"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderColor: '#A8D5BA'
                            }}
                          >
                            <ChevronRight className="w-5 h-5" style={{ color: '#5FA587' }} />
                          </button>
                        </>
                      )}

                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {discount > 0 && (
                          <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-5 py-2 rounded-full text-sm font-black border-2 border-red-700 animate-pulse">
                            <span className="flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4" />
                              {discount}% OFF
                            </span>
                          </div>
                        )}
                        {product.availableColors && product.availableColors.length > 0 && (
                          <div className="bg-pink-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border-2 border-pink-600 shadow-lg">
                            <CheckCircle2 className="w-4 h-4" />
                            Color Match Available
                          </div>
                        )}
                      </div>

                      {product.in_stock && (
                        <div className="absolute bottom-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border-2 border-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          In Stock
                        </div>
                      )}

                      {!product.in_stock && (
                        <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-md flex items-center justify-center">
                          <div className="bg-gray-800 text-white px-10 py-4 rounded-xl text-lg font-black border-2 border-gray-600">
                            Out of Stock
                          </div>
                        </div>
                      )}

                      {allImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-xl">
                          {allImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`transition-all duration-300 rounded-full ${
                                index === currentImageIndex
                                  ? 'bg-white w-10 h-2.5'
                                  : 'bg-white/50 w-2.5 h-2.5 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {allImages.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {allImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                            index === currentImageIndex
                              ? 'ring-3 shadow-lg'
                              : 'border-gray-200 hover:shadow-md'
                          }`}
                          style={index === currentImageIndex ? {
                            borderColor: '#76BCAA',
                            boxShadow: '0 0 0 3px rgba(168, 213, 186, 0.4), 0 10px 15px -3px rgba(118, 188, 170, 0.3)'
                          } : {}}
                        >
                          <img
                            src={getProxiedImageUrl(image)}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if proxy fails
                              const img = e.target as HTMLImageElement;
                              img.src = image;
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h1>

                      {product.category && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border-2 shadow-md" style={{
                          color: '#5FA587',
                          backgroundColor: '#f0f9f6',
                          borderColor: '#A8D5BA'
                        }}>
                          <Sparkles className="w-3 h-3" style={{ fill: '#A8D5BA' }} />
                          {product.category}
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-xl border-2 border-red-200">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-3xl sm:text-4xl font-bold text-red-700">
                          ₹{currentPrice}
                        </span>
                        {currentComparePrice && (
                          <>
                            <span className="text-xl text-gray-500 line-through">
                              ₹{currentComparePrice}
                            </span>
                            <span className="text-sm font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-lg border border-red-300">
                              {discount}% off
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-600 font-medium">Inclusive of all taxes</p>
                        {discount > 20 && (
                          <span className="text-xs font-bold text-red-600 animate-pulse">Hot Deal!</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {product.colors && product.colors.length > 0 && (
                    <div className="p-5 rounded-xl border-2 shadow-sm" style={{
                      backgroundColor: '#ffffff',
                      borderColor: '#A8D5BA'
                    }}>
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-5 rounded-full shadow-sm" style={{ background: 'linear-gradient(to bottom, #76BCAA, #8FC9AA)' }}></div>
                        Color: <span className="font-semibold" style={{
                          background: 'linear-gradient(to right, #5FA587, #76BCAA)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>{selectedColor || 'Select'}</span>
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {product.colors.map((color, index) => {
                          const colorCode = getColorCode(color);
                          const isWhiteOrLight = ['#FFFFFF', '#FFFDD0', '#D4C5B9'].includes(colorCode);
                          const isSelected = selectedColor === color;

                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedColor(color)}
                              className="group relative transition-all duration-300"
                              title={color}
                            >
                              <div
                                className={`w-14 h-14 rounded-full border-3 transition-all duration-300 ${
                                  isSelected
                                    ? 'ring-4 shadow-lg'
                                    : 'border-gray-300 hover:shadow-md'
                                }`}
                                style={isSelected ? {
                                  backgroundColor: colorCode,
                                  borderColor: '#76BCAA',
                                  boxShadow: '0 0 0 4px rgba(168, 213, 186, 0.3), 0 10px 15px -3px rgba(118, 188, 170, 0.4)'
                                } : { backgroundColor: colorCode }}
                              >
                                {isWhiteOrLight && (
                                  <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                                )}
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-4 h-4 rounded-full border-2 shadow-md" style={{
                                      background: 'linear-gradient(to bottom right, white, #D5F0E3)',
                                      borderColor: '#76BCAA'
                                    }}></div>
                                  </div>
                                )}
                              </div>
                              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1">
                                <span className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-full shadow-lg font-medium">
                                  {color}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {product.sizes && product.sizes.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-600 mb-2.5">
                        Size: <span className="font-semibold text-gray-900">{selectedSize || product.sizes[0]}</span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size, index) => {
                          const isSelected = selectedSize === size;

                          return (
                            <button
                              key={index}
                              onClick={() => setSelectedSize(size)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                                isSelected
                                  ? 'bg-gray-900 text-white border-gray-900'
                                  : 'bg-white text-gray-700 border-gray-200'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-5 rounded-xl border-2 shadow-sm" style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#A8D5BA'
                  }}>
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-1 h-5 rounded-full shadow-sm" style={{ background: 'linear-gradient(to bottom, #76BCAA, #8FC9AA)' }}></div>
                      Quantity
                    </h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 rounded-lg bg-white border-2 transition-all duration-300 flex items-center justify-center font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm hover:shadow-md"
                        style={{
                          borderColor: '#A8D5BA',
                          color: '#5FA587'
                        }}
                        disabled={!product.in_stock}
                      >
                        -
                      </button>
                      <div className="w-20 h-12 rounded-lg border-2 flex items-center justify-center shadow-md" style={{
                        background: 'linear-gradient(to right, rgba(168, 213, 186, 0.2), rgba(143, 201, 170, 0.2))',
                        borderColor: '#76BCAA'
                      }}>
                        <span className="text-xl font-bold" style={{
                          background: 'linear-gradient(to right, #5FA587, #76BCAA)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}>{quantity}</span>
                      </div>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 rounded-lg bg-white border-2 transition-all duration-300 flex items-center justify-center font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm hover:shadow-md"
                        style={{
                          borderColor: '#A8D5BA',
                          color: '#5FA587'
                        }}
                        disabled={!product.in_stock}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {product.try_on_enabled && (
                      <button
                        onClick={() => setShowTryOn(true)}
                        className="group w-full py-5 rounded-xl font-bold text-base flex items-center justify-center gap-3 text-white transition-all duration-300 border-2 hover:scale-[1.02] active:scale-95 relative overflow-hidden shadow-lg"
                        style={{
                          background: 'linear-gradient(to right, #76BCAA, #8FC9AA, #76BCAA)',
                          borderColor: '#5FA587',
                          boxShadow: '0 10px 25px -5px rgba(118, 188, 170, 0.5)'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        <Scan className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
                        <span className="relative z-10">Try On Your Hair</span>
                        <Sparkles className="w-4 h-4 relative z-10 animate-pulse" />
                      </button>
                    )}

                    {!justAdded ? (
                      <button
                        onClick={handleAddToCart}
                        disabled={!product.in_stock}
                        className={`group w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 relative overflow-hidden border-2 ${
                          product.in_stock
                            ? 'text-gray-900 hover:scale-[1.02] active:scale-95 shadow-lg'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300'
                        }`}
                        style={product.in_stock ? {
                          background: 'linear-gradient(to right, #B8E6D5, #A8D5BA, #B8E6D5)',
                          borderColor: '#76BCAA',
                          boxShadow: '0 10px 25px -5px rgba(168, 213, 186, 0.4)'
                        } : {}}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        <ShoppingCart className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">{product.in_stock ? 'Add to Cart' : 'Out of Stock'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleGoToCart}
                        className="group w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 text-white transition-all duration-300 hover:scale-[1.02] active:scale-95 relative overflow-hidden border-2 shadow-lg"
                        style={{
                          background: 'linear-gradient(to right, #76BCAA, #8FC9AA, #76BCAA)',
                          borderColor: '#5FA587',
                          boxShadow: '0 10px 25px -5px rgba(118, 188, 170, 0.5)'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        <ShoppingBag className="w-5 h-5 relative z-10 animate-bounce" />
                        <span className="relative z-10">Go to Cart</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className={`group w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] active:scale-95 relative overflow-hidden shadow-md ${
                        isFavorite(product.id)
                          ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border-2 border-red-300 shadow-red-100'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-400 hover:shadow-orange-100'
                      }`}
                    >
                      <Heart className={`w-5 h-5 transition-all duration-300 ${isFavorite(product.id) ? 'fill-red-600' : ''}`} />
                      <span>{isFavorite(product.id) ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
                    </button>
                  </div>

                  {product.description && (
                    <div className="p-6 rounded-xl border-2 shadow-sm" style={{
                      backgroundColor: '#ffffff',
                      borderColor: '#A8D5BA'
                    }}>
                      <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-1 h-6 rounded-full shadow-sm" style={{ background: 'linear-gradient(to bottom, #76BCAA, #8FC9AA)' }}></div>
                        Product Details
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
                    </div>
                  )}

                  {product.availableColors && product.availableColors.length > 0 && (
                    <div className="p-6 rounded-xl border-2 shadow-sm bg-gradient-to-br from-pink-50 to-rose-50" style={{
                      borderColor: '#EC4899'
                    }}>
                      <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <div className="w-1 h-6 rounded-full shadow-sm bg-gradient-to-b from-pink-500 to-rose-500"></div>
                        Dress Color Matching
                      </h3>
                      <div className="bg-white rounded-lg p-4 mb-3 border border-pink-200">
                        <p className="text-sm text-gray-700 leading-relaxed mb-2">
                          This product is available for dress color matching! Upload a photo of your dress to find accessories that perfectly complement your outfit.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-pink-700 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Available in {product.availableColors.length} colors</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.availableColors.map((color, idx) => (
                          <span
                            key={idx}
                            className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-xs font-semibold capitalize border border-pink-300"
                          >
                            {color}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowColorMatcher(true)}
                        className="group w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-3 text-white transition-all duration-300 border-2 hover:scale-[1.02] active:scale-95 relative overflow-hidden shadow-lg"
                        style={{
                          background: 'linear-gradient(to right, #EC4899, #F472B6, #EC4899)',
                          borderColor: '#BE185D',
                          boxShadow: '0 10px 25px -5px rgba(236, 72, 153, 0.5)'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                        <Upload className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform" />
                        <span className="relative z-10">Upload Dress & Check Color Match</span>
                        <Palette className="w-5 h-5 relative z-10 animate-pulse" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {wishlistProducts.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 sm:p-8 border-t-4 border-red-400">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center border-2 border-red-600">
                      <Heart className="w-5 h-5 text-white fill-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Your Wishlist</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {wishlistProducts.map((wishlistProduct) => {
                      const wishlistDiscount = wishlistProduct.compare_at_price
                        ? Math.round(((wishlistProduct.compare_at_price - wishlistProduct.price) / wishlistProduct.compare_at_price) * 100)
                        : 0;

                      return (
                        <button
                          key={wishlistProduct.id}
                          onClick={() => {
                            onClose();
                            setTimeout(() => {
                              const event = new CustomEvent('openProductDetails', { detail: wishlistProduct });
                              window.dispatchEvent(event);
                            }, 300);
                          }}
                          className="group bg-white rounded-xl border-2 border-red-200 hover:border-red-400 transition-all duration-300 overflow-hidden"
                        >
                          <div className="aspect-square overflow-hidden bg-gray-50 relative">
                            <img
                              src={wishlistProduct.image_url}
                              alt={wishlistProduct.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {wishlistDiscount > 0 && (
                              <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold border border-red-700">
                                {wishlistDiscount}% OFF
                              </div>
                            )}
                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full border border-red-200">
                              <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div className="p-4 text-left">
                            <p className="text-sm font-bold text-gray-900 truncate mb-2 group-hover:text-red-600 transition-colors">
                              {wishlistProduct.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-red-700">
                                ₹{wishlistProduct.price}
                              </p>
                              {wishlistProduct.compare_at_price && (
                                <p className="text-xs text-gray-500 line-through">
                                  ₹{wishlistProduct.compare_at_price}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {suggestedProducts.length > 0 && (
                <div className="p-6 sm:p-8 border-t-4 shadow-inner" style={{
                  backgroundColor: '#f0f9f6',
                  borderTopColor: '#76BCAA'
                }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-lg" style={{
                      background: 'linear-gradient(to bottom right, #76BCAA, #8FC9AA)',
                      borderColor: '#5FA587'
                    }}>
                      <Sparkles className="w-5 h-5 text-white fill-white" />
                    </div>
                    <h3 className="text-xl font-bold" style={{
                      background: 'linear-gradient(to right, #5FA587, #76BCAA)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>You Might Also Like</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {suggestedProducts.map((suggestedProduct) => {
                      const suggestedDiscount = suggestedProduct.compare_at_price
                        ? Math.round(((suggestedProduct.compare_at_price - suggestedProduct.price) / suggestedProduct.compare_at_price) * 100)
                        : 0;

                      return (
                        <button
                          key={suggestedProduct.id}
                          onClick={() => {
                            onClose();
                            setTimeout(() => {
                              const event = new CustomEvent('openProductDetails', { detail: suggestedProduct });
                              window.dispatchEvent(event);
                            }, 300);
                          }}
                          className="group bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden shadow-md hover:shadow-xl"
                          style={{
                            borderColor: '#A8D5BA'
                          }}
                        >
                          <div className="aspect-square overflow-hidden relative" style={{
                            background: 'linear-gradient(to bottom right, #fafafa, rgba(168, 213, 186, 0.1))'
                          }}>
                            <img
                              src={suggestedProduct.image_url}
                              alt={suggestedProduct.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {suggestedDiscount > 0 && (
                              <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold border border-red-700 shadow-lg">
                                {suggestedDiscount}% OFF
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div className="p-4 text-left" style={{
                            background: 'linear-gradient(to bottom, white, rgba(168, 213, 186, 0.05))'
                          }}>
                            <p className="text-sm font-bold text-gray-900 truncate mb-2 transition-colors" style={{
                              color: 'inherit'
                            }}>
                              {suggestedProduct.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-red-700">
                                ₹{suggestedProduct.price}
                              </p>
                              {suggestedProduct.compare_at_price && (
                                <p className="text-xs text-gray-500 line-through">
                                  ₹{suggestedProduct.compare_at_price}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      <VirtualTryOn
        isOpen={showTryOn}
        onClose={() => setShowTryOn(false)}
        product={product}
      />

      <DressColorMatcher
        isOpen={showColorMatcher}
        onClose={() => setShowColorMatcher(false)}
        currentProduct={product || undefined}
      />

      {fullScreenImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-300 backdrop-blur-md hover:rotate-90 group z-10 border border-white/20"
          >
            <X className="w-7 h-7 text-white group-hover:text-orange-300" />
          </button>

          <div className="relative max-w-6xl max-h-full animate-scaleIn">
            <img
              src={getProxiedImageUrl(fullScreenImage)}
              alt={product.name}
              className="max-w-full max-h-[90vh] object-contain rounded-xl border-4 border-white/10"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                // Fallback if proxy fails
                const img = e.target as HTMLImageElement;
                img.src = fullScreenImage;
              }}
            />

            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
                    setCurrentImageIndex(newIndex);
                    setFullScreenImage(allImages[newIndex]);
                  }}
                  className="absolute -left-16 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all duration-300 backdrop-blur-md hover:-translate-x-2 border border-white/20"
                >
                  <ChevronLeft className="w-7 h-7 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (currentImageIndex + 1) % allImages.length;
                    setCurrentImageIndex(newIndex);
                    setFullScreenImage(allImages[newIndex]);
                  }}
                  className="absolute -right-16 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all duration-300 backdrop-blur-md hover:translate-x-2 border border-white/20"
                >
                  <ChevronRight className="w-7 h-7 text-white" />
                </button>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 backdrop-blur-md px-4 py-3 rounded-full" style={{
                  background: 'linear-gradient(to right, rgba(0,0,0,0.5), rgba(95,165,135,0.3), rgba(0,0,0,0.5))',
                  borderColor: 'rgba(118, 188, 170, 0.3)'
                }}>
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                        setFullScreenImage(allImages[index]);
                      }}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentImageIndex
                          ? 'w-10 h-3 shadow-lg'
                          : 'bg-white/50 w-3 h-3'
                      }`}
                      style={index === currentImageIndex ? {
                        background: 'linear-gradient(to right, #8FC9AA, #A8D5BA)',
                        boxShadow: '0 0 15px rgba(168, 213, 186, 0.7)'
                      } : {}}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <p className="text-white text-sm font-semibold">
                {currentImageIndex + 1} / {allImages.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {showShareDialog && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowShareDialog(false)}
        >
          <div
            className="bg-[#B5E5CF] rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn border-4 border-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-black">Share Product</h3>
              <button
                onClick={() => setShowShareDialog(false)}
                className="p-2 rounded-full transition-all duration-300 hover:rotate-90 bg-white hover:bg-gray-100 border-2 border-black"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border-2 border-black bg-white">
                <p className="text-sm font-semibold text-black mb-2">Product URL</p>
                <p className="text-xs text-black break-all font-mono bg-[#B5E5CF] p-2 rounded border-2 border-black">
                  {getProductShareUrl()}
                </p>
              </div>

              <button
                onClick={handleCopyLink}
                disabled={copySuccess}
                className="w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-3 text-white transition-all duration-300 border-2 border-black hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-70 bg-black hover:bg-gray-800"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <div className="flex gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} - ₹${currentPrice}\n${getProductShareUrl()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all duration-300 hover:scale-[1.02] active:scale-95"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
                <a
                  href={`https://telegram.me/share/url?url=${encodeURIComponent(getProductShareUrl())}&text=${encodeURIComponent(`Check out ${product.name} - ₹${currentPrice}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all duration-300 hover:scale-[1.02] active:scale-95"
                  style={{ backgroundColor: '#0088cc' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  Telegram
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
