'use client';

import { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { ref, get, set, update } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';

interface NavTheme {
  name: string;
  background: string;
  text: string;
  activeTab: string;
  inactiveButton: string;
  borderRadius: string;
  buttonSize: string;
}

interface ButtonLabels {
  home: string;
  shop: string;
  search: string;
  cart: string;
  myOrders: string;
  login: string;
  signOut: string;
  admin: string;
}

const PRESET_THEMES: NavTheme[] = [
  {
    name: 'Default',
    background: '#F0F5F0',
    text: '#3D4A3D',
    activeTab: '#2D4A3A',
    inactiveButton: '#F0F5F0',
    borderRadius: 'full',
    buttonSize: 'md'
  },
  {
    name: 'Modern Dark',
    background: '#1f2937',
    text: '#f9fafb',
    activeTab: '#3b82f6',
    inactiveButton: '#374151',
    borderRadius: 'lg',
    buttonSize: 'md'
  },
  {
    name: 'Soft Peach',
    background: '#fff7ed',
    text: '#78350f',
    activeTab: '#f97316',
    inactiveButton: '#fed7aa',
    borderRadius: 'full',
    buttonSize: 'md'
  },
  {
    name: 'Ocean Blue',
    background: '#eff6ff',
    text: '#1e3a8a',
    activeTab: '#2563eb',
    inactiveButton: '#dbeafe',
    borderRadius: 'xl',
    buttonSize: 'md'
  },
  {
    name: 'Forest Green',
    background: '#f0fdf4',
    text: '#14532d',
    activeTab: '#166534',
    inactiveButton: '#dcfce7',
    borderRadius: 'full',
    buttonSize: 'md'
  }
];

const BUTTON_SIZE_OPTIONS = [
  { value: 'sm', label: 'Small', padding: 'px-3 py-1.5', text: 'text-xs' },
  { value: 'md', label: 'Medium', padding: 'px-4 py-2', text: 'text-sm' },
  { value: 'lg', label: 'Large', padding: 'px-5 py-2.5', text: 'text-base' },
  { value: 'xl', label: 'Extra Large', padding: 'px-6 py-3', text: 'text-lg' }
];

const BORDER_RADIUS_OPTIONS = [
  { value: 'none', label: 'Square', class: 'rounded-none' },
  { value: 'sm', label: 'Small', class: 'rounded-sm' },
  { value: 'md', label: 'Medium', class: 'rounded-md' },
  { value: 'lg', label: 'Large', class: 'rounded-lg' },
  { value: 'xl', label: 'Extra Large', class: 'rounded-xl' },
  { value: '2xl', label: '2X Large', class: 'rounded-2xl' },
  { value: 'full', label: 'Pill', class: 'rounded-full' }
];

export default function NavigationCustomizer() {
  const { user } = useAuth();
  const [navBgColor, setNavBgColor] = useState('#F0F5F0');
  const [navTextColor, setNavTextColor] = useState('#3D4A3D');
  const [activeTabColor, setActiveTabColor] = useState('#2D4A3A');
  const [inactiveButtonColor, setInactiveButtonColor] = useState('#F0F5F0');
  const [borderRadius, setBorderRadius] = useState('full');
  const [buttonSize, setButtonSize] = useState('md');
  const [themeMode, setThemeMode] = useState<'default' | 'preset' | 'custom'>('default');
  const [saving, setSaving] = useState(false);
  const [buttonLabels, setButtonLabels] = useState<ButtonLabels>({
    home: 'Home',
    shop: 'Shop All',
    search: 'Search',
    cart: 'Cart',
    myOrders: 'My Orders',
    login: 'Login',
    signOut: 'Sign Out',
    admin: 'Admin'
  });

  useEffect(() => {
    loadNavigation();
  }, []);

  const loadNavigation = async () => {
    try {
      console.log('[NAV] Loading from navigation_settings...');
      const navStyleRef = ref(db, 'navigation_settings');
      const styleSnap = await get(navStyleRef);

      if (styleSnap.exists()) {
        const style = styleSnap.val();
        console.log('[NAV] Loaded navigation_settings:', style);
        setNavBgColor(style.background || '#F0F5F0');
        setNavTextColor(style.text || '#3D4A3D');
        setActiveTabColor(style.activeTab || '#2D4A3A');
        setInactiveButtonColor(style.inactiveButton || '#F0F5F0');
        setBorderRadius(style.borderRadius || 'full');
        setButtonSize(style.buttonSize || 'md');
        setThemeMode(style.themeMode || 'default');
        if (style.buttonLabels) {
          setButtonLabels({
            home: style.buttonLabels.home || 'Home',
            shop: style.buttonLabels.shop || 'Shop All',
            search: style.buttonLabels.search || 'Search',
            cart: style.buttonLabels.cart || 'Cart',
            myOrders: style.buttonLabels.myOrders || 'My Orders',
            login: style.buttonLabels.login || 'Login',
            signOut: style.buttonLabels.signOut || 'Sign Out',
            admin: style.buttonLabels.admin || 'Admin'
          });
        }
      } else {
        console.log('[NAV] No navigation_settings found, using defaults');
      }
    } catch (error) {
      console.error('[NAV] Error loading navigation:', error);
    }
  };

  const saveNavigation = async () => {
    setSaving(true);
    try {
      // Check if user is authenticated
      if (!user) {
        alert('You must be logged in to save navigation settings. Please sign in first.');
        setSaving(false);
        return;
      }

      // Get fresh auth token to ensure valid credentials
      const idToken = await user.getIdToken();
      console.log('[NAV] User authenticated, ID token obtained:', user.uid);

      const styleData = {
        background: navBgColor,
        text: navTextColor,
        activeTab: activeTabColor,
        inactiveButton: inactiveButtonColor,
        borderRadius: borderRadius,
        buttonSize: buttonSize,
        themeMode: themeMode,
        buttonLabels: buttonLabels,
        savedAt: new Date().toISOString()
      };

      console.log('[NAV] Saving to navigation_settings:', styleData);
      
      // Save to the correct Firebase path that matches the Rules
      // Use update() instead of set() for better compatibility with Firebase rules
      await update(ref(db, 'navigation_settings'), styleData);
      console.log('[NAV] Successfully saved to navigation_settings');

      // Verify the save worked by reading it back
      const verifySnapshot = await get(ref(db, 'navigation_settings'));
      if (verifySnapshot.exists()) {
        console.log('[NAV] Verification SUCCESS: Data was saved and can be read back:', verifySnapshot.val());
        alert('Navigation settings saved successfully! Remember to click "Publish to Live" to update the live site.');
      } else {
        console.log('[NAV] Verification FAILED: Data was not saved or cannot be read back');
        alert('Navigation settings saved, but verification failed. Please check browser console.');
      }
      
      // Reload to verify persistence
      setTimeout(() => {
        loadNavigation();
      }, 500);
    } catch (error) {
      console.error('[NAV] Error saving navigation:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[NAV] Current user:', user);
      console.error('[NAV] Error details:', error);
      
      if (errorMsg.includes('Permission denied') || errorMsg.includes('PERMISSION_DENIED')) {
        const debugMsg = user ? `User ${user.uid} doesn't have write permission to navigation_settings` : 'User is not authenticated';
        console.error('[NAV] Permission error details:', debugMsg);
        alert(`Failed to save: Firebase permissions issue.\n\n${debugMsg}\n\nMake sure you are signed in with the correct admin account.`);
      } else if (errorMsg.includes('Network')) {
        alert('Network error: Please check your connection and try again.');
      } else {
        alert('Failed to save navigation settings.\n\nError: ' + errorMsg + '\n\nPlease check the browser console for more details.');
      }
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (theme: NavTheme) => {
    setNavBgColor(theme.background);
    setNavTextColor(theme.text);
    setActiveTabColor(theme.activeTab);
    setInactiveButtonColor(theme.inactiveButton);
    setBorderRadius(theme.borderRadius);
    setButtonSize(theme.buttonSize);
  };

  const resetToDefault = () => {
    const defaultTheme = PRESET_THEMES[0];
    applyPreset(defaultTheme);
    setThemeMode('default');
    setButtonLabels({
      home: 'Home',
      shop: 'Shop All',
      search: 'Search',
      cart: 'Cart',
      myOrders: 'My Orders',
      login: 'Login',
      signOut: 'Sign Out',
      admin: 'Admin'
    });
  };

  return (
    <div className="space-y-6">
      {/* Auth Status Indicator */}
      <div className={`p-3 rounded-lg ${user ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <p className={`text-sm font-medium ${user ? 'text-green-800' : 'text-red-800'}`}>
          {user ? `✓ Signed in as ${user.email}` : '✗ Not authenticated - Please sign in to save navigation settings'}
        </p>
      </div>

      <div className="flex justify-between items-center flex-wrap gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Navigation Settings</h3>
        <div className="flex gap-2">
          <button
            onClick={resetToDefault}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          <button
            onClick={saveNavigation}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Theme Mode</h4>
          <div className="flex gap-3">
            <button
              onClick={() => setThemeMode('default')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                themeMode === 'default'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Default Only
            </button>
            <button
              onClick={() => setThemeMode('preset')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                themeMode === 'preset'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Preset Theme
            </button>
            <button
              onClick={() => setThemeMode('custom')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                themeMode === 'custom'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Theme
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-4">Button Size</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BUTTON_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setButtonSize(option.value)}
                className={`${option.padding} ${option.text} border-2 font-medium transition-all rounded-lg ${
                  buttonSize === option.value
                    ? 'bg-teal-500 text-white border-teal-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-4">Border Radius</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {BORDER_RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setBorderRadius(option.value)}
                className={`px-4 py-2 border-2 font-medium transition-all ${option.class} ${
                  borderRadius === option.value
                    ? 'bg-teal-500 text-white border-teal-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {themeMode === 'preset' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Preset Themes (Colors Only)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => {
                    setNavBgColor(theme.background);
                    setNavTextColor(theme.text);
                    setActiveTabColor(theme.activeTab);
                    setInactiveButtonColor(theme.inactiveButton);
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-teal-400 transition-all text-left"
                  style={{ backgroundColor: theme.background }}
                >
                  <div className="font-semibold mb-2" style={{ color: theme.text }}>
                    {theme.name}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className="px-3 py-1.5 text-sm font-medium rounded-lg"
                      style={{
                        backgroundColor: theme.activeTab,
                        color: '#ffffff'
                      }}
                    >
                      Active
                    </div>
                    <div
                      className="px-3 py-1.5 text-sm font-medium rounded-lg"
                      style={{
                        backgroundColor: theme.inactiveButton,
                        color: theme.text
                      }}
                    >
                      Inactive
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {themeMode === 'custom' && (
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Custom Colors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={navBgColor}
                  onChange={(e) => setNavBgColor(e.target.value)}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={navBgColor}
                  onChange={(e) => setNavBgColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={navTextColor}
                  onChange={(e) => setNavTextColor(e.target.value)}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={navTextColor}
                  onChange={(e) => setNavTextColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Button Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={activeTabColor}
                  onChange={(e) => setActiveTabColor(e.target.value)}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={activeTabColor}
                  onChange={(e) => setActiveTabColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inactive Button Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={inactiveButtonColor}
                  onChange={(e) => setInactiveButtonColor(e.target.value)}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={inactiveButtonColor}
                  onChange={(e) => setInactiveButtonColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
          </div>
        )}

        <div>
          <h4 className="font-medium text-gray-900 mb-4">Button Labels</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Home Button</label>
              <input
                type="text"
                value={buttonLabels.home}
                onChange={(e) => setButtonLabels({ ...buttonLabels, home: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shop Button</label>
              <input
                type="text"
                value={buttonLabels.shop}
                onChange={(e) => setButtonLabels({ ...buttonLabels, shop: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Button</label>
              <input
                type="text"
                value={buttonLabels.search}
                onChange={(e) => setButtonLabels({ ...buttonLabels, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cart Button</label>
              <input
                type="text"
                value={buttonLabels.cart}
                onChange={(e) => setButtonLabels({ ...buttonLabels, cart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">My Orders Button</label>
              <input
                type="text"
                value={buttonLabels.myOrders}
                onChange={(e) => setButtonLabels({ ...buttonLabels, myOrders: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Login Button</label>
              <input
                type="text"
                value={buttonLabels.login}
                onChange={(e) => setButtonLabels({ ...buttonLabels, login: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sign Out Button</label>
              <input
                type="text"
                value={buttonLabels.signOut}
                onChange={(e) => setButtonLabels({ ...buttonLabels, signOut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Button</label>
              <input
                type="text"
                value={buttonLabels.admin}
                onChange={(e) => setButtonLabels({ ...buttonLabels, admin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
