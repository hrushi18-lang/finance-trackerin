import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UniversalPaymentModal, UniversalPaymentData } from '../components/forms/UniversalPaymentModal';
import { setPaymentContext } from '../services/paymentService';

interface PaymentContextType {
  openPaymentModal: (config: PaymentModalConfig) => void;
  closePaymentModal: () => void;
  isPaymentModalOpen: boolean;
}

interface PaymentModalConfig {
  sourceEntity?: {
    id: string;
    type: 'goal' | 'liability' | 'bill' | 'account';
    name: string;
    currentAmount?: number;
    targetAmount?: number;
  };
  defaultAmount?: number;
  defaultDescription?: string;
  defaultCategory?: string;
  title?: string;
  showDeductToggle?: boolean;
  paymentType?: 'contribution' | 'payment' | 'transfer' | 'withdrawal';
  onSuccess?: (transactionData?: Record<string, unknown>) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

interface PaymentProviderProps {
  children: ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<PaymentModalConfig | null>(null);

  const openPaymentModal = (config: PaymentModalConfig) => {
    setModalConfig(config);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setModalConfig(null);
  };

  const handlePaymentSubmit = async (data: UniversalPaymentData) => {
    try {
      // Create transaction with payment source tracking
      const transactionData = {
        type: data.deductFromBalance ? 'expense' : 'income',
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: new Date(),
        accountId: data.accountId,
        affectsBalance: data.deductFromBalance,
        status: 'completed' as const,
        notes: data.notes,
        // Payment source tracking
        paymentSource: getPaymentSource(data.paymentType, modalConfig?.sourceEntity?.type),
        sourceEntityId: modalConfig?.sourceEntity?.id,
        sourceEntityType: modalConfig?.sourceEntity?.type,
        deductFromBalance: data.deductFromBalance,
        paymentContext: {
          paymentType: data.paymentType,
          sourceEntity: modalConfig?.sourceEntity,
          timestamp: new Date().toISOString()
        }
      };

      // Store the transaction data for the parent component to handle
      // This will be picked up by the FinanceContext or other components
      if (modalConfig?.onSuccess) {
        modalConfig.onSuccess(transactionData);
      }

      closePaymentModal();
    } catch (error) {
      console.error('Error processing universal payment:', error);
      throw error;
    }
  };

  const getPaymentSource = (paymentType: string, sourceType?: string): string => {
    if (sourceType === 'goal') {
      return paymentType === 'contribution' ? 'goal_contribution' : 'goal_withdrawal';
    }
    if (sourceType === 'liability') return 'liability_payment';
    if (sourceType === 'bill') return 'bill_payment';
    if (sourceType === 'account') return 'card_payment';
    return 'manual_transfer';
  };

  const value: PaymentContextType = {
    openPaymentModal,
    closePaymentModal,
    isPaymentModalOpen
  };

  // Register the context with the payment service
  useEffect(() => {
    setPaymentContext(value);
  }, [value]);

  return (
    <PaymentContext.Provider value={value}>
      {children}
      {modalConfig && (
        <UniversalPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={closePaymentModal}
          onSubmit={handlePaymentSubmit}
          sourceEntity={modalConfig.sourceEntity}
          defaultAmount={modalConfig.defaultAmount}
          defaultDescription={modalConfig.defaultDescription}
          defaultCategory={modalConfig.defaultCategory}
          title={modalConfig.title}
          showDeductToggle={modalConfig.showDeductToggle}
          paymentType={modalConfig.paymentType}
        />
      )}
    </PaymentContext.Provider>
  );
};
