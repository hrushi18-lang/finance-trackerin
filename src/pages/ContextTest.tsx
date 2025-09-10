import React from 'react';
import { useInternationalization } from '../contexts/InternationalizationContext';

const ContextTest: React.FC = () => {
  try {
    const { formatCurrency } = useInternationalization();
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Context Test</h1>
        <div className="space-y-4">
          <div>
            <strong>formatCurrency function:</strong> {typeof formatCurrency}
          </div>
          <div>
            <strong>Test formatCurrency(1234.56):</strong> {formatCurrency(1234.56)}
          </div>
          <div>
            <strong>Test formatCurrency(0):</strong> {formatCurrency(0)}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Context Error</h1>
        <div className="text-red-600">
          <strong>Error:</strong> {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }
};

export default ContextTest;
