# Live Currency Conversion Guide

## Overview

The finance tracker now supports **live currency conversion** with real-time exchange rates instead of hardcoded USD-based rates. This provides accurate, up-to-date currency conversions for all financial transactions.

## Key Features

### ✅ **Live Exchange Rates**
- Fetches real-time exchange rates from multiple APIs
- Automatic fallback to cached rates when APIs are unavailable
- Support for any base currency (not just USD)

### ✅ **Smart Caching**
- 5-minute cache for conversion results
- 24-hour cache for exchange rates
- Automatic cache invalidation and refresh

### ✅ **Multiple API Providers**
- ExchangeRate-API (primary)
- Fixer.io (backup)
- CurrencyAPI (tertiary)
- Hardcoded fallback rates

### ✅ **Error Handling**
- Graceful degradation when APIs fail
- Fallback to cached or hardcoded rates
- Comprehensive error logging

## Usage

### Basic Conversion

```typescript
import { liveCurrencyService } from '../services/liveCurrencyService';

// Convert 100 USD to EUR
const result = await liveCurrencyService.convertAmount(100, 'USD', 'EUR');
console.log(result);
// {
//   originalAmount: 100,
//   convertedAmount: 92.50,
//   exchangeRate: 0.9250,
//   fromCurrency: 'USD',
//   toCurrency: 'EUR',
//   rateSource: 'live',
//   lastUpdated: Date
// }
```

### Get Exchange Rate

```typescript
// Get exchange rate between two currencies
const rate = await liveCurrencyService.getExchangeRate('USD', 'EUR');
console.log(rate); // 0.9250
```

### Get All Rates

```typescript
// Get all rates for a specific base currency
const rates = await liveCurrencyService.getAllRates('USD');
console.log(rates);
// {
//   'EUR': 0.9250,
//   'GBP': 0.7900,
//   'JPY': 150.0000,
//   // ... more currencies
// }
```

### Refresh Rates

```typescript
// Force refresh all exchange rates
await liveCurrencyService.refreshRates('USD');
```

## Integration Examples

### Transaction Form

```typescript
import { liveCurrencyService } from '../services/liveCurrencyService';

const TransactionForm = () => {
  const [conversionResult, setConversionResult] = useState(null);

  const handleCurrencyConversion = async (amount, fromCurrency, toCurrency) => {
    try {
      const result = await liveCurrencyService.convertAmount(amount, fromCurrency, toCurrency);
      setConversionResult(result);
    } catch (error) {
      console.error('Conversion failed:', error);
    }
  };

  return (
    // Your form JSX
  );
};
```

### Multi-Currency Transaction

```typescript
import { convertTransactionCurrency } from '../utils/multi-currency-converter';

const processTransaction = async (transactionData) => {
  const conversion = await convertTransactionCurrency({
    amount: transactionData.amount,
    currency: transactionData.currency,
    accountCurrency: account.currency,
    primaryCurrency: user.primaryCurrency
  });

  // Use conversion.accountAmount for account balance updates
  // Use conversion.primaryAmount for display in primary currency
};
```

## API Configuration

### Environment Variables

Add these to your `.env` file for enhanced API access:

```env
# Optional: For Fixer.io API (higher rate limits)
REACT_APP_FIXER_API_KEY=your_fixer_api_key

# Optional: For CurrencyAPI (backup provider)
REACT_APP_CURRENCY_API_KEY=your_currency_api_key
```

### Rate Limits

- **ExchangeRate-API**: 1000 requests/month (free)
- **Fixer.io**: 1000 requests/month (free with API key)
- **CurrencyAPI**: 300 requests/month (free with API key)

## Testing

### Run Currency Conversion Tests

```typescript
import { runCurrencyConversionTests } from '../utils/currency-conversion-test';

// Run all tests
const results = await runCurrencyConversionTests();
console.log(results);
```

### Test Component

Use the `LiveCurrencyConverter` component for manual testing:

```typescript
import { LiveCurrencyConverter } from '../components/currency/LiveCurrencyConverter';

// In your app
<LiveCurrencyConverter />
```

## Migration from Hardcoded Rates

### Before (Hardcoded USD Base)

```typescript
// Old way - hardcoded rates
const conversionRates = {
  'USD': { 'EUR': 0.85, 'GBP': 0.73 },
  'EUR': { 'USD': 1.18, 'GBP': 0.86 }
};
const rate = conversionRates[fromCurrency]?.[toCurrency] || 1;
```

### After (Live Rates)

```typescript
// New way - live rates
const rate = await liveCurrencyService.getExchangeRate(fromCurrency, toCurrency);
```

## Performance Considerations

### Caching Strategy
- **Conversion Results**: 5-minute cache
- **Exchange Rates**: 24-hour cache
- **Automatic Refresh**: When cache expires

### Best Practices
1. **Batch Conversions**: Convert multiple amounts in one call
2. **Cache Utilization**: Check cache before making API calls
3. **Error Handling**: Always provide fallback behavior
4. **Rate Limiting**: Respect API rate limits

## Troubleshooting

### Common Issues

1. **API Failures**: Check network connection and API keys
2. **Rate Limiting**: Wait for rate limit reset or use cached rates
3. **Invalid Currencies**: Ensure currency codes are valid ISO codes
4. **Cache Issues**: Clear cache with `liveCurrencyService.clearCache()`

### Debug Mode

Enable debug logging:

```typescript
// Check cache stats
const stats = liveCurrencyService.getCacheStats();
console.log('Cache stats:', stats);

// Clear cache
liveCurrencyService.clearCache();
```

## Database Schema

The system uses the `exchange_rates` table to store rates:

```sql
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(15,8) NOT NULL,
  source VARCHAR(20) NOT NULL, -- 'api', 'manual', 'fallback'
  api_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Support

For issues or questions about live currency conversion:

1. Check the test results in the `LiveCurrencyConverter` component
2. Review the browser console for error messages
3. Verify API keys and network connectivity
4. Check the database for stored exchange rates

---

**Note**: This system automatically handles currency conversion for all financial operations, ensuring accurate and up-to-date exchange rates for better financial tracking.
