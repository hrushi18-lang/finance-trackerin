// Payment service to handle payment operations
// This service can be called from anywhere in the app without context dependencies

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

let paymentContext: PaymentContextType | null = null;

export const setPaymentContext = (context: PaymentContextType) => {
  paymentContext = context;
};

export const openPaymentModal = (config: PaymentModalConfig) => {
  if (paymentContext?.openPaymentModal) {
    paymentContext.openPaymentModal(config);
  }
};

export const closePaymentModal = () => {
  if (paymentContext?.closePaymentModal) {
    paymentContext.closePaymentModal();
  }
};

export const isPaymentModalOpen = () => {
  return paymentContext?.isPaymentModalOpen || false;
};
