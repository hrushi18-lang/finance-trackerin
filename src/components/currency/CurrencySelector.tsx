import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { useEnhancedCurrency } from '../../contexts/EnhancedCurrencyContext';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  showFlag?: boolean;
  showFullName?: boolean;
  popularOnly?: boolean;
  className?: string;
  error?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  label,
  placeholder = "Select currency",
  disabled = false,
  showFlag = true,
  showFullName = false,
  popularOnly = false,
  className = "",
  error
}) => {
  const { 
    supportedCurrencies, 
    getCurrencyInfo, 
    getPopularCurrencies, 
    searchCurrencies 
  } = useEnhancedCurrency();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get currencies to display
  const displayCurrencies = popularOnly 
    ? getPopularCurrencies()
    : searchQuery 
      ? searchCurrencies(searchQuery)
      : supportedCurrencies;

  const selectedCurrency = getCurrencyInfo(value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (currencyCode: string) => {
    onChange(currencyCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Selected Currency Display */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between px-3 py-2 border rounded-lg
            bg-white text-left transition-colors duration-200
            ${disabled 
              ? 'border-gray-200 text-gray-400 cursor-not-allowed' 
              : error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500'
            }
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
        >
          <div className="flex items-center space-x-2">
            {selectedCurrency ? (
              <>
                {showFlag && (
                  <span className="text-lg">{selectedCurrency.flag_emoji}</span>
                )}
                <span className="font-medium">{selectedCurrency.code}</span>
                <span className="text-gray-500">{selectedCurrency.symbol}</span>
                {showFullName && (
                  <span className="text-sm text-gray-600">
                    {selectedCurrency.name}
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            {/* Search Input */}
            {!popularOnly && (
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search currencies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Currency List */}
            <div className="max-h-60 overflow-y-auto">
              {displayCurrencies.length > 0 ? (
                displayCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => handleSelect(currency.code)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-left
                      hover:bg-blue-50 transition-colors duration-150
                      ${value === currency.code ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {showFlag && (
                        <span className="text-lg">{currency.flag_emoji}</span>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{currency.code}</span>
                          <span className="text-gray-500 text-sm">{currency.symbol}</span>
                        </div>
                        <span className="text-xs text-gray-500">{currency.name}</span>
                      </div>
                    </div>
                    {value === currency.code && (
                      <Check size={16} className="text-blue-600" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  No currencies found
                </div>
              )}
            </div>

            {/* Popular Currencies Footer (when not in popularOnly mode) */}
            {!popularOnly && searchQuery === '' && (
              <div className="p-2 border-t border-gray-100 bg-gray-50">
                <div className="text-xs text-gray-600 mb-2">Popular currencies:</div>
                <div className="flex flex-wrap gap-1">
                  {getPopularCurrencies().slice(0, 6).map((currency) => (
                    <button
                      key={currency.code}
                      type="button"
                      onClick={() => handleSelect(currency.code)}
                      className={`
                        px-2 py-1 text-xs rounded-md border transition-colors duration-150
                        ${value === currency.code 
                          ? 'bg-blue-100 border-blue-300 text-blue-700' 
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }
                      `}
                    >
                      {currency.flag_emoji} {currency.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
