import React from 'react';

/**
 * Simple Font Test Component
 * Tests if self-hosted fonts are loading correctly
 */
const FontTest: React.FC = () => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-heading text-gray-800 mb-4">
        Font Loading Test
      </h1>
      
      <div className="space-y-2">
        <div className="text-lg font-heading text-blue-600">
          Archivo Black - Heading Font
        </div>
        <div className="text-lg font-number text-green-600">
          Archivo - Number Font
        </div>
        <div className="text-lg font-title text-purple-600">
          Archivo - Title Font
        </div>
        <div className="text-lg font-description text-gray-600">
          Playfair Display - Description Font
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        If you can see different font styles above, the self-hosted fonts are working correctly!
      </div>
    </div>
  );
};

export default FontTest;