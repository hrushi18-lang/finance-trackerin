# Dual Currency System Implementation

## Overview
The finance tracker now supports a comprehensive dual currency system that allows users to:
- Set a primary currency during onboarding
- Create accounts in any currency
- Automatically convert amounts to primary currency for calculations
- Display both native and converted amounts with proper symbols
- Store conversion metadata and exchange rates

## Database Schema Changes

### Enhanced `financial_accounts` Table
```sql
-- New columns added for dual currency support
ALTER TABLE financial_accounts 
ADD COLUMN native_amount numeric(15,2),           -- Original amount in account currency
ADD COLUMN native_currency text,                  -- Original currency code
ADD COLUMN native_symbol text,                    -- Currency symbol for native currency
ADD COLUMN converted_amount numeric(15,2),        -- Amount converted to primary currency
ADD COLUMN converted_currency text,               -- User's primary currency
ADD COLUMN converted_symbol text,                 -- Currency symbol for converted currency
ADD COLUMN exchange_rate numeric(10,4),           -- Exchange rate used for conversion
ADD COLUMN conversion_metadata jsonb,             -- Additional conversion metadata
ADD COLUMN rate_source text,                      -- Source of exchange rate (api/cached/fallback)
ADD COLUMN last_conversion_date timestamptz;      -- When conversion was last performed
```

## Key Features

### 1. Account Creation Flow
- **Primary Currency Detection**: User selects primary currency during onboarding
- **Currency Selection**: User selects currency for new account
- **Automatic Conversion**: If account currency ≠ primary currency, amounts are converted
- **Dual Storage**: Both native and converted amounts are stored with symbols

### 2. Display Logic
- **Same Currency**: Shows only native amount (e.g., $200.00)
- **Different Currency**: Shows both amounts (e.g., ₹50,000.00 + ≈$600.00)
- **Exchange Rate**: Displays current conversion rate
- **Rate Status**: Shows if rates are live, cached, or fallback

### 3. Transaction Processing
- **Currency Detection**: Detects transaction currency from user input
- **Account Matching**: Matches transaction currency with account currency
- **Conversion**: Converts to primary currency for calculations
- **Balance Updates**: Updates both native and converted amounts

## Example Scenarios

### Scenario 1: Same Currency Account
```
User Primary Currency: USD ($)
Account Currency: USD ($)
Initial Balance: $1,000.00

Storage:
- native_amount: 1000.00
- native_currency: USD
- native_symbol: $
- converted_amount: 1000.00
- converted_currency: USD
- converted_symbol: $
- exchange_rate: 1.0
- needs_conversion: false

Display: $1,000.00
```

### Scenario 2: Different Currency Account
```
User Primary Currency: USD ($)
Account Currency: INR (₹)
Initial Balance: ₹50,000.00

Storage:
- native_amount: 50000.00
- native_currency: INR
- native_symbol: ₹
- converted_amount: 600.00
- converted_currency: USD
- converted_symbol: $
- exchange_rate: 0.012
- needs_conversion: true

Display: 
₹50,000.00
≈$600.00
1 INR = 0.0120 USD
```

## API Integration

### Real-Time Exchange Rates
- **Primary API**: ExchangeRate-API (1,500 requests/month free)
- **Fallback APIs**: CurrencyAPI, Fixer.io
- **Caching**: 24-hour cache with localStorage fallback
- **Rate Status**: Live, cached, or fallback indicators

### Rate Sources
1. **API**: Real-time rates from external APIs
2. **Cached**: Rates from previous API calls (within 24 hours)
3. **Fallback**: Hardcoded rates when APIs are unavailable

## Components Updated

### 1. Currency Service (`src/services/currencyService.ts`)
- Real-time API integration
- Dual currency processing
- Rate caching and validation
- Error handling and fallbacks

### 2. Account Form (`src/components/accounts/AccountForm.tsx`)
- Currency selection
- Conversion preview
- Dual amount display

### 3. Account Card (`src/components/accounts/AccountCard.tsx`)
- Dual currency display
- Rate status indicators
- Proper symbol formatting

### 4. Finance Context (`src/contexts/FinanceContext.tsx`)
- Account creation with dual currency
- Transaction processing with conversion
- Balance updates for both amounts

## Usage Examples

### Creating an Account
```typescript
// User with USD primary currency creates INR account
const accountData = {
  name: "Indian Savings",
  type: "bank_savings",
  currency: "INR",
  balance: 50000
};

// System automatically:
// 1. Detects INR ≠ USD
// 2. Converts ₹50,000 to ~$600
// 3. Stores both amounts with symbols
// 4. Sets exchange rate metadata
```

### Displaying Accounts
```typescript
// Same currency account
<AccountCard account={usdAccount} />
// Displays: $1,000.00

// Different currency account
<AccountCard account={inrAccount} showDualCurrency={true} />
// Displays: 
// ₹50,000.00
// ≈$600.00
// 1 INR = 0.0120 USD
```

## Benefits

1. **User Experience**: Clear display of amounts in both currencies
2. **Accuracy**: Real-time exchange rates with fallback support
3. **Flexibility**: Support for any currency combination
4. **Transparency**: Exchange rates and conversion sources visible
5. **Reliability**: Multiple API fallbacks ensure uptime
6. **Performance**: Cached rates reduce API calls

## Future Enhancements

1. **Historical Rates**: Track rate changes over time
2. **Rate Alerts**: Notify users of significant rate changes
3. **Bulk Conversion**: Convert multiple accounts at once
4. **Custom Rates**: Allow manual rate entry
5. **Rate Charts**: Visualize rate trends

## Migration Notes

- Existing accounts are automatically migrated with 1:1 conversion rates
- All new accounts use the enhanced dual currency system
- Backward compatibility maintained for existing data
- Gradual rollout with feature flags possible
