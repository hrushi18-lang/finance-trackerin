import React from 'react';

/**
 * Local Font Test Component
 * Tests if self-hosted fonts are loading correctly from src/assets/fonts/
 */
const LocalFontTest: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-heading text-gray-800 mb-6 text-center">
        Local Font Test - No Google Fonts
      </h1>
      
      <div className="space-y-6">
        {/* Archivo Black Test */}
        <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
          <h2 className="text-xl font-title text-blue-800 mb-2">
            Archivo Black (Heading Font)
          </h2>
          <div className="space-y-2">
            <h1 className="text-4xl font-heading text-blue-900">
              Main Heading - Archivo Black
            </h1>
            <h2 className="text-3xl font-heading text-blue-700">
              Section Heading - Archivo Black
            </h2>
            <h3 className="text-2xl font-heading text-blue-600">
              Subsection - Archivo Black
            </h3>
          </div>
        </div>

        {/* Archivo Test */}
        <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
          <h2 className="text-xl font-title text-green-800 mb-2">
            Archivo (Numbers & Titles)
          </h2>
          <div className="space-y-2">
            <div className="text-3xl font-number text-green-900 font-bold">
              $12,345.67
            </div>
            <div className="text-2xl font-number text-green-700 font-semibold">
              +$1,234.56
            </div>
            <div className="text-xl font-number text-green-600 font-medium">
              -$89.99
            </div>
            <div className="text-lg font-title text-green-800">
              Account Balance Title
            </div>
          </div>
        </div>

        {/* Playfair Display Test */}
        <div className="p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
          <h2 className="text-xl font-title text-purple-800 mb-2">
            Playfair Display (Descriptions)
          </h2>
          <div className="space-y-3">
            <p className="text-lg font-description text-purple-900">
              This is a beautiful description using Playfair Display. The serif font 
              adds elegance and readability to longer text content, making it perfect 
              for descriptions, articles, and detailed information.
            </p>
            <p className="text-base font-description text-purple-700 italic">
              "Financial success is not about how much money you make, but about how 
              much money you keep and how hard it works for you." - Robert Kiyosaki
            </p>
          </div>
        </div>

        {/* Font Weight Test */}
        <div className="p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
          <h2 className="text-xl font-title text-orange-800 mb-2">
            Font Weight Test (Archivo)
          </h2>
          <div className="space-y-1">
            <div className="text-lg font-title font-light text-orange-900">
              Light (300) - Archivo Light
            </div>
            <div className="text-lg font-title font-normal text-orange-900">
              Regular (400) - Archivo Regular
            </div>
            <div className="text-lg font-title font-medium text-orange-900">
              Medium (500) - Archivo Medium
            </div>
            <div className="text-lg font-title font-semibold text-orange-900">
              SemiBold (600) - Archivo SemiBold
            </div>
            <div className="text-lg font-title font-bold text-orange-900">
              Bold (700) - Archivo Bold
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="p-4 border-2 border-green-300 rounded-lg bg-green-100">
          <h3 className="text-xl font-heading text-green-800 mb-2">
            ✅ Success! Local Fonts Working
          </h3>
          <p className="text-base font-description text-green-700">
            If you can see different font styles above, your self-hosted fonts are working correctly!
            No more Google Fonts dependencies, and everything works offline.
          </p>
          <div className="mt-3 text-sm font-title text-green-600">
            <strong>Fonts loaded from:</strong> src/assets/fonts/
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalFontTest;
