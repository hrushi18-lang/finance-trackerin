// Payment service to handle payment operations
// This service can be called from anywhere in the app without context dependencies

let paymentContext: any = null;

export const setPaymentContext = (context: any) => {
  paymentContext = context;
};

export const openPaymentModal = (config: any) => {
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
