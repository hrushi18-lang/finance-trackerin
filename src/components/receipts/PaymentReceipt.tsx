import React from 'react';
import { formatCurrency } from '../../utils/currency-converter';

interface PaymentReceiptProps {
  paymentData: {
    id: string;
    amount: number;
    currency: string;
    description: string;
    accountName: string;
    paymentType: 'goal_contribution' | 'bill_payment' | 'liability_payment' | 'transfer' | 'income' | 'expense';
    sourceEntity?: {
      type: 'goal' | 'bill' | 'liability' | 'account';
      name: string;
    };
    timestamp: Date;
    status: 'completed' | 'pending' | 'failed';
    reference?: string;
    notes?: string;
  };
  onClose: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  paymentData,
  onClose,
  onPrint,
  onDownload
}) => {
  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      goal_contribution: 'Goal Contribution',
      bill_payment: 'Bill Payment',
      liability_payment: 'Liability Payment',
      transfer: 'Account Transfer',
      income: 'Income',
      expense: 'Expense'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '📄';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Payment Receipt</h2>
              <p className="text-blue-100 text-sm">Transaction Confirmation</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(paymentData.status)}`}>
              <span className="mr-2">{getStatusIcon(paymentData.status)}</span>
              {paymentData.status.toUpperCase()}
            </span>
          </div>

          {/* Amount */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(paymentData.amount, paymentData.currency)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {getPaymentTypeLabel(paymentData.paymentType)}
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium text-right">{paymentData.description}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Account:</span>
              <span className="font-medium">{paymentData.accountName}</span>
            </div>

            {paymentData.sourceEntity && (
              <div className="flex justify-between">
                <span className="text-gray-600">For:</span>
                <span className="font-medium">{paymentData.sourceEntity.name}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium">
                {paymentData.timestamp.toLocaleDateString()} at {paymentData.timestamp.toLocaleTimeString()}
              </span>
            </div>

            {paymentData.reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-mono text-sm">{paymentData.reference}</span>
              </div>
            )}

            {paymentData.notes && (
              <div className="pt-2 border-t border-gray-200">
                <div className="text-gray-600 text-sm mb-1">Notes:</div>
                <div className="text-sm text-gray-800">{paymentData.notes}</div>
              </div>
            )}
          </div>

          {/* Transaction ID */}
          <div className="text-center">
            <div className="text-xs text-gray-500">Transaction ID</div>
            <div className="font-mono text-sm text-gray-700">{paymentData.id}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex space-x-3">
          <button
            onClick={onPrint}
            className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2z" />
            </svg>
            <span>Print</span>
          </button>
          
          <button
            onClick={onDownload}
            className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download</span>
          </button>
          
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
