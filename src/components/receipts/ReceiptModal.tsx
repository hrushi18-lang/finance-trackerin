import React from 'react';
import { useFinanceSafe } from '../../contexts/FinanceContext';
import { PaymentReceipt } from './PaymentReceipt';

export const ReceiptModal: React.FC = () => {
  const financeContext = useFinanceSafe();
  
  // Return null if context is not available yet
  if (!financeContext) {
    return null;
  }
  
  const { showReceipt, currentReceipt, hideReceipt } = financeContext;

  if (!showReceipt || !currentReceipt) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple text receipt for download
    const receiptText = `
Payment Receipt
===============

Amount: ${currentReceipt.currency} ${currentReceipt.amount}
Description: ${currentReceipt.description}
Account: ${currentReceipt.accountName}
Date: ${currentReceipt.timestamp.toLocaleString()}
Status: ${currentReceipt.status.toUpperCase()}
Reference: ${currentReceipt.reference || 'N/A'}

Transaction ID: ${currentReceipt.id}
    `.trim();

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${currentReceipt.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <PaymentReceipt
      paymentData={currentReceipt}
      onClose={hideReceipt}
      onPrint={handlePrint}
      onDownload={handleDownload}
    />
  );
};
