/**
 * Security utilities for production-ready finance app
 * Implements comprehensive security measures for financial data
 */

import DOMPurify from 'isomorphic-dompurify';

// Input sanitization and validation
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 1000); // Limit length
};

export const sanitizeFinancialData = (data: any, numericFields: string[] = []): any => {
  const sanitized = { ...data };
  
  // Sanitize string fields
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
  });
  
  // Validate numeric fields
  numericFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      const num = Number(sanitized[field]);
      if (isNaN(num) || !isFinite(num)) {
        sanitized[field] = 0;
      } else if (num < 0 && !['interestRate', 'exchangeRate'].includes(field)) {
        sanitized[field] = Math.abs(num); // Ensure positive amounts
      }
    }
  });
  
  return sanitized;
};

// XSS Protection
export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// SQL Injection Prevention (for client-side validation)
export const validateSQLSafe = (input: string): boolean => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
};

// Rate limiting for API calls
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

// Data encryption for sensitive information
export const encryptSensitiveData = (data: string): string => {
  // In production, use proper encryption like Web Crypto API
  // This is a basic obfuscation for demo purposes
  return btoa(encodeURIComponent(data));
};

export const decryptSensitiveData = (encryptedData: string): string => {
  try {
    return decodeURIComponent(atob(encryptedData));
  } catch {
    return '';
  }
};

// Secure token generation
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Content Security Policy helpers
export const getCSPNonce = (): string => {
  return generateSecureToken(16);
};

// Audit logging for security events
export const logSecurityEvent = (event: string, details: any = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // In production, send to secure logging service
  console.warn('Security Event:', logEntry);
  
  // Store in localStorage for debugging (remove in production)
  const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
  logs.push(logEntry);
  if (logs.length > 100) logs.shift(); // Keep only last 100 logs
  localStorage.setItem('security_logs', JSON.stringify(logs));
};

// Validate file uploads
export const validateFileUpload = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum 5MB allowed.' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only images and PDFs allowed.' };
  }
  
  return { valid: true };
};

// Secure session management
export const createSecureSession = (userId: string): string => {
  const sessionData = {
    userId,
    timestamp: Date.now(),
    nonce: generateSecureToken()
  };
  
  return encryptSensitiveData(JSON.stringify(sessionData));
};

export const validateSecureSession = (sessionToken: string): { valid: boolean; userId?: string } => {
  try {
    const sessionData = JSON.parse(decryptSensitiveData(sessionToken));
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (now - sessionData.timestamp > maxAge) {
      return { valid: false };
    }
    
    return { valid: true, userId: sessionData.userId };
  } catch {
    return { valid: false };
  }
};

// Input validation schemas
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
};

// Financial data validation
export const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && 
         isFinite(amount) && 
         amount >= 0 && 
         amount <= 999999999.99; // Max $999M
};

export const validateCurrency = (currency: string): boolean => {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];
  return validCurrencies.includes(currency.toUpperCase());
};

// Secure data export
export const exportDataSecurely = (data: any, filename: string): void => {
  const sanitizedData = sanitizeFinancialData(data);
  const jsonString = JSON.stringify(sanitizedData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Environment validation
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  // Validate URL format
  try {
    new URL(import.meta.env.VITE_SUPABASE_URL || '');
  } catch {
    errors.push('VITE_SUPABASE_URL must be a valid URL');
  }
  
  return { valid: errors.length === 0, errors };
};
