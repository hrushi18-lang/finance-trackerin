/**
 * Test file to verify currency service works without process.env
 */

import { currencyService } from '../currencyService';

describe('CurrencyService', () => {
  test('should initialize without process.env errors', () => {
    // This test ensures the service can be instantiated without throwing
    // the "process is not defined" error
    expect(() => {
      const service = currencyService;
      expect(service).toBeDefined();
    }).not.toThrow();
  });

  test('should handle missing API key gracefully', () => {
    // Test that the service works even without an API key
    expect(() => {
      const service = currencyService;
      const rateInfo = service.getRateStatus();
      expect(rateInfo).toBeDefined();
    }).not.toThrow();
  });
});
