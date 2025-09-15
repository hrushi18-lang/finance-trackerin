import { Decimal } from 'decimal.js';
import { currencyConversionService, ConversionResult } from './currencyConversionService';

export interface TransferRequest {
  amount: number;
  fromAccountId: string;
  toAccountId: string;
  fromAccountCurrency: string;
  toAccountCurrency: string;
  primaryCurrency: string;
  description: string;
  includeFees?: boolean;
  feePercentage?: number;
  auditContext?: string;
}

export interface TransferResult {
  // Source transaction (expense)
  sourceTransaction: {
    id: string;
    type: 'expense';
    amount: Decimal;
    currency: string;
    symbol: string;
    accountId: string;
    description: string;
    conversionData: ConversionResult;
  };
  
  // Destination transaction (income)
  destinationTransaction: {
    id: string;
    type: 'income';
    amount: Decimal;
    currency: string;
    symbol: string;
    accountId: string;
    description: string;
    conversionData: ConversionResult;
  };
  
  // Transfer metadata
  transferId: string;
  transferTimestamp: Date;
  totalFees: Decimal;
  fxGainLoss: Decimal;
  auditTrail: {
    sourceAuditId: string;
    destinationAuditId: string;
    transferAuditId: string;
  };
}

export class TransferService {
  private transferCounter = 0;

  // Create a cross-currency transfer with double-entry bookkeeping
  async createTransfer(request: TransferRequest): Promise<TransferResult> {
    const {
      amount,
      fromAccountId,
      toAccountId,
      fromAccountCurrency,
      toAccountCurrency,
      primaryCurrency,
      description,
      includeFees = false,
      feePercentage = 0.0025,
      auditContext = 'transfer'
    } = request;

    // Validate accounts are different
    if (fromAccountId === toAccountId) {
      throw new Error('Source and destination accounts must be different');
    }

    // Generate transfer ID
    const transferId = `transfer_${Date.now()}_${++this.transferCounter}`;
    const transferTimestamp = new Date();

    // Convert source amount (from entered currency to source account currency)
    const sourceConversion = await currencyConversionService.convertCurrency({
      amount,
      enteredCurrency: fromAccountCurrency,
      accountCurrency: fromAccountCurrency,
      primaryCurrency,
      includeFees,
      feePercentage,
      auditContext: `${auditContext}_source`
    });

    // Convert destination amount (from entered currency to destination account currency)
    const destinationConversion = await currencyConversionService.convertCurrency({
      amount,
      enteredCurrency: fromAccountCurrency,
      accountCurrency: toAccountCurrency,
      primaryCurrency,
      includeFees,
      feePercentage,
      auditContext: `${auditContext}_destination`
    });

    // Calculate FX gain/loss (difference between source and destination primary amounts)
    const fxGainLoss = destinationConversion.primaryAmount.sub(sourceConversion.primaryAmount);

    // Calculate total fees
    const totalFees = sourceConversion.conversionFee.add(destinationConversion.conversionFee);

    // Create source transaction (expense)
    const sourceTransaction = {
      id: `${transferId}_source`,
      type: 'expense' as const,
      amount: sourceConversion.accountAmount,
      currency: sourceConversion.accountCurrency,
      symbol: sourceConversion.accountSymbol,
      accountId: fromAccountId,
      description: `Transfer to ${description}`,
      conversionData: sourceConversion
    };

    // Create destination transaction (income)
    const destinationTransaction = {
      id: `${transferId}_destination`,
      type: 'income' as const,
      amount: destinationConversion.accountAmount,
      currency: destinationConversion.accountCurrency,
      symbol: destinationConversion.accountSymbol,
      accountId: toAccountId,
      description: `Transfer from ${description}`,
      conversionData: destinationConversion
    };

    return {
      sourceTransaction,
      destinationTransaction,
      transferId,
      transferTimestamp,
      totalFees,
      fxGainLoss,
      auditTrail: {
        sourceAuditId: sourceConversion.auditId,
        destinationAuditId: destinationConversion.auditId,
        transferAuditId: `${transferId}_audit`
      }
    };
  }

  // Create a same-currency transfer (no conversion needed)
  async createSameCurrencyTransfer(
    amount: number,
    fromAccountId: string,
    toAccountId: string,
    currency: string,
    primaryCurrency: string,
    description: string,
    auditContext = 'same_currency_transfer'
  ): Promise<TransferResult> {
    const transferId = `transfer_${Date.now()}_${++this.transferCounter}`;
    const transferTimestamp = new Date();

    // Create conversion data for same currency
    const conversionData: ConversionResult = {
      enteredAmount: new Decimal(amount),
      enteredCurrency: currency,
      enteredSymbol: currencyConversionService.getCurrencySymbol(currency),
      accountAmount: new Decimal(amount),
      accountCurrency: currency,
      accountSymbol: currencyConversionService.getCurrencySymbol(currency),
      primaryAmount: new Decimal(amount),
      primaryCurrency: primaryCurrency,
      primarySymbol: currencyConversionService.getCurrencySymbol(primaryCurrency),
      exchangeRate: new Decimal(1),
      exchangeRateUsed: new Decimal(1),
      conversionSource: 'same_currency',
      conversionTimestamp: transferTimestamp,
      conversionCase: 'all_same',
      conversionFee: new Decimal(0),
      totalCost: new Decimal(amount),
      rateRecord: {
        from: currency,
        to: currency,
        rate: 1,
        source: 'same_currency',
        timestamp: transferTimestamp,
        ttl: 0,
        isStale: false
      },
      auditId: `${auditContext}_${Date.now()}`
    };

    // Create source transaction (expense)
    const sourceTransaction = {
      id: `${transferId}_source`,
      type: 'expense' as const,
      amount: new Decimal(amount),
      currency,
      symbol: currencyConversionService.getCurrencySymbol(currency),
      accountId: fromAccountId,
      description: `Transfer to ${description}`,
      conversionData
    };

    // Create destination transaction (income)
    const destinationTransaction = {
      id: `${transferId}_destination`,
      type: 'income' as const,
      amount: new Decimal(amount),
      currency,
      symbol: currencyConversionService.getCurrencySymbol(currency),
      accountId: toAccountId,
      description: `Transfer from ${description}`,
      conversionData
    };

    return {
      sourceTransaction,
      destinationTransaction,
      transferId,
      transferTimestamp,
      totalFees: new Decimal(0),
      fxGainLoss: new Decimal(0),
      auditTrail: {
        sourceAuditId: conversionData.auditId,
        destinationAuditId: conversionData.auditId,
        transferAuditId: `${transferId}_audit`
      }
    };
  }

  // Validate transfer before execution
  async validateTransfer(request: TransferRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if currencies are restricted
    if (currencyConversionService.isCurrencyRestricted(request.fromAccountCurrency)) {
      errors.push(`Source currency ${request.fromAccountCurrency} is restricted`);
    }
    if (currencyConversionService.isCurrencyRestricted(request.toAccountCurrency)) {
      errors.push(`Destination currency ${request.toAccountCurrency} is restricted`);
    }
    if (currencyConversionService.isCurrencyRestricted(request.primaryCurrency)) {
      errors.push(`Primary currency ${request.primaryCurrency} is restricted`);
    }

    // Check if amount is valid
    if (request.amount <= 0) {
      errors.push('Transfer amount must be greater than 0');
    }

    // Check if accounts are different
    if (request.fromAccountId === request.toAccountId) {
      errors.push('Source and destination accounts must be different');
    }

    // Check for potential FX volatility
    if (request.fromAccountCurrency !== request.toAccountCurrency) {
      warnings.push('Cross-currency transfer may be subject to exchange rate fluctuations');
    }

    // Check for high fees
    const estimatedFee = request.amount * (request.feePercentage || 0.0025);
    if (estimatedFee > request.amount * 0.01) {
      warnings.push(`High conversion fees detected: ${estimatedFee.toFixed(2)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Get transfer statistics
  getTransferStatistics(): {
    totalTransfers: number;
    crossCurrencyTransfers: number;
    sameCurrencyTransfers: number;
    totalFees: Decimal;
    totalFXGainLoss: Decimal;
  } {
    // This would typically query a database
    // For now, return mock data
    return {
      totalTransfers: this.transferCounter,
      crossCurrencyTransfers: Math.floor(this.transferCounter * 0.3),
      sameCurrencyTransfers: Math.floor(this.transferCounter * 0.7),
      totalFees: new Decimal(0),
      totalFXGainLoss: new Decimal(0)
    };
  }
}

// Export singleton instance
export const transferService = new TransferService();
