import React from 'react';

/**
 * Font Specifications Component
 * Documents the exact font hierarchy as per design specifications
 */
export const FontSpecifications: React.FC = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="font-heading text-2xl mb-6">Font Specifications</h2>
      
      <div className="space-y-6">
        {/* Headings Font */}
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="font-heading text-lg mb-2">Headings Font</h3>
          <p className="font-titles text-sm text-gray-600 mb-2">
            <strong>FONT NAME:</strong> Archivo Black, Google Font
          </p>
          <div className="font-heading text-3xl">Sample Heading</div>
        </div>

        {/* Numbers Font */}
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="font-heading text-lg mb-2">Numbers Font</h3>
          <p className="font-titles text-sm text-gray-600 mb-2">
            <strong>FONT NAME:</strong> Archivo, Google Font
          </p>
          <div className="font-numbers text-2xl">2345678</div>
        </div>

        {/* Titles Font */}
        <div className="border-l-4 border-purple-500 pl-4">
          <h3 className="font-heading text-lg mb-2">Titles Font</h3>
          <p className="font-titles text-sm text-gray-600 mb-2">
            <strong>Font:</strong> Archivo, Google Font
          </p>
          <div className="font-titles text-xl">Apple</div>
        </div>

        {/* Description Font */}
        <div className="border-l-4 border-orange-500 pl-4">
          <h3 className="font-heading text-lg mb-2">Description Font</h3>
          <p className="font-titles text-sm text-gray-600 mb-2">
            <strong>Font:</strong> Playfair Display, Google Font
          </p>
          <div className="font-description text-lg">Apple</div>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-heading text-lg mb-4">Usage Guidelines</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <span className="font-numbers text-blue-500 mr-2">•</span>
            <span className="font-titles">Use <code className="bg-gray-200 px-1 rounded">font-heading</code> for main headings and important titles</span>
          </li>
          <li className="flex items-start">
            <span className="font-numbers text-green-500 mr-2">•</span>
            <span className="font-titles">Use <code className="bg-gray-200 px-1 rounded">font-numbers</code> for all numerical values and amounts</span>
          </li>
          <li className="flex items-start">
            <span className="font-numbers text-purple-500 mr-2">•</span>
            <span className="font-titles">Use <code className="bg-gray-200 px-1 rounded">font-titles</code> for section titles and labels</span>
          </li>
          <li className="flex items-start">
            <span className="font-numbers text-orange-500 mr-2">•</span>
            <span className="font-titles">Use <code className="bg-gray-200 px-1 rounded">font-description</code> for descriptive text and body content</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FontSpecifications;
