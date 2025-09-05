import React from 'react';
import { User, Globe, DollarSign, Briefcase, Calendar } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useForm } from 'react-hook-form';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CurrencyIcon } from '../common/CurrencyIcon';

interface UserDetailsData {
  name: string;
  age: number;
  country: string;
  currency: string;
  profession: string;
  monthlyIncome: number;
}

interface OnboardingUserDetailsProps {
  onNext: (data: UserDetailsData) => void;
  onPrev: () => void;
  initialData?: Partial<UserDetailsData>;
  canGoBack?: boolean;
}

export const OnboardingUserDetails: React.FC<OnboardingUserDetailsProps> = ({ 
  onNext, 
  onPrev, 
  initialData,
  canGoBack = true
}) => {
  const { supportedCurrencies, supportedRegions } = useInternationalization();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<UserDetailsData>({
    defaultValues: {
      country: 'US',
      currency: 'USD',
      ...initialData
    }
  });

  const selectedCountry = watch('country');
  const selectedCurrency = watch('currency');

  const getCurrencyFlag = (code: string) => {
    const flagMap: Record<string, string> = {
      'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'JPY': '🇯🇵', 'CNY': '🇨🇳',
      'INR': '🇮🇳', 'AUD': '🇦🇺', 'CAD': '🇨🇦', 'SGD': '🇸🇬', 'HKD': '🇭🇰'
    };
    return flagMap[code] || '💱';
  };

  const getCountryFlag = (code: string) => {
    const flagMap: Record<string, string> = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷',
      'IN': '🇮🇳', 'AU': '🇦🇺', 'JP': '🇯🇵', 'CN': '🇨🇳', 'SG': '🇸🇬'
    };
    return flagMap[code] || '🌍';
  };

  const onSubmit = (data: UserDetailsData) => {
    onNext(data);
  };

  return (
    <div className="min-h-screen bg-forest-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-forest-700/80 backdrop-blur-md rounded-3xl p-8 border border-forest-600/30 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">
              Let's get to know you
            </h2>
            <p className="text-forest-200 font-body">
              Personalize your financial journey.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-forest-400" />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                className="w-full pl-12 pr-4 py-4 bg-forest-600/30 border border-forest-500/30 rounded-2xl text-white placeholder-forest-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20 transition-all font-body"
              />
              {errors.name && (
                <p className="text-error-400 text-sm mt-1 font-body">{errors.name.message}</p>
              )}
            </div>

            {/* Age and Country */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar size={18} className="text-forest-400" />
                </div>
                <input
                  type="number"
                  placeholder="Age"
                  {...register('age', {
                    required: 'Age is required',
                    min: { value: 16, message: 'Must be at least 16' },
                    max: { value: 100, message: 'Must be less than 100' }
                  })}
                  className="w-full pl-12 pr-4 py-4 bg-forest-600/30 border border-forest-500/30 rounded-2xl text-white placeholder-forest-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20 transition-all font-body"
                />
                {errors.age && (
                  <p className="text-error-400 text-sm mt-1 font-body">{errors.age.message}</p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Globe size={18} className="text-forest-400" />
                </div>
                <select
                  {...register('country', { required: 'Country is required' })}
                  className="w-full pl-12 pr-4 py-4 bg-forest-600/30 border border-forest-500/30 rounded-2xl text-white focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20 transition-all font-body appearance-none"
                >
                  <option value="" className="bg-forest-800">Country</option>
                  {supportedRegions.map((region) => (
                    <option key={region.countryCode} value={region.countryCode} className="bg-forest-800">
                      {getCountryFlag(region.countryCode)} {region.country}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="text-error-400 text-sm mt-1 font-body">{errors.country.message}</p>
                )}
              </div>
            </div>

            {/* Preferred Currency */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign size={18} className="text-forest-400" />
              </div>
              <select
                {...register('currency', { required: 'Currency is required' })}
                className="w-full pl-12 pr-4 py-4 bg-forest-600/30 border border-forest-500/30 rounded-2xl text-white focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20 transition-all font-body appearance-none"
              >
                <option value="" className="bg-forest-800">Preferred Currency (e.g. USD, EUR)</option>
                {supportedCurrencies.map((curr) => (
                  <option key={curr.code} value={curr.code} className="bg-forest-800">
                    {getCurrencyFlag(curr.code)} {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
              {errors.currency && (
                <p className="text-error-400 text-sm mt-1 font-body">{errors.currency.message}</p>
              )}
            </div>

            {/* Profession */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Briefcase size={18} className="text-forest-400" />
              </div>
              <input
                type="text"
                placeholder="Profession"
                {...register('profession', {
                  required: 'Profession is required'
                })}
                className="w-full pl-12 pr-4 py-4 bg-forest-600/30 border border-forest-500/30 rounded-2xl text-white placeholder-forest-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20 transition-all font-body"
              />
              {errors.profession && (
                <p className="text-error-400 text-sm mt-1 font-body">{errors.profession.message}</p>
              )}
            </div>

            {/* Monthly Income */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CurrencyIcon currencyCode={selectedCurrency || 'USD'} size={18} className="text-forest-400" />
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="Monthly Income"
                {...register('monthlyIncome', {
                  required: 'Monthly income is required',
                  min: { value: 0, message: 'Income cannot be negative' }
                })}
                className="w-full pl-12 pr-4 py-4 bg-forest-600/30 border border-forest-500/30 rounded-2xl text-white placeholder-forest-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20 transition-all font-body"
              />
              {errors.monthlyIncome && (
                <p className="text-error-400 text-sm mt-1 font-body">{errors.monthlyIncome.message}</p>
              )}
            </div>

            {/* Continue Button */}
            <Button 
              type="submit" 
              className="w-full py-4 text-lg font-heading font-semibold bg-white text-forest-800 hover:bg-forest-50 rounded-2xl shadow-lg transition-all"
            >
              Continue
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};