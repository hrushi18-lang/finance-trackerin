import { simpleCurrencyService } from './simpleCurrencyService';

export interface MultiCurrencyPaymentData {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  conversionSource: 'api' | 'fallback' | 'manual';
  lastUpdated: Date;
}

export interface PaymentContext {
  paymentType: 'bill_payment' | 'liability_payment' | 'credit_card_payment';
  sourceEntityId?: string;
  sourceEntityType?: string;
  originalAmount: number;
  convertedAmount: number;
  exchangeRate: number;
  [key: string]: any;
}

export class BillLiabilityService {
  private static fallbackRates = {
    'USD': 1.0, 'EUR': 0.87, 'GBP': 0.76, 'INR': 88.22, 'JPY': 152.0,
    'CAD': 1.38, 'AUD': 1.55, 'CHF': 0.89, 'CNY': 7.15, 'SGD': 1.37,
    'HKD': 7.80, 'KRW': 1350.0, 'BRL': 5.25, 'MXN': 17.80, 'RUB': 95.0,
    'ZAR': 18.20, 'NZD': 1.65, 'SEK': 10.50, 'NOK': 10.60, 'DKK': 6.85,
    'PLN': 4.05, 'CZK': 23.20, 'HUF': 365.0, 'TRY': 29.50, 'ILS': 3.65,
    'AED': 3.67, 'SAR': 3.75, 'QAR': 3.64, 'KWD': 0.31, 'BHD': 0.38,
    'OMR': 0.38, 'JOD': 0.71, 'LBP': 150000.0, 'EGP': 31.20, 'MAD': 10.15,
    'TND': 3.12, 'DZD': 135.0, 'NGN': 1620.0, 'KES': 162.0, 'GHS': 12.60,
    'UGX': 3750.0, 'TZS': 2520.0, 'ETB': 56.0, 'MUR': 46.0, 'BWP': 13.60,
    'SZL': 18.20, 'LSL': 18.20, 'NAD': 18.20, 'MWK': 1720.0, 'ZMW': 25.50,
    'BIF': 2900.0, 'RWF': 1220.0, 'CDF': 2850.0, 'AOA': 840.0, 'MZN': 65.0,
    'SLL': 22500.0, 'LRD': 195.0, 'GMD': 68.0, 'GNF': 8750.0, 'SLE': 22500.0,
    'STN': 23.0
  };

  /**
   * Convert payment amount between currencies using live exchange rates
   */
  static async convertPaymentAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<MultiCurrencyPaymentData> {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency,
        exchangeRate: 1.0,
        conversionSource: 'manual',
        lastUpdated: new Date()
      };
    }

    try {
      console.log(`🔄 BillLiabilityService: Converting ${amount} ${fromCurrency} to ${toCurrency}`);
      // Try to get live exchange rate
      const exchangeRate = simpleCurrencyService.getRate(fromCurrency, toCurrency);
      const convertedAmount = amount * exchangeRate;
      
      console.log(`✅ BillLiabilityService: Live conversion ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency} (rate: ${exchangeRate.toFixed(4)})`);
      
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount,
        convertedCurrency: toCurrency,
        exchangeRate,
        conversionSource: 'api',
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get live exchange rate, using fallback:', error);
      
      // Use fallback rates
      const fromRate = this.fallbackRates[fromCurrency] || 1.0;
      const toRate = this.fallbackRates[toCurrency] || 1.0;
      const exchangeRate = toRate / fromRate;
      const convertedAmount = amount * exchangeRate;
      
      console.log(`⚠️ BillLiabilityService: Fallback conversion ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency} (rate: ${exchangeRate.toFixed(4)})`);
      
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount,
        convertedCurrency: toCurrency,
        exchangeRate,
        conversionSource: 'fallback',
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Create transaction data for bill payment with live multi-currency support
   */
  static async createBillPaymentTransaction(
    amount: number,
    accountId: string,
    accountCurrency: string,
    billCurrency: string,
    billTitle: string,
    billId: string,
    description?: string
  ) {
    console.log(`💳 Creating bill payment transaction: ${amount} ${accountCurrency} → ${billCurrency}`);
    const conversion = await this.convertPaymentAmount(amount, accountCurrency, billCurrency);
    
    console.log(`✅ Bill payment transaction created with live conversion: ${conversion.originalAmount} ${conversion.originalCurrency} = ${conversion.convertedAmount} ${conversion.convertedCurrency}`);
    
    return {
      type: 'expense' as const,
      amount: conversion.convertedAmount, // Use live converted amount for actual deduction
      category: 'Bills',
      description: description || `Bill Payment: ${billTitle}`,
      date: new Date(),
      accountId,
      affectsBalance: true,
      status: 'completed' as const,
      // Multi-currency fields with live rates
      native_amount: conversion.originalAmount,
      native_currency: conversion.originalCurrency,
      converted_amount: conversion.convertedAmount, // Live converted amount
      converted_currency: conversion.convertedCurrency,
      exchange_rate: conversion.exchangeRate, // Live exchange rate
      exchange_rate_used: conversion.exchangeRate, // Live exchange rate used
      conversion_source: conversion.conversionSource, // Live conversion source
      // Bill payment tracking
      bill_id: billId,
      payment_context: {
        paymentType: 'bill_payment',
        billTitle,
        originalAmount: conversion.originalAmount,
        convertedAmount: conversion.convertedAmount,
        exchangeRate: conversion.exchangeRate
      } as PaymentContext,
      paymentSource: 'bill_payment',
      sourceEntityId: billId,
      sourceEntityType: 'bill',
      deductFromBalance: true,
      paymentContext: 'bill_payment'
    };
  }

  /**
   * Create transaction data for liability payment with multi-currency support
   */
  static async createLiabilityPaymentTransaction(
    amount: number,
    accountId: string,
    accountCurrency: string,
    liabilityCurrency: string,
    liabilityName: string,
    liabilityId: string,
    description?: string
  ) {
    console.log(`💳 Creating liability payment transaction: ${amount} ${accountCurrency} → ${liabilityCurrency}`);
    const conversion = await this.convertPaymentAmount(amount, accountCurrency, liabilityCurrency);
    
    console.log(`✅ Liability payment transaction created with live conversion: ${conversion.originalAmount} ${conversion.originalCurrency} = ${conversion.convertedAmount} ${conversion.convertedCurrency}`);
    
    return {
      type: 'expense' as const,
      amount: conversion.convertedAmount, // Use live converted amount for actual deduction
      category: 'Liability Payment',
      description: description || `Payment: ${liabilityName}`,
      date: new Date(),
      accountId,
      affectsBalance: true,
      status: 'completed' as const,
      liabilityId,
      // Multi-currency fields with live rates
      native_amount: conversion.originalAmount,
      native_currency: conversion.originalCurrency,
      converted_amount: conversion.convertedAmount, // Live converted amount
      converted_currency: conversion.convertedCurrency,
      exchange_rate: conversion.exchangeRate, // Live exchange rate
      exchange_rate_used: conversion.exchangeRate, // Live exchange rate used
      conversion_source: conversion.conversionSource, // Live conversion source
      // Liability payment tracking
      payment_context: {
        paymentType: 'liability_payment',
        liabilityName,
        originalAmount: conversion.originalAmount,
        convertedAmount: conversion.convertedAmount,
        exchangeRate: conversion.exchangeRate
      } as PaymentContext,
      paymentSource: 'liability_payment',
      sourceEntityId: liabilityId,
      sourceEntityType: 'liability',
      deductFromBalance: true,
      paymentContext: 'liability_payment'
    };
  }

  /**
   * Create transaction data for credit card payment with multi-currency support
   */
  static async createCreditCardPaymentTransaction(
    amount: number,
    accountId: string,
    accountCurrency: string,
    billCurrency: string,
    billCycleId: string,
    paymentType: string,
    description?: string
  ) {
    console.log(`💳 Creating credit card payment transaction: ${amount} ${accountCurrency} → ${billCurrency}`);
    const conversion = await this.convertPaymentAmount(amount, accountCurrency, billCurrency);
    
    console.log(`✅ Credit card payment transaction created with live conversion: ${conversion.originalAmount} ${conversion.originalCurrency} = ${conversion.convertedAmount} ${conversion.convertedCurrency}`);
    
    return {
      type: 'expense' as const,
      amount: conversion.convertedAmount, // Use live converted amount for actual deduction
      category: 'Credit Card Payment',
      description: description || `Credit card payment - ${paymentType}`,
      date: new Date(),
      accountId,
      affectsBalance: true,
      status: 'completed' as const,
      // Multi-currency fields with live rates
      native_amount: conversion.originalAmount,
      native_currency: conversion.originalCurrency,
      converted_amount: conversion.convertedAmount, // Live converted amount
      converted_currency: conversion.convertedCurrency,
      exchange_rate: conversion.exchangeRate, // Live exchange rate
      exchange_rate_used: conversion.exchangeRate, // Live exchange rate used
      conversion_source: conversion.conversionSource, // Live conversion source
      // Credit card payment tracking
      payment_context: {
        paymentType: 'credit_card_payment',
        billCycleId,
        originalAmount: conversion.originalAmount,
        convertedAmount: conversion.convertedAmount,
        exchangeRate: conversion.exchangeRate
      } as PaymentContext,
      paymentSource: 'credit_card_payment',
      sourceEntityId: billCycleId,
      sourceEntityType: 'credit_card_bill',
      deductFromBalance: true,
      paymentContext: 'credit_card_payment'
    };
  }

  /**
   * Create bill data with multi-currency support
   */
  static async createBillData(
    billData: any,
    billCurrency: string,
    primaryCurrency: string
  ) {
    const conversion = await this.convertPaymentAmount(billData.amount, billCurrency, primaryCurrency);
    
    return {
      ...billData,
      amount: conversion.convertedAmount,
      currency_code: primaryCurrency,
      // Multi-currency fields
      original_amount: conversion.originalAmount,
      original_currency: conversion.originalCurrency,
      exchange_rate: conversion.exchangeRate,
      exchange_rate_used: conversion.exchangeRate,
      conversion_source: conversion.conversionSource,
      last_conversion_date: conversion.lastUpdated.toISOString()
    };
  }

  /**
   * Create liability data with multi-currency support
   */
  static async createLiabilityData(
    liabilityData: any,
    liabilityCurrency: string,
    primaryCurrency: string
  ) {
    const conversion = await this.convertPaymentAmount(liabilityData.totalAmount, liabilityCurrency, primaryCurrency);
    
    return {
      ...liabilityData,
      total_amount: conversion.convertedAmount,
      remaining_amount: conversion.convertedAmount,
      monthly_payment: (liabilityData.monthlyPayment || 0) * conversion.exchangeRate,
      minimum_payment: (liabilityData.minimumPayment || 0) * conversion.exchangeRate,
      currency_code: primaryCurrency,
      // Multi-currency fields
      original_amount: conversion.originalAmount,
      original_currency: conversion.originalCurrency,
      exchange_rate: conversion.exchangeRate,
      exchange_rate_used: conversion.exchangeRate,
      conversion_source: conversion.conversionSource,
      last_conversion_date: conversion.lastUpdated.toISOString()
    };
  }

  /**
   * Get fallback exchange rate between two currencies
   */
  static getFallbackRate(fromCurrency: string, toCurrency: string): number {
    const fromRate = this.fallbackRates[fromCurrency] || 1.0;
    const toRate = this.fallbackRates[toCurrency] || 1.0;
    return toRate / fromRate;
  }

  /**
   * Format currency amount with symbol
   */
  static formatCurrencyAmount(amount: number, currency: string): string {
    const symbols: { [key: string]: string } = {
      'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹', 'JPY': '¥',
      'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥', 'SGD': 'S$',
      'HKD': 'HK$', 'KRW': '₩', 'BRL': 'R$', 'MXN': '$', 'RUB': '₽',
      'ZAR': 'R', 'NZD': 'NZ$', 'SEK': 'kr', 'NOK': 'kr', 'DKK': 'kr',
      'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft', 'TRY': '₺', 'ILS': '₪',
      'AED': 'د.إ', 'SAR': '﷼', 'QAR': '﷼', 'KWD': 'د.ك', 'BHD': '.د.ب',
      'OMR': '﷼', 'JOD': 'د.ا', 'LBP': 'ل.ل', 'EGP': '£', 'MAD': 'د.م.',
      'TND': 'د.ت', 'DZD': 'د.ج', 'NGN': '₦', 'KES': 'KSh', 'GHS': '₵',
      'UGX': 'USh', 'TZS': 'TSh', 'ETB': 'Br', 'MUR': '₨', 'BWP': 'P',
      'SZL': 'L', 'LSL': 'L', 'NAD': 'N$', 'MWK': 'MK', 'ZMW': 'ZK',
      'BIF': 'F', 'RWF': 'RF', 'CDF': 'FC', 'AOA': 'Kz', 'MZN': 'MT',
      'SLL': 'Le', 'LRD': 'L$', 'GMD': 'D', 'GNF': 'FG', 'SLE': 'Le',
      'STN': 'Db'
    };
    
    const symbol = symbols[currency] || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export default BillLiabilityService;
