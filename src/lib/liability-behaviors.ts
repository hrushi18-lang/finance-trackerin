/**
 * Liability Type-Specific Behaviors
 * Defines how each liability type should behave in the system
 */

export type LiabilityType = 
  | 'education_loan'
  | 'student_credit_card'
  | 'family_debt'
  | 'bnpl'
  | 'personal_loan'
  | 'credit_card'
  | 'auto_loan'
  | 'home_loan'
  | 'gold_loan'
  | 'utility_debt'
  | 'tax_debt'
  | 'international_debt';

export interface LiabilityBehavior {
  displayName: string;
  icon: string;
  description: string;
  paymentStructure: 'fixed_monthly' | 'minimum_or_full' | 'installment' | 'flexible' | 'revolving';
  interestRate: {
    min: number;
    max: number;
    default: number;
    type: 'fixed' | 'variable' | 'zero_then_high';
  };
  paymentCalculation: 'amortized' | 'simple_interest' | 'revolving' | 'usage_based';
  earlyPayoff: 'encouraged' | 'flexible' | 'penalty_check' | 'strategic' | 'always_encouraged';
  gracePeriod?: number; // Days
  defaultSettings: {
    autoGenerateBills: boolean;
    sendReminders: boolean;
    reminderDays: number;
    paymentMethod: 'bank_transfer' | 'auto_pay_recommended' | 'auto_pay_required' | 'manual';
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  specialFeatures: string[];
  formFields: {
    required: string[];
    optional: string[];
    typeSpecific: string[];
  };
}

export const LIABILITY_BEHAVIORS: Record<LiabilityType, LiabilityBehavior> = {
  education_loan: {
    displayName: 'Education Loan',
    icon: '🎓',
    description: 'Student loans for tuition, hostel, books',
    paymentStructure: 'fixed_monthly',
    interestRate: { min: 6, max: 15, default: 8.5, type: 'fixed' },
    paymentCalculation: 'amortized',
    earlyPayoff: 'encouraged',
    gracePeriod: 180, // 6 months after graduation
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 7,
      paymentMethod: 'bank_transfer',
      priority: 'high'
    },
    specialFeatures: ['grace_period', 'deferment_options', 'tax_benefits'],
    formFields: {
      required: ['name', 'totalAmount', 'interestRate', 'loanTermMonths'],
      optional: ['description', 'institution', 'degreeProgram'],
      typeSpecific: ['gracePeriod', 'defermentOptions', 'taxBenefits']
    }
  },

  student_credit_card: {
    displayName: 'Student Credit Card',
    icon: '💳',
    description: 'Low-limit cards for building credit',
    paymentStructure: 'minimum_or_full',
    interestRate: { min: 15, max: 30, default: 18, type: 'variable' },
    paymentCalculation: 'revolving',
    earlyPayoff: 'flexible',
    gracePeriod: 21,
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 3,
      paymentMethod: 'auto_pay_recommended',
      priority: 'high'
    },
    specialFeatures: ['credit_building', 'rewards_program', 'low_limit'],
    formFields: {
      required: ['name', 'creditLimit', 'currentBalance', 'interestRate'],
      optional: ['description', 'rewardsProgram', 'annualFee'],
      typeSpecific: ['creditLimit', 'rewardsProgram', 'annualFee']
    }
  },

  family_debt: {
    displayName: 'Family Debt',
    icon: '👨‍👩‍👧‍👦',
    description: 'Borrowed from parents/relatives',
    paymentStructure: 'flexible',
    interestRate: { min: 0, max: 5, default: 0, type: 'fixed' },
    paymentCalculation: 'simple_interest',
    earlyPayoff: 'always_encouraged',
    defaultSettings: {
      autoGenerateBills: false,
      sendReminders: false,
      reminderDays: 0,
      paymentMethod: 'manual',
      priority: 'high'
    },
    specialFeatures: ['flexible_terms', 'informal_agreement', 'no_credit_impact'],
    formFields: {
      required: ['name', 'totalAmount'],
      optional: ['description', 'familyRelationship'],
      typeSpecific: ['familyRelationship', 'informalAgreement', 'flexibleTerms']
    }
  },

  bnpl: {
    displayName: 'Buy Now Pay Later',
    icon: '📱',
    description: 'Laptops, phones, course materials',
    paymentStructure: 'installment',
    interestRate: { min: 0, max: 30, default: 0, type: 'zero_then_high' },
    paymentCalculation: 'fixed_installments',
    earlyPayoff: 'encouraged',
    gracePeriod: 30,
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 2,
      paymentMethod: 'auto_pay_required',
      priority: 'high'
    },
    specialFeatures: ['promotional_period', 'late_fees', 'short_term'],
    formFields: {
      required: ['name', 'totalAmount', 'installmentCount'],
      optional: ['description', 'merchant', 'promotionalPeriod'],
      typeSpecific: ['installmentCount', 'merchant', 'promotionalPeriod']
    }
  },

  personal_loan: {
    displayName: 'Personal Loan',
    icon: '💰',
    description: 'Home renovation, wedding, emergencies',
    paymentStructure: 'fixed_monthly',
    interestRate: { min: 8, max: 20, default: 12, type: 'fixed' },
    paymentCalculation: 'amortized',
    earlyPayoff: 'penalty_check',
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 5,
      paymentMethod: 'bank_transfer',
      priority: 'medium'
    },
    specialFeatures: ['purpose_tracking', 'unsecured'],
    formFields: {
      required: ['name', 'totalAmount', 'interestRate', 'loanTermMonths'],
      optional: ['description', 'purpose'],
      typeSpecific: ['purpose', 'unsecured']
    }
  },

  credit_card: {
    displayName: 'Credit Card',
    icon: '💳',
    description: 'Monthly expenses, rewards optimization',
    paymentStructure: 'minimum_or_full',
    interestRate: { min: 15, max: 30, default: 18, type: 'variable' },
    paymentCalculation: 'revolving',
    earlyPayoff: 'flexible',
    gracePeriod: 21,
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 3,
      paymentMethod: 'auto_pay_recommended',
      priority: 'high'
    },
    specialFeatures: ['rewards_program', 'balance_transfer', 'cash_advance'],
    formFields: {
      required: ['name', 'creditLimit', 'currentBalance', 'interestRate'],
      optional: ['description', 'rewardsProgram', 'annualFee'],
      typeSpecific: ['creditLimit', 'rewardsProgram', 'annualFee']
    }
  },

  auto_loan: {
    displayName: 'Auto Loan',
    icon: '🚗',
    description: 'Vehicle financing',
    paymentStructure: 'fixed_monthly',
    interestRate: { min: 3, max: 12, default: 6, type: 'fixed' },
    paymentCalculation: 'amortized',
    earlyPayoff: 'encouraged',
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 7,
      paymentMethod: 'bank_transfer',
      priority: 'medium'
    },
    specialFeatures: ['secured_loan', 'vehicle_tracking', 'insurance_required'],
    formFields: {
      required: ['name', 'totalAmount', 'interestRate', 'loanTermMonths'],
      optional: ['description', 'vehicleDetails'],
      typeSpecific: ['vehicleDetails', 'insuranceRequired', 'securedLoan']
    }
  },

  home_loan: {
    displayName: 'Home Loan',
    icon: '🏠',
    description: 'Property purchase',
    paymentStructure: 'fixed_monthly',
    interestRate: { min: 3, max: 10, default: 6, type: 'variable' },
    paymentCalculation: 'amortized',
    earlyPayoff: 'strategic',
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 10,
      paymentMethod: 'bank_transfer',
      priority: 'high'
    },
    specialFeatures: ['secured_loan', 'tax_benefits', 'escrow_account'],
    formFields: {
      required: ['name', 'totalAmount', 'interestRate', 'loanTermMonths'],
      optional: ['description', 'propertyDetails', 'downPayment'],
      typeSpecific: ['propertyDetails', 'downPayment', 'escrowAccount']
    }
  },

  gold_loan: {
    displayName: 'Gold Loan',
    icon: '🥇',
    description: 'Emergency liquidity against gold',
    paymentStructure: 'interest_only_or_principal',
    interestRate: { min: 12, max: 30, default: 18, type: 'fixed' },
    paymentCalculation: 'simple_interest',
    earlyPayoff: 'encouraged',
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 5,
      paymentMethod: 'bank_transfer',
      priority: 'high'
    },
    specialFeatures: ['secured_loan', 'gold_tracking', 'short_term'],
    formFields: {
      required: ['name', 'totalAmount', 'interestRate'],
      optional: ['description', 'goldDetails'],
      typeSpecific: ['goldDetails', 'purity', 'weight', 'securedLoan']
    }
  },

  utility_debt: {
    displayName: 'Utility Debt',
    icon: '⚡',
    description: 'Electricity, internet, subscription services',
    paymentStructure: 'variable_monthly',
    interestRate: { min: 0, max: 5, default: 0, type: 'fixed' },
    paymentCalculation: 'usage_based',
    earlyPayoff: 'encouraged',
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 5,
      paymentMethod: 'auto_pay_required',
      priority: 'high'
    },
    specialFeatures: ['service_disconnection', 'usage_tracking', 'variable_amounts'],
    formFields: {
      required: ['name', 'serviceProvider', 'accountNumber'],
      optional: ['description', 'serviceType'],
      typeSpecific: ['serviceProvider', 'accountNumber', 'serviceType']
    }
  },

  tax_debt: {
    displayName: 'Tax Debt',
    icon: '🏛️',
    description: 'Government compliance obligations',
    paymentStructure: 'installment_or_lump_sum',
    interestRate: { min: 5, max: 20, default: 12, type: 'penalty_rates' },
    paymentCalculation: 'penalty_interest',
    earlyPayoff: 'strongly_encouraged',
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 14,
      paymentMethod: 'bank_transfer',
      priority: 'urgent'
    },
    specialFeatures: ['government_obligation', 'penalty_rates', 'payment_plan'],
    formFields: {
      required: ['name', 'totalAmount', 'taxYear'],
      optional: ['description', 'taxType'],
      typeSpecific: ['taxYear', 'taxType', 'penaltyRates']
    }
  },

  international_debt: {
    displayName: 'International Debt',
    icon: '🌍',
    description: 'Multi-currency obligations',
    paymentStructure: 'fixed_or_variable',
    interestRate: { min: 0, max: 25, default: 8, type: 'variable' },
    paymentCalculation: 'currency_conversion',
    earlyPayoff: 'exchange_rate_dependent',
    defaultSettings: {
      autoGenerateBills: true,
      sendReminders: true,
      reminderDays: 10,
      paymentMethod: 'international_transfer',
      priority: 'medium'
    },
    specialFeatures: ['multi_currency', 'exchange_rate_risk', 'international_transfer'],
    formFields: {
      required: ['name', 'totalAmount', 'currency', 'country'],
      optional: ['description', 'exchangeRate'],
      typeSpecific: ['currency', 'country', 'exchangeRate']
    }
  }
};

export const getLiabilityBehavior = (type: LiabilityType): LiabilityBehavior => {
  return LIABILITY_BEHAVIORS[type] || LIABILITY_BEHAVIORS.personal_loan;
};

export const getLiabilityTypeOptions = (): Array<{ value: LiabilityType; label: string; icon: string; description: string }> => {
  return Object.entries(LIABILITY_BEHAVIORS).map(([key, behavior]) => ({
    value: key as LiabilityType,
    label: behavior.displayName,
    icon: behavior.icon,
    description: behavior.description
  }));
};

export const getFormFieldsForType = (type: LiabilityType) => {
  const behavior = getLiabilityBehavior(type);
  return behavior.formFields;
};

export const getDefaultSettingsForType = (type: LiabilityType) => {
  const behavior = getLiabilityBehavior(type);
  return behavior.defaultSettings;
};
