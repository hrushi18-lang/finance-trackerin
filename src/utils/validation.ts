/**
 * Comprehensive validation utilities for production-ready finance app
 * Implements strict validation for all financial data
 */

import { z } from 'zod';
import { sanitizeInput, validateAmount, validateEmail, validateCurrency, sanitizeFinancialData } from './security';

// Enhanced validation schemas
export const userSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .transform(sanitizeInput),
  email: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long')
    .refine(validateEmail, 'Invalid email format'),
  avatar_url: z.string().url().optional().nullable()
});

export const accountSchema = z.object({
  name: z.string()
    .min(1, 'Account name is required')
    .max(100, 'Account name too long')
    .transform(sanitizeInput),
  type: z.enum(['checking', 'savings', 'credit', 'investment', 'cash', 'goals_vault', 'other']),
  balance: z.number()
    .min(0, 'Balance cannot be negative')
    .max(999999999.99, 'Balance too large')
    .refine(validateAmount, 'Invalid amount'),
  currency: z.string()
    .length(3, 'Currency must be 3 characters')
    .refine(validateCurrency, 'Invalid currency'),
  isVisible: z.boolean().default(true),
  description: z.string()
    .max(500, 'Description too long')
    .transform(sanitizeInput)
    .optional()
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(999999999.99, 'Amount too large')
    .refine(validateAmount, 'Invalid amount'),
  description: z.string()
    .min(1, 'Description is required')
    .max(200, 'Description too long')
    .transform(sanitizeInput),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category too long')
    .transform(sanitizeInput),
  account_id: z.string().uuid('Invalid account ID'),
  target_account_id: z.string().uuid('Invalid target account ID').optional(),
  date: z.date(),
  notes: z.string()
    .max(1000, 'Notes too long')
    .transform(sanitizeInput)
    .optional(),
  tags: z.array(z.string().max(20)).max(10).optional(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurring_end_date: z.date().optional()
});

export const goalSchema = z.object({
  title: z.string()
    .min(1, 'Goal title is required')
    .max(100, 'Title too long')
    .transform(sanitizeInput),
  description: z.string()
    .max(500, 'Description too long')
    .transform(sanitizeInput)
    .optional(),
  target_amount: z.number()
    .positive('Target amount must be greater than 0')
    .max(999999999.99, 'Target amount too large')
    .refine(validateAmount, 'Invalid amount'),
  current_amount: z.number()
    .min(0, 'Current amount cannot be negative')
    .max(999999999.99, 'Current amount too large')
    .refine(validateAmount, 'Invalid amount'),
  target_date: z.date()
    .min(new Date(), 'Target date must be in the future'),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category too long')
    .transform(sanitizeInput),
  account_id: z.string().uuid('Invalid account ID'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  is_achieved: z.boolean().default(false)
});

export const billSchema = z.object({
  name: z.string()
    .min(1, 'Bill name is required')
    .max(100, 'Name too long')
    .transform(sanitizeInput),
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(999999999.99, 'Amount too large')
    .refine(validateAmount, 'Invalid amount'),
  due_date: z.date(),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category too long')
    .transform(sanitizeInput),
  account_id: z.string().uuid('Invalid account ID'),
  is_paid: z.boolean().default(false),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  notes: z.string()
    .max(500, 'Notes too long')
    .transform(sanitizeInput)
    .optional()
});

export const liabilitySchema = z.object({
  name: z.string()
    .min(1, 'Liability name is required')
    .max(100, 'Name too long')
    .transform(sanitizeInput),
  total_amount: z.number()
    .positive('Total amount must be greater than 0')
    .max(999999999.99, 'Amount too large')
    .refine(validateAmount, 'Invalid amount'),
  remaining_amount: z.number()
    .min(0, 'Remaining amount cannot be negative')
    .max(999999999.99, 'Amount too large')
    .refine(validateAmount, 'Invalid amount'),
  interest_rate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(100, 'Interest rate too high'),
  monthly_payment: z.number()
    .min(0, 'Monthly payment cannot be negative')
    .max(999999999.99, 'Payment too large')
    .refine(validateAmount, 'Invalid amount'),
  due_date: z.date().optional(),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category too long')
    .transform(sanitizeInput),
  account_id: z.string().uuid('Invalid account ID'),
  notes: z.string()
    .max(500, 'Notes too long')
    .transform(sanitizeInput)
    .optional()
});

export const budgetSchema = z.object({
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category too long')
    .transform(sanitizeInput),
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(999999999.99, 'Amount too large')
    .refine(validateAmount, 'Invalid amount'),
  spent: z.number()
    .min(0, 'Spent amount cannot be negative')
    .max(999999999.99, 'Amount too large')
    .refine(validateAmount, 'Invalid amount'),
  period: z.enum(['weekly', 'monthly', 'yearly']).default('monthly'),
  start_date: z.date(),
  end_date: z.date(),
  account_id: z.string().uuid('Invalid account ID').optional()
});

// Validation helper functions
export const validateUser = (data: any) => userSchema.parse(data);
export const validateAccount = (data: any) => accountSchema.parse(data);
export const validateTransaction = (data: any) => transactionSchema.parse(data);
export const validateGoal = (data: any) => goalSchema.parse(data);
export const validateBill = (data: any) => billSchema.parse(data);
export const validateLiability = (data: any) => liabilitySchema.parse(data);
export const validateBudget = (data: any) => budgetSchema.parse(data);

// Safe validation with error handling
export const safeValidate = <T>(schema: z.ZodSchema<T>, data: any): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return {
      success: false,
      errors: ['Validation failed']
    };
  }
};

// Financial calculations validation
export const validateFinancialCalculation = (amount: number, operation: string): boolean => {
  if (!validateAmount(amount)) return false;
  
  switch (operation) {
    case 'add':
    case 'subtract':
    case 'multiply':
    case 'divide':
      return true;
    default:
      return false;
  }
};

// Date validation
export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate < endDate && 
         startDate >= new Date('1900-01-01') && 
         endDate <= new Date('2100-12-31');
};

// Currency conversion validation
export const validateCurrencyConversion = (amount: number, fromCurrency: string, toCurrency: string): boolean => {
  return validateAmount(amount) && 
         validateCurrency(fromCurrency) && 
         validateCurrency(toCurrency) &&
         fromCurrency !== toCurrency;
};

// File upload validation
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/csv',
    'application/json',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum 5MB allowed.' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images, PDFs, and spreadsheets allowed.' };
  }
  
  // Check file name for dangerous characters
  const dangerousChars = /[<>:"/\\|?*]/;
  if (dangerousChars.test(file.name)) {
    return { valid: false, error: 'File name contains invalid characters.' };
  }
  
  return { valid: true };
};

// Search query validation
export const validateSearchQuery = (query: string): { valid: boolean; sanitized?: string; error?: string } => {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Search query is required' };
  }
  
  if (query.length > 100) {
    return { valid: false, error: 'Search query too long' };
  }
  
  // Check for SQL injection patterns
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/i
  ];
  
  if (dangerousPatterns.some(pattern => pattern.test(query))) {
    return { valid: false, error: 'Invalid search query' };
  }
  
  const sanitized = sanitizeInput(query);
  return { valid: true, sanitized };
};

// Pagination validation
export const validatePagination = (page: number, pageSize: number): { valid: boolean; error?: string } => {
  if (page < 0 || !Number.isInteger(page)) {
    return { valid: false, error: 'Invalid page number' };
  }
  
  if (pageSize < 1 || pageSize > 100 || !Number.isInteger(pageSize)) {
    return { valid: false, error: 'Invalid page size. Must be between 1 and 100.' };
  }
  
  return { valid: true };
};

// Utility functions
export const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const calculatePercentage = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};

// Re-export security functions as named exports
export { sanitizeFinancialData } from './security';

// Export all validation functions
export default {
  // Schemas
  userSchema,
  accountSchema,
  transactionSchema,
  goalSchema,
  billSchema,
  liabilitySchema,
  budgetSchema,
  
  // Validation functions
  validateUser,
  validateAccount,
  validateTransaction,
  validateGoal,
  validateBill,
  validateLiability,
  validateBudget,
  
  // Utility functions
  safeValidate,
  validateFinancialCalculation,
  validateDateRange,
  validateCurrencyConversion,
  validateFileUpload,
  validateSearchQuery,
  validatePagination,
  
  // Re-export security functions
  sanitizeFinancialData
};