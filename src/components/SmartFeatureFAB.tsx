import React, { useState, useEffect } from 'react';
import { Shirt, Palette, Sparkles, X } from 'lucide-react';

interface SmartFeatureFABProps {
  onTryOnClick: () => void;
  onColorMatchClick: () => void;
}

export default function SmartFeatureFAB({ onTryOnClick, onColorMatchClick }: SmartFeatureFABProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState('');

  useEffect(() => {
    const tooltips = ['Try On!', 'Match with Dress'];
    let currentIndex = 0;

    const autoShowInterval = setInterval(() => {
      if (!showFeatures) {
        setTooltipText(tooltips[currentIndex]);
        setShowTooltip(true);

        setTimeout(() => {
          setShowTooltip(false);
        }, 3000);

        currentIndex = (currentIndex + 1) % tooltips.length;
      }
    }, 8000);

    return () => clearInterval(autoShowInterval);
  }, [showFeatures]);

  return (
    <>
      {/* Overlay to close when clicking outside */}
      {showFeatures && (
        <div 
          className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[1px]" 
          onClick={() => setShowFeatures(false)}
        />
      )}

      <div className="fixed bottom-24 right-4 sm:right-6 z-[100] flex flex-col items-end gap-2 sm:gap-3">
        {showFeatures && (
          <>
            <div className="flex items-center gap-2 sm:gap-3 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-pink-500 text-white px-2.5 sm:px-4 py-1 sm:py-2 rounded-lg shadow-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap">
                Match with Dress
              </div>
              <button
                onClick={() => {
                  onColorMatchClick();
                  setShowFeatures(false);
                }}
                className="w-9 h-9 sm:w-12 sm:h-12 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95 border-2 border-white"
                aria-label="Color Match"
                title="Match with Dress"
              >
                <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 animate-in slide-in-from-bottom-8 duration-300">
              <div className="bg-blue-500 text-white px-2.5 sm:px-4 py-1 sm:py-2 rounded-lg shadow-lg text-[10px] sm:text-sm font-semibold whitespace-nowrap">
                Virtual Try On
              </div>
              <button
                onClick={() => {
                  onTryOnClick();
                  setShowFeatures(false);
                }}
                className="w-9 h-9 sm:w-12 sm:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95 border-2 border-white"
                aria-label="Virtual Try On"
                title="Virtual Try On"
              >
                <Shirt className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {showTooltip && !showFeatures && (
            <div className="bg-gray-800 text-white px-2.5 sm:px-4 py-1 sm:py-2 rounded-lg shadow-lg text-[10px] sm:text-sm font-medium whitespace-nowrap animate-in fade-in slide-in-from-right-2 duration-300">
              {tooltipText}
            </div>
          )}

          <button
            onClick={() => setShowFeatures(!showFeatures)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center active:scale-95 border-2 ${
              showFeatures ? 'bg-gray-900 border-gray-700 rotate-90' : 'bg-white border-gray-200'
            }`}
            aria-label="Smart Features"
          >
            {showFeatures ? (
              <X className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            ) : (
              <div className="relative">
                <img
                  src="https://res.cloudinary.com/ds7pknmvg/image/upload/v1770820147/logo-pixieblooms_e09fgp.png"
                  alt="Logo"
                  className="w-7 h-7 sm:w-10 sm:h-10 object-contain"
                />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500 animate-pulse" />
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
