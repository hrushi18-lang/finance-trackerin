import React from 'react';

/**
 * Font Test Component
 * Displays all font types to verify they're loading correctly
 */
export const FontTest: React.FC = () => {
  return (
    <div className="p-6 space-y-6 bg-white rounded-lg shadow-lg">
      <h2 className="font-heading text-3xl mb-6">Font Test - All Specifications</h2>
      
      {/* Headings Font Test */}
      <div className="border-l-4 border-blue-500 pl-4">
        <h3 className="font-heading text-lg mb-2">Headings Font (Archivo Black)</h3>
        <div className="font-heading text-4xl">Welcome to FinTrack</div>
        <div className="font-heading text-2xl">Main Heading</div>
        <div className="font-heading text-xl">Section Title</div>
      </div>

      {/* Numbers Font Test */}
      <div className="border-l-4 border-green-500 pl-4">
        <h3 className="font-heading text-lg mb-2">Numbers Font (Archivo)</h3>
        <div className="font-numbers text-3xl">$1,234.56</div>
        <div className="font-numbers text-2xl">2345678</div>
        <div className="font-numbers text-xl">99.9%</div>
      </div>

      {/* Titles Font Test */}
      <div className="border-l-4 border-purple-500 pl-4">
        <h3 className="font-heading text-lg mb-2">Titles Font (Archivo)</h3>
        <div className="font-titles text-2xl">Apple</div>
        <div className="font-titles text-xl">Account Balance</div>
        <div className="font-titles text-lg">Settings</div>
      </div>

      {/* Description Font Test */}
      <div className="border-l-4 border-orange-500 pl-4">
        <h3 className="font-heading text-lg mb-2">Description Font (Playfair Display)</h3>
        <div className="font-description text-xl">Apple</div>
        <div className="font-description text-lg">This is descriptive text that explains features and provides helpful information to users.</div>
        <div className="font-description text-base">Manage your finances with ease and precision.</div>
      </div>

      {/* Font Loading Status */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-heading text-lg mb-4">Font Loading Status</h4>
        <div className="text-sm space-y-2">
          <div className="flex items-center">
            <span className="font-numbers text-green-500 mr-2">✓</span>
            <span className="font-titles">Archivo Black (Headings)</span>
          </div>
          <div className="flex items-center">
            <span className="font-numbers text-green-500 mr-2">✓</span>
            <span className="font-titles">Archivo (Numbers & Titles)</span>
          </div>
          <div className="flex items-center">
            <span className="font-numbers text-green-500 mr-2">✓</span>
            <span className="font-titles">Playfair Display (Descriptions)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FontTest;
