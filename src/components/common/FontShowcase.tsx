import React from 'react';

/**
 * Font Showcase Component
 * Demonstrates the usage of self-hosted fonts with Tailwind classes
 */
const FontShowcase: React.FC = () => {
  return (
    <div className="p-8 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Self-Hosted Fonts Showcase
      </h1>
      
      {/* Archivo Black - Heading Font */}
      <section className="mb-8">
        <h2 className="text-2xl font-heading text-gray-800 mb-4">
          Archivo Black - Heading Font
        </h2>
        <div className="space-y-3">
          <h1 className="text-4xl font-heading text-primary-600">
            Main Heading (Archivo Black)
          </h1>
          <h2 className="text-3xl font-heading text-gray-700">
            Section Heading (Archivo Black)
          </h2>
          <h3 className="text-2xl font-heading text-gray-600">
            Subsection Heading (Archivo Black)
          </h3>
        </div>
      </section>

      {/* Archivo - Number & Title Font */}
      <section className="mb-8">
        <h2 className="text-2xl font-heading text-gray-800 mb-4">
          Archivo - Number & Title Font
        </h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <span className="text-3xl font-number text-primary-600 font-bold">
              $12,345.67
            </span>
            <span className="text-lg font-title text-gray-600">
              Account Balance
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-number text-success-600 font-semibold">
              +$1,234.56
            </span>
            <span className="text-base font-title text-gray-500">
              This Month
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xl font-number text-warning-600 font-medium">
              -$89.99
            </span>
            <span className="text-sm font-title text-gray-500">
              Recent Transaction
            </span>
          </div>
        </div>
      </section>

      {/* Playfair Display - Description Font */}
      <section className="mb-8">
        <h2 className="text-2xl font-heading text-gray-800 mb-4">
          Playfair Display - Description Font
        </h2>
        <div className="space-y-4">
          <p className="text-lg font-description text-gray-700 leading-relaxed">
            This is a beautiful description using Playfair Display. The serif font 
            adds elegance and readability to longer text content, making it perfect 
            for descriptions, articles, and detailed information.
          </p>
          <p className="text-base font-description text-gray-600 leading-relaxed italic">
            "Financial success is not about how much money you make, but about how 
            much money you keep and how hard it works for you." - Robert Kiyosaki
          </p>
          <p className="text-sm font-description text-gray-500 leading-relaxed">
            Use this font for body text, descriptions, quotes, and any content that 
            requires enhanced readability and a touch of sophistication.
          </p>
        </div>
      </section>

      {/* Combined Usage Example */}
      <section className="mb-8">
        <h2 className="text-2xl font-heading text-gray-800 mb-4">
          Combined Usage Example
        </h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-title text-gray-800 mb-2">
            Monthly Financial Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-number text-success-600 font-bold">
                $5,432.10
              </div>
              <div className="text-sm font-title text-gray-600">
                Total Income
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-number text-error-600 font-bold">
                $3,210.50
              </div>
              <div className="text-sm font-title text-gray-600">
                Total Expenses
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-number text-primary-600 font-bold">
                $2,221.60
              </div>
              <div className="text-sm font-title text-gray-600">
                Net Savings
              </div>
            </div>
          </div>
          <p className="text-sm font-description text-gray-600 leading-relaxed">
            Your financial health is looking great this month! You've managed to save 
            a significant portion of your income while maintaining a healthy balance 
            between income and expenses.
          </p>
        </div>
      </section>

      {/* Font Weight Examples */}
      <section className="mb-8">
        <h2 className="text-2xl font-heading text-gray-800 mb-4">
          Font Weight Examples
        </h2>
        <div className="space-y-2">
          <div className="text-lg font-title font-light text-gray-600">
            Light (300) - Archivo Light
          </div>
          <div className="text-lg font-title font-normal text-gray-600">
            Regular (400) - Archivo Regular
          </div>
          <div className="text-lg font-title font-medium text-gray-600">
            Medium (500) - Archivo Medium
          </div>
          <div className="text-lg font-title font-semibold text-gray-600">
            SemiBold (600) - Archivo SemiBold
          </div>
          <div className="text-lg font-title font-bold text-gray-600">
            Bold (700) - Archivo Bold
          </div>
        </div>
      </section>

      {/* CSS Classes Reference */}
      <section className="mb-8">
        <h2 className="text-2xl font-heading text-gray-800 mb-4">
          Available Tailwind Classes
        </h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="space-y-2 text-sm font-mono">
            <div><code className="bg-white px-2 py-1 rounded">font-heading</code> - Archivo Black</div>
            <div><code className="bg-white px-2 py-1 rounded">font-number</code> - Archivo</div>
            <div><code className="bg-white px-2 py-1 rounded">font-title</code> - Archivo</div>
            <div><code className="bg-white px-2 py-1 rounded">font-description</code> - Playfair Display</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FontShowcase;
