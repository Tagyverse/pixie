import { X, Filter, ShoppingBag } from 'lucide-react';
import type { Category } from '../types';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  showInStock: boolean;
  showOnSale: boolean;
  onInStockChange: (checked: boolean) => void;
  onOnSaleChange: (checked: boolean) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export default function FilterBottomSheet({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategorySelect,
  showInStock,
  showOnSale,
  onInStockChange,
  onOnSaleChange,
  sortBy,
  onSortChange
}: FilterBottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 transition-all duration-300">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden transition-transform duration-300 translate-y-0">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <Filter className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Filter & Sort</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-teal-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-5rem)] pb-6">
          <div className="p-6 space-y-6">
            <div className="bg-white rounded-2xl p-5 border-2 border-teal-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-teal-500 to-mint-500 rounded-full"></span>
                Categories
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    onCategorySelect(null);
                    onClose();
                  }}
                  className={`px-3 py-1.5 text-[11px] font-medium tracking-wide transition-all duration-300 rounded-full ${
                    selectedCategory === null
                      ? 'bg-[#3D3321] text-white'
                      : 'bg-[#F5EDE3] text-[#5C4A2F] hover:bg-[#EBE0D2] border border-[#D4C9B5]'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {selectedCategory === null && <span className="w-1 h-1 rounded-full bg-[#C4B590]" />}
                    All
                  </span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      onCategorySelect(category.id);
                      onClose();
                    }}
                    className={`px-3 py-1.5 text-[11px] font-medium tracking-wide transition-all duration-300 rounded-full ${
                      selectedCategory === category.id
                        ? 'bg-[#3D3321] text-white'
                        : 'bg-[#F5EDE3] text-[#5C4A2F] hover:bg-[#EBE0D2] border border-[#D4C9B5]'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {selectedCategory === category.id && <span className="w-1 h-1 rounded-full bg-[#C4B590]" />}
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-teal-50 rounded-2xl p-5 border-2 border-teal-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-teal-500 to-mint-500 rounded-full"></span>
                Sort By
              </h3>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
                <option value="name-za">Name: Z to A</option>
              </select>
            </div>

            <div className="bg-peach-50 rounded-2xl p-5 border-2 border-peach-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-peach-500 to-teal-500 rounded-full"></span>
                Availability
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showInStock}
                    onChange={(e) => onInStockChange(e.target.checked)}
                    className="w-5 h-5 rounded-md border-2 border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-gray-700 font-medium group-hover:text-gray-900">In Stock Only</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={showOnSale}
                    onChange={(e) => onOnSaleChange(e.target.checked)}
                    className="w-5 h-5 rounded-md border-2 border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-gray-700 font-medium group-hover:text-gray-900">On Sale Only</span>
                </label>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-4 rounded-xl font-bold hover:from-teal-600 hover:to-teal-700 transition-all border-2 border-teal-700 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Show Products
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
