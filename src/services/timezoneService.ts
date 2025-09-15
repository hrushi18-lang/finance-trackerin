import { format, parseISO, startOfDay, endOfDay, isWithinInterval, addDays, subDays } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

export interface BusinessDate {
  date: Date;
  timezone: string;
  businessDay: boolean;
  marketOpen: boolean;
  rateUpdateTime: Date;
  accountingPeriod: string;
}

export interface TimezoneConfig {
  userTimezone: string;
  businessTimezone: string;
  marketTimezone: string;
  accountingTimezone: string;
  businessHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  marketHours: {
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
  weekendDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  holidays: string[]; // YYYY-MM-DD format
}

export class TimezoneService {
  private config: TimezoneConfig;

  constructor(config: TimezoneConfig) {
    this.config = config;
  }

  // Get current business date in user's timezone
  getCurrentBusinessDate(): BusinessDate {
    const now = new Date();
    const userTime = utcToZonedTime(now, this.config.userTimezone);
    const businessTime = utcToZonedTime(now, this.config.businessTimezone);
    const marketTime = utcToZonedTime(now, this.config.marketTimezone);
    const accountingTime = utcToZonedTime(now, this.config.accountingTimezone);

    return {
      date: userTime,
      timezone: this.config.userTimezone,
      businessDay: this.isBusinessDay(userTime),
      marketOpen: this.isMarketOpen(marketTime),
      rateUpdateTime: this.getLastRateUpdateTime(accountingTime),
      accountingPeriod: this.getAccountingPeriod(accountingTime)
    };
  }

  // Check if a date is a business day
  isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Check if it's a weekend
    if (this.config.weekendDays.includes(dayOfWeek)) {
      return false;
    }
    
    // Check if it's a holiday
    if (this.config.holidays.includes(dateString)) {
      return false;
    }
    
    return true;
  }

  // Check if markets are open
  isMarketOpen(date: Date): boolean {
    if (!this.isBusinessDay(date)) {
      return false;
    }
    
    const timeString = format(date, 'HH:mm');
    const startTime = this.config.marketHours.start;
    const endTime = this.config.marketHours.end;
    
    return timeString >= startTime && timeString <= endTime;
  }

  // Get the last rate update time
  getLastRateUpdateTime(date: Date): Date {
    // Rates are typically updated every hour during business hours
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    // Round down to the last hour
    const lastUpdate = new Date(date);
    lastUpdate.setMinutes(0, 0, 0);
    
    // If it's before market open, use previous business day's last update
    if (!this.isMarketOpen(date)) {
      const previousBusinessDay = this.getPreviousBusinessDay(date);
      lastUpdate.setTime(previousBusinessDay.getTime());
      lastUpdate.setHours(16, 0, 0, 0); // 4 PM market close
    }
    
    return lastUpdate;
  }

  // Get accounting period (e.g., "2024-Q1", "2024-01")
  getAccountingPeriod(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    
    // Return quarterly period
    return `${year}-Q${quarter}`;
  }

  // Get previous business day
  getPreviousBusinessDay(date: Date): Date {
    let previousDay = subDays(date, 1);
    
    while (!this.isBusinessDay(previousDay)) {
      previousDay = subDays(previousDay, 1);
    }
    
    return previousDay;
  }

  // Get next business day
  getNextBusinessDay(date: Date): Date {
    let nextDay = addDays(date, 1);
    
    while (!this.isBusinessDay(nextDay)) {
      nextDay = addDays(nextDay, 1);
    }
    
    return nextDay;
  }

  // Convert date to specific timezone
  convertToTimezone(date: Date, timezone: string): Date {
    return utcToZonedTime(date, timezone);
  }

  // Convert date from specific timezone to UTC
  convertFromTimezone(date: Date, timezone: string): Date {
    return zonedTimeToUtc(date, timezone);
  }

  // Get business hours for a specific date
  getBusinessHours(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    const [startHour, startMinute] = this.config.businessHours.start.split(':').map(Number);
    start.setHours(startHour, startMinute, 0, 0);
    
    const end = new Date(date);
    const [endHour, endMinute] = this.config.businessHours.end.split(':').map(Number);
    end.setHours(endHour, endMinute, 0, 0);
    
    return { start, end };
  }

  // Check if a time is within business hours
  isWithinBusinessHours(date: Date): boolean {
    const { start, end } = this.getBusinessHours(date);
    return isWithinInterval(date, { start, end });
  }

  // Get market hours for a specific date
  getMarketHours(date: Date): { start: Date; end: Date } {
    const start = new Date(date);
    const [startHour, startMinute] = this.config.marketHours.start.split(':').map(Number);
    start.setHours(startHour, startMinute, 0, 0);
    
    const end = new Date(date);
    const [endHour, endMinute] = this.config.marketHours.end.split(':').map(Number);
    end.setHours(endHour, endMinute, 0, 0);
    
    return { start, end };
  }

  // Check if a time is within market hours
  isWithinMarketHours(date: Date): boolean {
    const { start, end } = this.getMarketHours(date);
    return isWithinInterval(date, { start, end });
  }

  // Get rate validity period
  getRateValidityPeriod(date: Date): { start: Date; end: Date } {
    const start = this.getLastRateUpdateTime(date);
    const end = this.getNextRateUpdateTime(date);
    
    return { start, end };
  }

  // Get next rate update time
  getNextRateUpdateTime(date: Date): Date {
    const nextUpdate = new Date(date);
    nextUpdate.setHours(date.getHours() + 1, 0, 0, 0);
    
    // If next update is after market close, use next business day's first update
    if (!this.isMarketOpen(nextUpdate)) {
      const nextBusinessDay = this.getNextBusinessDay(date);
      nextUpdate.setTime(nextBusinessDay.getTime());
      nextUpdate.setHours(9, 0, 0, 0); // 9 AM market open
    }
    
    return nextUpdate;
  }

  // Format date for display in user's timezone
  formatDateForUser(date: Date, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string {
    const userTime = utcToZonedTime(date, this.config.userTimezone);
    return format(userTime, formatString);
  }

  // Format date for storage in UTC
  formatDateForStorage(date: Date): string {
    return date.toISOString();
  }

  // Parse date from storage (UTC)
  parseDateFromStorage(dateString: string): Date {
    return parseISO(dateString);
  }

  // Get timezone offset in minutes
  getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const zoned = utcToZonedTime(utc, timezone);
    return (zoned.getTime() - utc.getTime()) / 60000;
  }

  // Check if two dates are on the same business day
  isSameBusinessDay(date1: Date, date2: Date): boolean {
    const businessDate1 = this.getCurrentBusinessDate();
    const businessDate2 = this.getCurrentBusinessDate();
    
    return format(businessDate1.date, 'yyyy-MM-dd') === format(businessDate2.date, 'yyyy-MM-dd');
  }

  // Get business day range
  getBusinessDayRange(startDate: Date, endDate: Date): Date[] {
    const businessDays: Date[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (this.isBusinessDay(currentDate)) {
        businessDays.push(new Date(currentDate));
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return businessDays;
  }

  // Update configuration
  updateConfig(newConfig: Partial<TimezoneConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): TimezoneConfig {
    return { ...this.config };
  }
}

// Default configuration
const defaultConfig: TimezoneConfig = {
  userTimezone: 'America/New_York',
  businessTimezone: 'America/New_York',
  marketTimezone: 'America/New_York',
  accountingTimezone: 'UTC',
  businessHours: {
    start: '09:00',
    end: '17:00'
  },
  marketHours: {
    start: '09:30',
    end: '16:00'
  },
  weekendDays: [0, 6], // Sunday and Saturday
  holidays: [
    '2024-01-01', // New Year's Day
    '2024-01-15', // Martin Luther King Jr. Day
    '2024-02-19', // Presidents' Day
    '2024-03-29', // Good Friday
    '2024-05-27', // Memorial Day
    '2024-06-19', // Juneteenth
    '2024-07-04', // Independence Day
    '2024-09-02', // Labor Day
    '2024-11-28', // Thanksgiving
    '2024-12-25'  // Christmas Day
  ]
};

// Export singleton instance
export const timezoneService = new TimezoneService(defaultConfig);
