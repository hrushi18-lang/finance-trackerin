import React from 'react';
import { useFontLoading } from '../hooks/useFontLoading';
import { mobileFontLoader } from '../utils/mobileFontLoader';

const FontTest: React.FC = () => {
  const { fontsLoaded, fontsLoading, fontError } = useFontLoading();
  const status = mobileFontLoader.getLoadingStatus();

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Font Loading Test</h1>
        
        {/* Font Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Font Loading Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {fontsLoading ? '⏳' : fontsLoaded ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600">
                {fontsLoading ? 'Loading...' : fontsLoaded ? 'Loaded' : 'Error'}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {status.loaded.length}
              </div>
              <div className="text-sm text-gray-600">Fonts Loaded</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(status.progress)}%
              </div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
          </div>
        </div>

        {/* Font Samples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Archivo Font */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Archivo Font</h3>
            <div className="space-y-3">
              <div className="font-heading text-2xl">Heading Text (Archivo Black)</div>
              <div className="font-numbers text-xl">Numbers: $1,234.56</div>
              <div className="font-titles text-lg">Title Text (Archivo)</div>
              <div className="font-body text-base">Body text with normal weight</div>
            </div>
          </div>

          {/* Playfair Display Font */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Playfair Display Font</h3>
            <div className="space-y-3">
              <div className="font-description text-xl italic">Elegant serif text</div>
              <div className="font-serif text-lg italic">Serif italic text</div>
              <div className="font-serif-light text-base italic">Light serif text</div>
            </div>
          </div>
        </div>

        {/* Font Loading Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Loading Details</h3>
          <div className="space-y-2">
            <div><strong>Loaded Fonts:</strong> {status.loaded.join(', ') || 'None'}</div>
            <div><strong>Loading Fonts:</strong> {status.loading.join(', ') || 'None'}</div>
            <div><strong>Total Fonts:</strong> {status.total}</div>
            <div><strong>Error:</strong> {fontError ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={() => mobileFontLoader.reloadFonts()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Fonts
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default FontTest;
