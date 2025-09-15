import { currencyConversionService } from './currencyConversionService';

export interface ComplianceCheck {
  isCompliant: boolean;
  restrictions: string[];
  warnings: string[];
  requiredActions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface SanctionsList {
  entities: Set<string>;
  countries: Set<string>;
  currencies: Set<string>;
  lastUpdated: Date;
}

export interface ComplianceConfig {
  enableSanctionsChecking: boolean;
  enableCurrencyRestrictions: boolean;
  enableAmountLimits: boolean;
  enableGeographicRestrictions: boolean;
  maxTransactionAmount: number;
  maxDailyAmount: number;
  maxMonthlyAmount: number;
  restrictedCountries: string[];
  restrictedCurrencies: string[];
  requireKYC: boolean;
  requireAML: boolean;
  auditAllTransactions: boolean;
}

export interface TransactionContext {
  amount: number;
  currency: string;
  fromAccountId: string;
  toAccountId: string;
  userId: string;
  userCountry: string;
  userIP: string;
  userAgent: string;
  transactionType: string;
  description: string;
  timestamp: Date;
}

export class ComplianceService {
  private config: ComplianceConfig;
  private sanctionsList: SanctionsList;
  private dailyAmounts: Map<string, Map<string, number>> = new Map();
  private monthlyAmounts: Map<string, Map<string, number>> = new Map();

  constructor(config: ComplianceConfig) {
    this.config = config;
    this.sanctionsList = {
      entities: new Set(),
      countries: new Set(),
      currencies: new Set(),
      lastUpdated: new Date()
    };
    
    this.loadSanctionsList();
  }

  // Load sanctions list (in real implementation, this would come from a database or API)
  private loadSanctionsList(): void {
    // OFAC (Office of Foreign Assets Control) sanctions
    this.sanctionsList.entities.add('OFAC_SDN_001');
    this.sanctionsList.entities.add('OFAC_SDN_002');
    
    // Restricted countries
    this.sanctionsList.countries.add('IR'); // Iran
    this.sanctionsList.countries.add('KP'); // North Korea
    this.sanctionsList.countries.add('SY'); // Syria
    this.sanctionsList.countries.add('VE'); // Venezuela
    this.sanctionsList.countries.add('CU'); // Cuba
    this.sanctionsList.countries.add('MM'); // Myanmar
    this.sanctionsList.countries.add('AF'); // Afghanistan
    
    // Restricted currencies
    this.sanctionsList.currencies.add('IRR'); // Iranian Rial
    this.sanctionsList.currencies.add('KPW'); // North Korean Won
    this.sanctionsList.currencies.add('SYP'); // Syrian Pound
    this.sanctionsList.currencies.add('VES'); // Venezuelan Bolívar
    this.sanctionsList.currencies.add('CUP'); // Cuban Peso
    this.sanctionsList.currencies.add('MMK'); // Myanmar Kyat
    this.sanctionsList.currencies.add('AFN'); // Afghan Afghani
    
    this.sanctionsList.lastUpdated = new Date();
  }

  // Check transaction compliance
  async checkTransactionCompliance(context: TransactionContext): Promise<ComplianceCheck> {
    const restrictions: string[] = [];
    const warnings: string[] = [];
    const requiredActions: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check currency restrictions
    if (this.config.enableCurrencyRestrictions) {
      const currencyCheck = this.checkCurrencyRestrictions(context.currency);
      if (!currencyCheck.isCompliant) {
        restrictions.push(...currencyCheck.restrictions);
        riskLevel = 'critical';
      }
      warnings.push(...currencyCheck.warnings);
    }

    // Check amount limits
    if (this.config.enableAmountLimits) {
      const amountCheck = this.checkAmountLimits(context);
      if (!amountCheck.isCompliant) {
        restrictions.push(...amountCheck.restrictions);
        riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
      }
      warnings.push(...amountCheck.warnings);
    }

    // Check geographic restrictions
    if (this.config.enableGeographicRestrictions) {
      const geoCheck = this.checkGeographicRestrictions(context);
      if (!geoCheck.isCompliant) {
        restrictions.push(...geoCheck.restrictions);
        riskLevel = riskLevel === 'critical' ? 'critical' : 'high';
      }
      warnings.push(...geoCheck.warnings);
    }

    // Check sanctions
    if (this.config.enableSanctionsChecking) {
      const sanctionsCheck = this.checkSanctions(context);
      if (!sanctionsCheck.isCompliant) {
        restrictions.push(...sanctionsCheck.restrictions);
        riskLevel = 'critical';
      }
      warnings.push(...sanctionsCheck.warnings);
    }

    // Check KYC requirements
    if (this.config.requireKYC) {
      const kycCheck = this.checkKYCRequirements(context);
      if (!kycCheck.isCompliant) {
        requiredActions.push(...kycCheck.requiredActions);
        riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
      }
    }

    // Check AML requirements
    if (this.config.requireAML) {
      const amlCheck = this.checkAMLRequirements(context);
      if (!amlCheck.isCompliant) {
        requiredActions.push(...amlCheck.requiredActions);
        riskLevel = riskLevel === 'critical' ? 'critical' : 'medium';
      }
    }

    // Update amount tracking
    this.updateAmountTracking(context);

    return {
      isCompliant: restrictions.length === 0,
      restrictions,
      warnings,
      requiredActions,
      riskLevel
    };
  }

  // Check currency restrictions
  private checkCurrencyRestrictions(currency: string): ComplianceCheck {
    const restrictions: string[] = [];
    const warnings: string[] = [];

    // Check if currency is restricted
    if (currencyConversionService.isCurrencyRestricted(currency)) {
      restrictions.push(`Currency ${currency} is restricted and cannot be used`);
    }

    // Check if currency is in sanctions list
    if (this.sanctionsList.currencies.has(currency)) {
      restrictions.push(`Currency ${currency} is on the sanctions list`);
    }

    // Check for unstable currencies
    if (this.isUnstableCurrency(currency)) {
      warnings.push(`Currency ${currency} is known to be unstable`);
    }

    return {
      isCompliant: restrictions.length === 0,
      restrictions,
      warnings,
      requiredActions: [],
      riskLevel: restrictions.length > 0 ? 'critical' : 'low'
    };
  }

  // Check amount limits
  private checkAmountLimits(context: TransactionContext): ComplianceCheck {
    const restrictions: string[] = [];
    const warnings: string[] = [];

    // Check single transaction limit
    if (context.amount > this.config.maxTransactionAmount) {
      restrictions.push(`Transaction amount ${context.amount} exceeds maximum allowed ${this.config.maxTransactionAmount}`);
    }

    // Check daily limit
    const dailyAmount = this.getDailyAmount(context.userId, context.currency);
    if (dailyAmount + context.amount > this.config.maxDailyAmount) {
      restrictions.push(`Daily amount limit would be exceeded`);
    }

    // Check monthly limit
    const monthlyAmount = this.getMonthlyAmount(context.userId, context.currency);
    if (monthlyAmount + context.amount > this.config.maxMonthlyAmount) {
      restrictions.push(`Monthly amount limit would be exceeded`);
    }

    // Check for suspicious amounts
    if (this.isSuspiciousAmount(context.amount)) {
      warnings.push(`Transaction amount ${context.amount} may be suspicious`);
    }

    return {
      isCompliant: restrictions.length === 0,
      restrictions,
      warnings,
      requiredActions: [],
      riskLevel: restrictions.length > 0 ? 'high' : 'low'
    };
  }

  // Check geographic restrictions
  private checkGeographicRestrictions(context: TransactionContext): ComplianceCheck {
    const restrictions: string[] = [];
    const warnings: string[] = [];

    // Check if user country is restricted
    if (this.config.restrictedCountries.includes(context.userCountry)) {
      restrictions.push(`Country ${context.userCountry} is restricted`);
    }

    // Check if user country is in sanctions list
    if (this.sanctionsList.countries.has(context.userCountry)) {
      restrictions.push(`Country ${context.userCountry} is on the sanctions list`);
    }

    // Check for high-risk countries
    if (this.isHighRiskCountry(context.userCountry)) {
      warnings.push(`Country ${context.userCountry} is considered high-risk`);
    }

    return {
      isCompliant: restrictions.length === 0,
      restrictions,
      warnings,
      requiredActions: [],
      riskLevel: restrictions.length > 0 ? 'high' : 'low'
    };
  }

  // Check sanctions
  private checkSanctions(context: TransactionContext): ComplianceCheck {
    const restrictions: string[] = [];
    const warnings: string[] = [];

    // Check if user is on sanctions list
    if (this.sanctionsList.entities.has(context.userId)) {
      restrictions.push(`User ${context.userId} is on the sanctions list`);
    }

    // Check for suspicious patterns
    if (this.hasSuspiciousPatterns(context)) {
      warnings.push(`Transaction shows suspicious patterns`);
    }

    return {
      isCompliant: restrictions.length === 0,
      restrictions,
      warnings,
      requiredActions: [],
      riskLevel: restrictions.length > 0 ? 'critical' : 'low'
    };
  }

  // Check KYC requirements
  private checkKYCRequirements(context: TransactionContext): ComplianceCheck {
    const requiredActions: string[] = [];

    // Check if KYC is required for this transaction
    if (context.amount > this.config.maxTransactionAmount * 0.5) {
      requiredActions.push('KYC verification required for high-value transaction');
    }

    // Check if KYC is required for this currency
    if (this.requiresKYCForCurrency(context.currency)) {
      requiredActions.push('KYC verification required for this currency');
    }

    return {
      isCompliant: requiredActions.length === 0,
      restrictions: [],
      warnings: [],
      requiredActions,
      riskLevel: requiredActions.length > 0 ? 'medium' : 'low'
    };
  }

  // Check AML requirements
  private checkAMLRequirements(context: TransactionContext): ComplianceCheck {
    const requiredActions: string[] = [];

    // Check if AML is required for this transaction
    if (context.amount > this.config.maxTransactionAmount * 0.3) {
      requiredActions.push('AML screening required for high-value transaction');
    }

    // Check if AML is required for this country
    if (this.requiresAMLForCountry(context.userCountry)) {
      requiredActions.push('AML screening required for this country');
    }

    return {
      isCompliant: requiredActions.length === 0,
      restrictions: [],
      warnings: [],
      requiredActions,
      riskLevel: requiredActions.length > 0 ? 'medium' : 'low'
    };
  }

  // Helper methods
  private isUnstableCurrency(currency: string): boolean {
    const unstableCurrencies = ['VES', 'ZWL', 'VND', 'IDR'];
    return unstableCurrencies.includes(currency);
  }

  private isSuspiciousAmount(amount: number): boolean {
    // Check for round numbers (potential structuring)
    if (amount % 10000 === 0 && amount > 100000) {
      return true;
    }
    
    // Check for amounts just under reporting thresholds
    if (amount >= 9000 && amount < 10000) {
      return true;
    }
    
    return false;
  }

  private isHighRiskCountry(country: string): boolean {
    const highRiskCountries = ['AF', 'IQ', 'LY', 'SO', 'SY', 'YE'];
    return highRiskCountries.includes(country);
  }

  private hasSuspiciousPatterns(context: TransactionContext): boolean {
    // Check for rapid successive transactions
    const recentTransactions = this.getRecentTransactions(context.userId, 24); // Last 24 hours
    if (recentTransactions.length > 10) {
      return true;
    }
    
    // Check for unusual transaction times
    const hour = context.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      return true;
    }
    
    return false;
  }

  private requiresKYCForCurrency(currency: string): boolean {
    const kycRequiredCurrencies = ['BTC', 'ETH', 'USDC', 'USDT'];
    return kycRequiredCurrencies.includes(currency);
  }

  private requiresAMLForCountry(country: string): boolean {
    const amlRequiredCountries = ['AF', 'IQ', 'LY', 'SO', 'SY', 'YE'];
    return amlRequiredCountries.includes(country);
  }

  private getRecentTransactions(userId: string, hours: number): any[] {
    // This would typically query a database
    return [];
  }

  private updateAmountTracking(context: TransactionContext): void {
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().substring(0, 7);
    
    // Update daily amounts
    if (!this.dailyAmounts.has(context.userId)) {
      this.dailyAmounts.set(context.userId, new Map());
    }
    const dailyAmounts = this.dailyAmounts.get(context.userId)!;
    const dailyKey = `${today}_${context.currency}`;
    dailyAmounts.set(dailyKey, (dailyAmounts.get(dailyKey) || 0) + context.amount);
    
    // Update monthly amounts
    if (!this.monthlyAmounts.has(context.userId)) {
      this.monthlyAmounts.set(context.userId, new Map());
    }
    const monthlyAmounts = this.monthlyAmounts.get(context.userId)!;
    const monthlyKey = `${month}_${context.currency}`;
    monthlyAmounts.set(monthlyKey, (monthlyAmounts.get(monthlyKey) || 0) + context.amount);
  }

  private getDailyAmount(userId: string, currency: string): number {
    const today = new Date().toISOString().split('T')[0];
    const dailyAmounts = this.dailyAmounts.get(userId);
    if (!dailyAmounts) return 0;
    
    const dailyKey = `${today}_${currency}`;
    return dailyAmounts.get(dailyKey) || 0;
  }

  private getMonthlyAmount(userId: string, currency: string): number {
    const month = new Date().toISOString().substring(0, 7);
    const monthlyAmounts = this.monthlyAmounts.get(userId);
    if (!monthlyAmounts) return 0;
    
    const monthlyKey = `${month}_${currency}`;
    return monthlyAmounts.get(monthlyKey) || 0;
  }

  // Update configuration
  updateConfig(newConfig: Partial<ComplianceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): ComplianceConfig {
    return { ...this.config };
  }

  // Get sanctions list
  getSanctionsList(): SanctionsList {
    return { ...this.sanctionsList };
  }

  // Clear amount tracking (for testing)
  clearAmountTracking(): void {
    this.dailyAmounts.clear();
    this.monthlyAmounts.clear();
  }
}

// Default configuration
const defaultConfig: ComplianceConfig = {
  enableSanctionsChecking: true,
  enableCurrencyRestrictions: true,
  enableAmountLimits: true,
  enableGeographicRestrictions: true,
  maxTransactionAmount: 100000,
  maxDailyAmount: 500000,
  maxMonthlyAmount: 2000000,
  restrictedCountries: ['IR', 'KP', 'SY', 'VE', 'CU', 'MM', 'AF'],
  restrictedCurrencies: ['IRR', 'KPW', 'SYP', 'VES', 'CUP', 'MMK', 'AFN'],
  requireKYC: true,
  requireAML: true,
  auditAllTransactions: true
};

// Export singleton instance
export const complianceService = new ComplianceService(defaultConfig);
