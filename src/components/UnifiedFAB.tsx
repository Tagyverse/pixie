'use client';

import React, { useState } from 'react';
import { X, MessageSquare, Shirt, Palette, MessageCircle, Sparkles } from 'lucide-react';
import FeedbackModal from './FeedbackModal';
import WhatsAppChatModal from './WhatsAppChatModal';
import VirtualTryOn from './VirtualTryOn';

interface UnifiedFABProps {
  onTryOnClick: () => void;
  onColorMatchClick: () => void;
}

type FeatureType = 'feedback' | 'tryon' | 'colormatch' | 'whatsapp' | null;

const features = [
  {
    id: 'feedback',
    label: 'Feedback',
    icon: MessageSquare,
    color: 'from-emerald-400 to-emerald-500',
    bgColor: 'bg-emerald-500 hover:bg-emerald-600'
  },
  {
    id: 'tryon',
    label: 'Virtual Try On',
    icon: Shirt,
    color: 'from-blue-400 to-blue-500',
    bgColor: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'colormatch',
    label: 'Color Match',
    icon: Palette,
    color: 'from-pink-400 to-pink-500',
    bgColor: 'bg-pink-500 hover:bg-pink-600'
  },
  {
    id: 'whatsapp',
    label: 'Chat with us',
    icon: MessageCircle,
    color: 'from-green-400 to-green-500',
    bgColor: 'bg-green-500 hover:bg-green-600'
  }
];

export default function UnifiedFAB({ onTryOnClick, onColorMatchClick }: UnifiedFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<FeatureType>(null);
  const [showDirectTryOn, setShowDirectTryOn] = useState(false);

  const handleFeatureClick = (featureId: string) => {
    if (featureId === 'feedback') {
      setActiveModal('feedback');
      setIsOpen(false);
    } else if (featureId === 'tryon') {
      setShowDirectTryOn(true);
      setIsOpen(false);
    } else if (featureId === 'colormatch') {
      onColorMatchClick();
      setIsOpen(false);
    } else if (featureId === 'whatsapp') {
      setActiveModal('whatsapp');
      setIsOpen(false);
    }
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  return (
    <>
      {/* Main FAB Container - Fixed positioning for true sticky behavior */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 pointer-events-none">
        <div className="flex flex-col items-end gap-2 sm:gap-4 pointer-events-auto">
          {/* Feature Chips - Show when FAB is open */}
          {isOpen && (
            <div className="flex flex-col gap-1.5 sm:gap-3 animate-in fade-in slide-in-from-right-3 duration-300">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature.id)}
                    className={`flex items-center gap-1.5 sm:gap-3 group animate-in fade-in slide-in-from-right-2 duration-300`}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <div className="bg-gray-900 text-white px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-[10px] sm:text-sm font-semibold whitespace-nowrap shadow-lg group-hover:shadow-xl transition-all">
                      {feature.label}
                    </div>
                    <div className={`w-9 h-9 sm:w-14 sm:h-14 ${feature.bgColor} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95`}>
                      <Icon className="w-4 h-4 sm:w-7 sm:h-7" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Main FAB Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-11 h-11 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center active:scale-95 relative ${
              isOpen ? 'rotate-45' : 'rotate-0'
            }`}
            aria-label="Toggle features menu"
          >
            {isOpen ? (
              <X className="w-5 h-5 sm:w-8 sm:h-8" />
            ) : (
              <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Overlay - Close FAB when clicked */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px] cursor-pointer"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modals */}
      {activeModal === 'feedback' && <FeedbackModal onClose={handleCloseModal} />}
      {activeModal === 'whatsapp' && <WhatsAppChatModal onClose={handleCloseModal} />}
      
      {/* Direct Virtual Try-On from Unified FAB */}
      <VirtualTryOn 
        isOpen={showDirectTryOn}
        onClose={() => setShowDirectTryOn(false)}
        product={null}
      />
    </>
  );
}
