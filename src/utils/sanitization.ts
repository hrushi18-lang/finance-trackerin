/**
 * Input Sanitization Utilities for Financial Data
 * Provides comprehensive sanitization for all user inputs
 */

import DOMPurify from 'isomorphic-dompurify';

export interface SanitizationOptions {
  allowHTML?: boolean;
  maxLength?: number;
  allowNumbers?: boolean;
  allowDecimals?: boolean;
  allowNegative?: boolean;
  currency?: boolean;
  email?: boolean;
  phone?: boolean;
}

/**
 * Sanitize text input
 */
export function sanitizeText(input: string, options: SanitizationOptions = {}): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input.trim();

  // Remove HTML tags if not allowed
  if (!options.allowHTML) {
    sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
  }

  // Limit length
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

/**
 * Sanitize numeric input for financial data
 */
export function sanitizeNumber(input: string | number, options: SanitizationOptions = {}): number {
  if (typeof input === 'number') {
    return sanitizeNumericValue(input, options);
  }

  if (!input || typeof input !== 'string') return 0;

  // Remove all non-numeric characters except decimal point and minus
  let sanitized = input.replace(/[^0-9.-]/g, '');

  // Handle negative numbers
  if (options.allowNegative && sanitized.startsWith('-')) {
    sanitized = '-' + sanitized.substring(1).replace(/-/g, '');
  } else {
    sanitized = sanitized.replace(/-/g, '');
  }

  // Handle decimal points
  if (options.allowDecimals) {
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit decimal places to 2 for currency
    if (options.currency && parts.length === 2) {
      sanitized = parts[0] + '.' + parts[1].substring(0, 2);
    }
  } else {
    sanitized = sanitized.split('.')[0];
  }

  const numericValue = parseFloat(sanitized);
  return sanitizeNumericValue(numericValue, options);
}

/**
 * Sanitize numeric value
 */
function sanitizeNumericValue(value: number, options: SanitizationOptions): number {
  if (isNaN(value)) return 0;

  // Handle negative numbers
  if (!options.allowNegative && value < 0) {
    return Math.abs(value);
  }

  // Round to 2 decimal places for currency
  if (options.currency) {
    return Math.round(value * 100) / 100;
  }

  // Round to 4 decimal places for general numbers
  if (options.allowDecimals) {
    return Math.round(value * 10000) / 10000;
  }

  return Math.round(value);
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const sanitized = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  return sanitized;
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Remove all non-numeric characters
  const sanitized = input.replace(/[^0-9]/g, '');

  // Basic validation for phone number length
  if (sanitized.length < 10 || sanitized.length > 15) {
    throw new Error('Invalid phone number format');
  }

  return sanitized;
}

/**
 * Sanitize currency amount
 */
export function sanitizeCurrency(input: string | number): number {
  return sanitizeNumber(input, {
    allowDecimals: true,
    allowNegative: false,
    currency: true,
    maxLength: 15
  });
}

/**
 * Sanitize transaction amount
 */
export function sanitizeTransactionAmount(input: string | number): number {
  return sanitizeNumber(input, {
    allowDecimals: true,
    allowNegative: true,
    currency: true,
    maxLength: 15
  });
}

/**
 * Sanitize category name
 */
export function sanitizeCategoryName(input: string): string {
  return sanitizeText(input, {
    maxLength: 50,
    allowHTML: false
  });
}

/**
 * Sanitize account name
 */
export function sanitizeAccountName(input: string): string {
  return sanitizeText(input, {
    maxLength: 100,
    allowHTML: false
  });
}

/**
 * Sanitize description
 */
export function sanitizeDescription(input: string): string {
  return sanitizeText(input, {
    maxLength: 500,
    allowHTML: false
  });
}

/**
 * Sanitize goal title
 */
export function sanitizeGoalTitle(input: string): string {
  return sanitizeText(input, {
    maxLength: 100,
    allowHTML: false
  });
}

/**
 * Sanitize liability name
 */
export function sanitizeLiabilityName(input: string): string {
  return sanitizeText(input, {
    maxLength: 100,
    allowHTML: false
  });
}

/**
 * Sanitize bill title
 */
export function sanitizeBillTitle(input: string): string {
  return sanitizeText(input, {
    maxLength: 100,
    allowHTML: false
  });
}

/**
 * Sanitize user profile data
 */
export function sanitizeUserProfile(profile: any): any {
  return {
    name: sanitizeText(profile.name || '', { maxLength: 100 }),
    email: sanitizeEmail(profile.email || ''),
    phone: profile.phone ? sanitizePhone(profile.phone) : '',
    age: profile.age ? sanitizeNumber(profile.age.toString(), { allowNegative: false, allowDecimals: false }) : null,
    avatar_url: profile.avatar_url || ''
  };
}

/**
 * Sanitize transaction data
 */
export function sanitizeTransaction(transaction: any): any {
  return {
    type: sanitizeText(transaction.type || '', { maxLength: 20 }),
    amount: sanitizeTransactionAmount(transaction.amount || 0),
    category: sanitizeCategoryName(transaction.category || ''),
    description: sanitizeDescription(transaction.description || ''),
    date: transaction.date || new Date().toISOString().split('T')[0],
    currency_code: sanitizeText(transaction.currency_code || 'USD', { maxLength: 3 })
  };
}

/**
 * Sanitize account data
 */
export function sanitizeAccount(account: any): any {
  return {
    name: sanitizeAccountName(account.name || ''),
    type: sanitizeText(account.type || '', { maxLength: 50 }),
    institution: sanitizeText(account.institution || '', { maxLength: 100 }),
    platform: sanitizeText(account.platform || '', { maxLength: 100 }),
    account_number: sanitizeText(account.account_number || '', { maxLength: 50 }),
    notes: sanitizeDescription(account.notes || ''),
    currency_code: sanitizeText(account.currency_code || 'USD', { maxLength: 3 })
  };
}

/**
 * Sanitize goal data
 */
export function sanitizeGoal(goal: any): any {
  return {
    title: sanitizeGoalTitle(goal.title || ''),
    description: sanitizeDescription(goal.description || ''),
    target_amount: sanitizeCurrency(goal.target_amount || 0),
    category: sanitizeCategoryName(goal.category || ''),
    currency_code: sanitizeText(goal.currency_code || 'USD', { maxLength: 3 })
  };
}

/**
 * Sanitize liability data
 */
export function sanitizeLiability(liability: any): any {
  return {
    name: sanitizeLiabilityName(liability.name || ''),
    type: sanitizeText(liability.type || '', { maxLength: 50 }),
    total_amount: sanitizeCurrency(liability.total_amount || 0),
    remaining_amount: sanitizeCurrency(liability.remaining_amount || 0),
    interest_rate: sanitizeNumber(liability.interest_rate || 0, { allowDecimals: true, allowNegative: false }),
    monthly_payment: sanitizeCurrency(liability.monthly_payment || 0),
    currency_code: sanitizeText(liability.currency_code || 'USD', { maxLength: 3 })
  };
}

/**
 * Sanitize bill data
 */
export function sanitizeBill(bill: any): any {
  return {
    title: sanitizeBillTitle(bill.title || ''),
    description: sanitizeDescription(bill.description || ''),
    amount: sanitizeCurrency(bill.amount || 0),
    category: sanitizeCategoryName(bill.category || ''),
    currency_code: sanitizeText(bill.currency_code || 'USD', { maxLength: 3 })
  };
}

/**
 * Validate and sanitize form data
 */
export function validateAndSanitizeFormData(data: any, schema: any): any {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    const fieldSchema = schema[key];
    if (!fieldSchema) continue;

    try {
      switch (fieldSchema.type) {
        case 'text':
          sanitized[key] = sanitizeText(value as string, fieldSchema.options);
          break;
        case 'number':
          sanitized[key] = sanitizeNumber(value as string | number, fieldSchema.options);
          break;
        case 'currency':
          sanitized[key] = sanitizeCurrency(value as string | number);
          break;
        case 'email':
          sanitized[key] = sanitizeEmail(value as string);
          break;
        case 'phone':
          sanitized[key] = sanitizePhone(value as string);
          break;
        default:
          sanitized[key] = value;
      }
    } catch (error) {
      throw new Error(`Invalid ${key}: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
  }

  return sanitized;
}

/**
 * Common form schemas
 */
export const FORM_SCHEMAS = {
  transaction: {
    type: { type: 'text', options: { maxLength: 20 } },
    amount: { type: 'currency' },
    category: { type: 'text', options: { maxLength: 50 } },
    description: { type: 'text', options: { maxLength: 500 } },
    currency_code: { type: 'text', options: { maxLength: 3 } }
  },
  account: {
    name: { type: 'text', options: { maxLength: 100 } },
    type: { type: 'text', options: { maxLength: 50 } },
    institution: { type: 'text', options: { maxLength: 100 } },
    platform: { type: 'text', options: { maxLength: 100 } },
    account_number: { type: 'text', options: { maxLength: 50 } },
    notes: { type: 'text', options: { maxLength: 500 } },
    currency_code: { type: 'text', options: { maxLength: 3 } }
  },
  goal: {
    title: { type: 'text', options: { maxLength: 100 } },
    description: { type: 'text', options: { maxLength: 500 } },
    target_amount: { type: 'currency' },
    category: { type: 'text', options: { maxLength: 50 } },
    currency_code: { type: 'text', options: { maxLength: 3 } }
  },
  liability: {
    name: { type: 'text', options: { maxLength: 100 } },
    type: { type: 'text', options: { maxLength: 50 } },
    total_amount: { type: 'currency' },
    remaining_amount: { type: 'currency' },
    interest_rate: { type: 'number', options: { allowDecimals: true, allowNegative: false } },
    monthly_payment: { type: 'currency' },
    currency_code: { type: 'text', options: { maxLength: 3 } }
  },
  bill: {
    title: { type: 'text', options: { maxLength: 100 } },
    description: { type: 'text', options: { maxLength: 500 } },
    amount: { type: 'currency' },
    category: { type: 'text', options: { maxLength: 50 } },
    currency_code: { type: 'text', options: { maxLength: 3 } }
  },
  userProfile: {
    name: { type: 'text', options: { maxLength: 100 } },
    email: { type: 'email' },
    phone: { type: 'phone' },
    age: { type: 'number', options: { allowDecimals: false, allowNegative: false } }
  }
};

export default {
  sanitizeText,
  sanitizeNumber,
  sanitizeEmail,
  sanitizePhone,
  sanitizeCurrency,
  sanitizeTransactionAmount,
  sanitizeCategoryName,
  sanitizeAccountName,
  sanitizeDescription,
  sanitizeGoalTitle,
  sanitizeLiabilityName,
  sanitizeBillTitle,
  sanitizeUserProfile,
  sanitizeTransaction,
  sanitizeAccount,
  sanitizeGoal,
  sanitizeLiability,
  sanitizeBill,
  validateAndSanitizeFormData,
  FORM_SCHEMAS
};
