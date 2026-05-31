'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Search, Home as HomeIcon, Store, User, LogOut, Settings, X, ShoppingCart, Package } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { usePublishedData } from '../contexts/PublishedDataContext';
import { objectToArray } from '../utils/publishedData';
import type { Product } from '../types';

interface NavigationProps {
  currentPage: 'home' | 'shop' | 'admin' | 'checkout';
  onNavigate: (page: 'home' | 'shop' | 'admin' | 'checkout') => void;
  onLoginClick: () => void;
  onCartClick: () => void;
  onOrdersClick: () => void;
  onProductClick?: (product: Product) => void;
}

export default function Navigation({ currentPage, onNavigate, onLoginClick, onCartClick, onOrdersClick, onProductClick }: NavigationProps) {
  const { user, signOut } = useAuth();
  const { itemCount, addToCart } = useCart();
  const { data: publishedData } = usePublishedData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isDevelopment = import.meta.env.DEV;

  const [navStyle, setNavStyle] = useState({
    background: '#F0F5F0',
    text: '#3D4A3D',
    activeTab: '#2D4A3A',
    inactiveButton: '#F0F5F0',
    borderRadius: 'full',
    buttonSize: 'md',
    themeMode: 'default'
  });

  const [buttonLabels, setButtonLabels] = useState({
    home: 'Home',
    shop: 'Shop All',
    search: 'Search',
    cart: 'Cart',
    myOrders: 'Orders',
    login: 'Login',
    signOut: 'Sign Out',
    admin: 'Admin'
  });

  useEffect(() => {
    if (!publishedData) return;
    if (!publishedData.navigation_settings) return;

    try {
      const style = publishedData.navigation_settings;
      setNavStyle({
        background: style.background || '#F0F5F0',
        text: style.text || '#3D4A3D',
        activeTab: style.activeTab || '#2D4A3A',
        inactiveButton: style.inactiveButton || '#F0F5F0',
        borderRadius: style.borderRadius || 'full',
        buttonSize: style.buttonSize || 'md',
        themeMode: style.themeMode || 'default'
      });

      if (style.buttonLabels) {
        setButtonLabels({
          home: style.buttonLabels.home || 'Home',
          shop: style.buttonLabels.shop || 'Shop All',
          search: style.buttonLabels.search || 'Search',
          cart: style.buttonLabels.cart || 'Cart',
          myOrders: style.buttonLabels.myOrders || 'Orders',
          login: style.buttonLabels.login || 'Login',
          signOut: style.buttonLabels.signOut || 'Sign Out',
          admin: style.buttonLabels.admin || 'Admin'
        });
      }
    } catch (error) {
      console.error('[NAVIGATION] Error loading navigation style:', error);
    }
  }, [publishedData]);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    try {
      const isAdminUser = publishedData?.admins?.[user.uid] || publishedData?.super_admins?.[user.uid];
      setIsAdmin(!!isAdminUser);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  }, [user, publishedData]);

  useEffect(() => {
    if (searchOpen && publishedData?.products) {
      try {
        setLoading(true);
        const productsData: Product[] = objectToArray<Product>(publishedData.products);
        setProducts(productsData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setLoading(false);
      }
    }
  }, [searchOpen, publishedData]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  return (
    <nav className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-2.5 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            {/* Home - Active style */}
            <NavPill
              active={currentPage === 'home'}
              onClick={() => onNavigate('home')}
              icon={<HomeIcon className="w-3.5 h-3.5" />}
              label={buttonLabels.home}
              navStyle={navStyle}
            />

            {/* Shop All */}
            <NavPill
              active={currentPage === 'shop'}
              onClick={() => onNavigate('shop')}
              icon={<Store className="w-3.5 h-3.5" />}
              label={buttonLabels.shop}
              navStyle={navStyle}
            />

            {/* Search */}
            <NavPill
              active={false}
              onClick={() => setSearchOpen(true)}
              icon={<Search className="w-3.5 h-3.5" />}
              label={buttonLabels.search}
              navStyle={navStyle}
            />

            {/* Cart */}
            <NavPill
              active={false}
              onClick={onCartClick}
              icon={<ShoppingBag className="w-3.5 h-3.5" />}
              label={buttonLabels.cart}
              navStyle={navStyle}
              badge={itemCount > 0 ? itemCount : undefined}
            />

            {/* Orders (logged in) */}
            {user && (
              <NavPill
                active={false}
                onClick={onOrdersClick}
                icon={<Package className="w-3.5 h-3.5" />}
                label={buttonLabels.myOrders}
                navStyle={navStyle}
              />
            )}

            {/* Admin (if admin user or dev) */}
            {user && (isAdmin || isDevelopment) && (
              <NavPill
                active={currentPage === 'admin'}
                onClick={() => onNavigate('admin')}
                icon={<Settings className="w-3.5 h-3.5" />}
                label={buttonLabels.admin}
                navStyle={navStyle}
              />
            )}

            {/* Login / Sign Out */}
            {user ? (
              <NavPill
                active={false}
                onClick={() => signOut()}
                icon={<LogOut className="w-3.5 h-3.5" />}
                label={buttonLabels.signOut}
                navStyle={navStyle}
              />
            ) : (
              <NavPill
                active={false}
                onClick={onLoginClick}
                icon={<User className="w-3.5 h-3.5" />}
                label={buttonLabels.login}
                navStyle={navStyle}
              />
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSearchOpen(false)}></div>

          <div className="relative bg-white rounded-3xl border border-[#C4B590] w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#E8DDD0]">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B8B6B]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 border-2 border-[#C4B590] rounded-full focus:outline-none focus:ring-2 focus:ring-[#8B7D3C] focus:border-[#8B7D3C] text-[#3D3321] bg-[#FDF6EE]"
                  />
                </div>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-[#C4B590] hover:border-[#8B7D3C] transition-colors bg-white"
                >
                  <X className="w-5 h-5 text-[#5C4A2F]" />
                </button>
              </div>

              {searchQuery && (
                <p className="text-sm text-[#7A6B52]">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'} found
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-[#C4B590] border-t-[#8B7D3C] rounded-full animate-spin"></div>
                  <p className="text-[#7A6B52] mt-4">Loading products...</p>
                </div>
              ) : searchQuery === '' ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-[#D4C9B5] mx-auto mb-4" />
                  <p className="text-[#5C4A2F] text-lg font-semibold mb-2">Start typing to search</p>
                  <p className="text-[#7A6B52] text-sm">Search through our collection of products</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-[#D4C9B5] mx-auto mb-4" />
                  <p className="text-[#5C4A2F] text-lg font-semibold mb-2">No products found</p>
                  <p className="text-[#7A6B52] text-sm">Try different keywords</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        if (onProductClick) {
                          onProductClick(product);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                      className="flex gap-4 bg-white rounded-2xl p-4 border border-[#E8DDD0] hover:border-[#C4B590] transition-all cursor-pointer group hover:shadow-md"
                    >
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-xl border border-[#E8DDD0] group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-[#3D3321] mb-1 group-hover:text-[#8B7D3C] transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-[#7A6B52] line-clamp-2 mb-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-[#8B7D3C]">
                            {'\u20B9'}{product.price.toFixed(2)}
                          </span>
                          {product.in_stock && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                              }}
                              className="flex items-center gap-2 bg-[#3D3321] text-white px-3 py-1.5 rounded-full text-sm font-semibold hover:bg-[#5C4A2F] transition-colors"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Add
                            </button>
                          )}
                          {!product.in_stock && (
                            <span className="text-sm text-[#9B8B6B] font-semibold">Out of Stock</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

interface NavPillProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  navStyle: {
    activeTab: string;
    inactiveButton: string;
    text: string;
  };
  badge?: number;
}

function NavPill({ active, onClick, icon, label, navStyle, badge }: NavPillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full
        text-[11px] sm:text-xs font-medium tracking-wide transition-all duration-300
        ${active
          ? 'shadow-sm'
          : 'hover:shadow-sm'
        }
      `}
      style={{
        backgroundColor: active ? '#2D4A3A' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#3D4A3D',
        border: active ? '1.5px solid #7BAF7B' : '1.5px solid #7BAF7B',
      }}
    >
      <span
        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: active ? 'rgba(123, 175, 123, 0.25)' : '#F0F5F0',
          border: active ? '1px solid #7BAF7B' : '1px solid #C8D4C8',
          color: active ? '#FFFFFF' : '#2D4A3A',
        }}
      >
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>

      {badge !== undefined && (
        <span
          className="absolute -top-1.5 -right-1.5 w-4 h-4 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white shadow-sm"
          style={{ backgroundColor: '#C4532A' }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
