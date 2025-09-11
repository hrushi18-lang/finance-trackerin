import React from 'react';
import FontShowcase from '../components/common/FontShowcase';

/**
 * Font Test Page
 * Visit this page to test if self-hosted fonts are working correctly
 */
const FontTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading text-gray-800 mb-4">
            Self-Hosted Fonts Test
          </h1>
          <p className="text-lg font-description text-gray-600">
            This page tests if your self-hosted fonts are working correctly.
          </p>
        </div>
        
        <FontShowcase />
        
        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-heading text-gray-800 mb-4">
            Quick Font Test
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-title text-blue-600 mb-2">
                Archivo Black (Heading)
              </h3>
              <p className="text-lg font-heading text-gray-700">
                This is Archivo Black - perfect for main headings and titles.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-title text-green-600 mb-2">
                Archivo (Numbers & Titles)
              </h3>
              <p className="text-lg font-number text-gray-700">
                $12,345.67 - This is Archivo, great for numbers and data.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="text-xl font-title text-purple-600 mb-2">
                Playfair Display (Descriptions)
              </h3>
              <p className="text-lg font-description text-gray-700">
                This is Playfair Display - elegant for descriptions and body text.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-title text-green-800 mb-2">
              ✅ Success!
            </h3>
            <p className="text-base font-description text-green-700">
              If you can see different font styles above, your self-hosted fonts are working correctly!
              No more Google Fonts dependencies, and everything works offline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontTestPage;
