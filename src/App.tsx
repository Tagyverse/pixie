'use client';

import { useState, useEffect, Component, ReactNode, lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { PublishedDataProvider, usePublishedData } from './contexts/PublishedDataContext';
import TopBanner from './components/TopBanner';
import Navigation from './components/Navigation';
import LoginModal from './components/LoginModal';
import CartModal from './components/CartModal';
import MyOrdersSheet from './components/MyOrdersSheet';
import PurchaseNotification from './components/PurchaseNotification';
import OfferDialog from './components/OfferDialog';
import WelcomeCouponDialog from './components/WelcomeCouponDialog';
import FeedbackPanel from './components/FeedbackPanel';
import ProductDetailsSheet from './components/ProductDetailsSheet';
import SplashScreen from './components/SplashScreen';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ComingSoon from './pages/ComingSoon';
// Lazy load heavy admin pages for better initial load performance
const Admin = lazy(() => import('./pages/Admin'));
const Checkout = lazy(() => import('./pages/Checkout'));
const SuperAdmin = lazy(() => import('./pages/SuperAdmin'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const Contact = lazy(() => import('./pages/Contact'));
import type { Product } from './types';
import { db } from './lib/firebase';
import { ref, get } from 'firebase/database';
import { initAnalytics, trackPageView } from './utils/analytics';
import { initPerformanceMonitoring } from './utils/performanceMonitoring';
import { initFetchInterceptor } from './utils/fetchInterceptor';
import { enableSmoothScrollCSS } from './utils/smoothScroll';
import { useTrafficTracking } from './hooks/useTrafficTracking';
import PageLoader from './components/PageLoader';

type Page = 'home' | 'shop' | 'admin' | 'checkout' | 'superadmin' | 'privacy-policy' | 'shipping-policy' | 'refund-policy' | 'contact';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 border-2 border-red-200 text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-600 transition-colors border-2 border-teal-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function getInitialPage(): Page {
  const path = window.location.pathname;
  if (path === '/admin') return 'admin';
  if (path === '/superadmin') return 'superadmin';
  if (path === '/shop') return 'shop';
  if (path === '/checkout') return 'checkout';
  if (path === '/privacy-policy') return 'privacy-policy';
  if (path === '/shipping-policy') return 'shipping-policy';
  if (path === '/refund-policy') return 'refund-policy';
  if (path === '/contact') return 'contact';
  return 'home';
}

function AppContent() {
  const { data: publishedData, loading: publishedDataLoading, error: publishedDataError } = usePublishedData();
  const [currentPage, setCurrentPage] = useState<Page>(getInitialPage());
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [ordersSheetOpen, setOrdersSheetOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [temporarilyClosed, setTemporarilyClosed] = useState(false);

  // Enable traffic tracking for all pages
  useTrafficTracking();

  const hideNavigation = currentPage === 'admin' || currentPage === 'checkout' || currentPage === 'superadmin' || currentPage === 'privacy-policy' || currentPage === 'shipping-policy' || currentPage === 'refund-policy' || currentPage === 'contact';
  const isAdminPage = currentPage === 'admin' || currentPage === 'superadmin';

  useEffect(() => {
    // Enable smooth scrolling
    enableSmoothScrollCSS();
    // Initialize fetch interceptor to suppress validation warnings
    initFetchInterceptor();
    // Initialize analytics tracking
    initAnalytics();
    // Initialize performance monitoring
    initPerformanceMonitoring();

    // Load bill settings from Firebase and cache in localStorage
    const loadBillSettings = async () => {
      try {
        const billSettingsRef = ref(db, 'bill_settings');
        const snapshot = await get(billSettingsRef);
        if (snapshot.exists()) {
          localStorage.setItem('billSettings', JSON.stringify(snapshot.val()));
        }
      } catch (error) {
        console.error('Error loading bill settings:', error);
      }
    };

    const checkStoreStatus = async () => {
      try {
        const settingsRef = ref(db, 'site_settings');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const settingsId = Object.keys(data)[0];
          const settings = data[settingsId];
          setTemporarilyClosed(settings.temporarily_closed || false);
        }
      } catch (error) {
        console.error('Error checking store status:', error);
      }
    };

    checkStoreStatus();
    loadBillSettings();
    const interval = setInterval(checkStoreStatus, 30000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleNavigate = (page: Page, categoryId?: string) => {
    setCurrentPage(page);
    setCartModalOpen(false);
    let path = page === 'home' ? '/' : `/${page}`;
    if (categoryId && page === 'shop') {
      path += `?category=${categoryId}`;
    }
    window.history.pushState({}, "", path);
    trackPageView(path);

    if (categoryId && page === "shop") {
      setTimeout(() => {
        const productsSection = document.getElementById('products-section');
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowProductDetails(true);
    const currentPath = window.location.pathname;
    window.history.pushState({}, '', `${currentPath}?product=${product.id}`);
  };

  useEffect(() => {
    const loadProductFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('product');

      if (productId) {
        try {
          const productsRef = ref(db, 'products');
          const snapshot = await get(productsRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            const product = data[productId];
            if (product) {
              setSelectedProduct({ id: productId, ...product });
              setShowProductDetails(true);
            } else {
              const currentPath = window.location.pathname;
              window.history.replaceState({}, '', currentPath);
            }
          }
        } catch (error) {
          console.error('Error loading product:', error);
          const currentPath = window.location.pathname;
          window.history.replaceState({}, '', currentPath);
        }
      } else {
        setShowProductDetails(false);
        setSelectedProduct(null);
      }
    };

    loadProductFromUrl();

    const handlePopState = () => {
      loadProductFromUrl();
      setCurrentPage(getInitialPage());
      window.scrollTo(0, 0);
    };

    window.addEventListener("popstate", handlePopState);

    // Track initial page view
    trackPageView(window.location.pathname + window.location.search);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const renderPage = () => {
    const LoadingFallback = () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-mint-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );

    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} onCartClick={() => setCartModalOpen(true)} />;
      case 'shop':
        return <Shop onCartClick={() => setCartModalOpen(true)} />;
      case 'admin':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Admin />
          </Suspense>
        );
      case 'superadmin':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SuperAdmin />
          </Suspense>
        );
      case 'checkout':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Checkout onBack={() => handleNavigate('shop')} onLoginClick={() => setLoginModalOpen(true)} />
          </Suspense>
        );
      case 'privacy-policy':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PrivacyPolicy onBack={() => handleNavigate('home')} />
          </Suspense>
        );
      case 'shipping-policy':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <ShippingPolicy onBack={() => handleNavigate('home')} />
          </Suspense>
        );
      case 'refund-policy':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <RefundPolicy onBack={() => handleNavigate('home')} />
          </Suspense>
        );
      case 'contact':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <Contact onBack={() => handleNavigate('home')} />
          </Suspense>
        );
      default:
        return <Home onNavigate={handleNavigate} onCartClick={() => setCartModalOpen(true)} />;
    }
  };

  return (
    <>
      <PageLoader 
        isVisible={showSplash && publishedDataLoading} 
        progress={showSplash ? 50 : 100}
        message="Loading Pixie Blooms..."
      />
      
      {showSplash && <SplashScreen onComplete={() => {
        setShowSplash(false);
        setAppReady(true);
      }} />}

      {/* Show Coming Soon if no published data and not on admin pages */}
      {appReady && publishedDataError && !isAdminPage && (
        <ComingSoon />
      )}

      {/* Show normal app if data exists or on admin pages */}
      {((!publishedDataError && appReady) || isAdminPage) && (
        <div className={`min-h-screen bg-white transition-opacity duration-500 ${appReady ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`${temporarilyClosed && !hideNavigation ? 'grayscale pointer-events-none' : ''}`}>
          {!hideNavigation && (
            <>
              <TopBanner />
              <Navigation
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onLoginClick={() => setLoginModalOpen(true)}
                onCartClick={() => setCartModalOpen(true)}
                onOrdersClick={() => setOrdersSheetOpen(true)}
                onProductClick={handleProductClick}
              />
            </>
          )}

          {renderPage()}

          <PurchaseNotification />
          <OfferDialog />
          <WelcomeCouponDialog />
          <FeedbackPanel />

          <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
          <CartModal
            isOpen={cartModalOpen}
            onClose={() => setCartModalOpen(false)}
            onCheckout={() => handleNavigate('checkout')}
          />
          <MyOrdersSheet
            isOpen={ordersSheetOpen}
            onClose={() => setOrdersSheetOpen(false)}
            onLoginClick={() => {
              setOrdersSheetOpen(false);
              setLoginModalOpen(true);
            }}
          />
          <ProductDetailsSheet
            product={selectedProduct}
            isOpen={showProductDetails}
            onClose={() => {
              setShowProductDetails(false);
              setSelectedProduct(null);
              const urlParams = new URLSearchParams(window.location.search);
              if (urlParams.has('product')) {
                const currentPath = window.location.pathname;
                window.history.pushState({}, '', currentPath);
              }
            }}
          />

          {!hideNavigation && <Footer onNavigate={handleNavigate} />}
        </div>

        {temporarilyClosed && !hideNavigation && (
          <div className="fixed top-32 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl shadow-2xl p-6 border-4 border-white max-w-2xl w-full pointer-events-auto animate-pulse">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-3xl">🔒</span>
                  <h2 className="text-2xl font-bold text-white">Temporarily Closed</h2>
                </div>
                <p className="text-white text-base font-medium">
                  We're currently closed. Please check back later. Thank you for your patience.
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PublishedDataProvider>
          <CartProvider>
            <FavoritesProvider>
              <AppContent />
            </FavoritesProvider>
          </CartProvider>
        </PublishedDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
