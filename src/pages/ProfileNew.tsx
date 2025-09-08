import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  DollarSign, 
  Edit3, 
  Camera, 
  Plus, 
  Trash2, 
  Save,
  X,
  Tag,
  Settings,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { useFinance } from '../contexts/FinanceContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { TopNavigation } from '../components/layout/TopNavigation';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  country: string;
  currencies: string[];
  createdAt: string;
  lastLogin: string;
}

interface CustomCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

const ProfileNew: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile: userProfile, updateProfile, loading: profileLoading } = useProfile();
  const { formatCurrency } = useInternationalization();
  const { userCategories, addUserCategory, updateUserCategory, deleteUserCategory } = useFinance();

  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || '',
    name: userProfile?.name || user?.user_metadata?.full_name || 'User',
    email: userProfile?.email || user?.email || '',
    profilePicture: userProfile?.avatar || user?.user_metadata?.avatar_url || '',
    country: userProfile?.country || 'United States',
    currencies: [userProfile?.primaryCurrency || 'USD'],
    createdAt: userProfile?.createdAt?.toString() || user?.created_at || new Date().toISOString(),
    lastLogin: user?.last_sign_in_at || new Date().toISOString()
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [newCurrency, setNewCurrency] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense' as 'income' | 'expense', color: '#3B82F6', icon: 'tag' });

  const availableCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }
  ];

  const categoryColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const categoryIcons = [
    'tag', 'shopping-cart', 'home', 'car', 'utensils',
    'heart', 'book', 'gamepad2', 'music', 'camera'
  ];

  const handleSaveProfile = async () => {
    try {
      if (userProfile?.id) {
        await updateProfile({
          name: profile.name,
          email: profile.email,
          country: profile.country,
          primaryCurrency: profile.currencies[0] || 'USD',
          displayCurrency: profile.currencies[0] || 'USD'
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleAddCurrency = () => {
    if (newCurrency && !profile.currencies.includes(newCurrency)) {
      setProfile(prev => ({
        ...prev,
        currencies: [...prev.currencies, newCurrency]
      }));
      setNewCurrency('');
      setShowCurrencyModal(false);
    }
  };

  const handleRemoveCurrency = (currency: string) => {
    if (profile.currencies.length > 1) {
      setProfile(prev => ({
        ...prev,
        currencies: prev.currencies.filter(c => c !== currency)
      }));
    }
  };

  const handleAddCategory = async () => {
    try {
      await addUserCategory({
        name: newCategory.name,
        type: newCategory.type,
        color: newCategory.color,
        icon: newCategory.icon
      });
      setNewCategory({ name: '', type: 'expense', color: '#3B82F6', icon: 'tag' });
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--background)' }}>
      <TopNavigation title="Profile" showBack />
      
      <div className="px-6 py-4 space-y-6">
        {/* Profile Header */}
        <div className="text-center">
          <div className="relative inline-block mb-4">
            <div 
              className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
              style={{ 
                backgroundColor: 'var(--primary)',
                backgroundImage: profile.profilePicture ? `url(${profile.profilePicture})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!profile.profilePicture && (
                <User size={32} className="text-white" />
              )}
            </div>
            {isEditing && (
              <button
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-light)' }}
              >
                <Camera size={16} className="text-white" />
              </button>
            )}
          </div>
          
          <h1 className="text-2xl font-heading mb-1" style={{ color: 'var(--text-primary)' }}>
            {profile.name}
          </h1>
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
            Last login: {formatLastLogin(profile.lastLogin)}
          </p>
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
              Personal Information
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <Edit3 size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Name */}
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <div className="flex items-center space-x-3">
                <User size={20} style={{ color: 'var(--primary)' }} />
                <div className="flex-1">
                  <label className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                    Full Name
                  </label>
                  {isEditing ? (
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {profile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <div className="flex items-center space-x-3">
                <Mail size={20} style={{ color: 'var(--primary)' }} />
                <div className="flex-1">
                  <label className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                    Email Address
                  </label>
                  {isEditing ? (
                    <Input
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {profile.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Country */}
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
              <div className="flex items-center space-x-3">
                <MapPin size={20} style={{ color: 'var(--primary)' }} />
                <div className="flex-1">
                  <label className="text-xs font-body" style={{ color: 'var(--text-tertiary)' }}>
                    Country
                  </label>
                  {isEditing ? (
                    <Input
                      value={profile.country}
                      onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {profile.country}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Currencies */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
              Currencies
            </h2>
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <Plus size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {profile.currencies.map((currency) => {
              const currencyInfo = availableCurrencies.find(c => c.code === currency);
              return (
                <div
                  key={currency}
                  className="p-4 rounded-2xl flex items-center justify-between"
                  style={{ backgroundColor: 'var(--background-secondary)' }}
                >
                  <div className="flex items-center space-x-3">
                    <DollarSign size={20} style={{ color: 'var(--primary)' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {currency}
                      </p>
                      <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                        {currencyInfo?.name}
                      </p>
                    </div>
                  </div>
                  {profile.currencies.length > 1 && (
                    <button
                      onClick={() => handleRemoveCurrency(currency)}
                      className="p-1 rounded-full hover:bg-red-100 transition-colors"
                    >
                      <X size={16} className="text-red-500" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Categories */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
              Custom Categories
            </h2>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--background-secondary)' }}
            >
              <Plus size={16} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          <div className="space-y-2">
            {userCategories.map((category) => (
              <div
                key={category.id}
                className="p-4 rounded-2xl flex items-center justify-between"
                style={{ backgroundColor: 'var(--background-secondary)' }}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <Tag size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {category.name}
                    </p>
                    <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                      {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteUserCategory(category.id)}
                  className="p-1 rounded-full hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              className="flex-1"
            >
              <Save size={16} className="mr-2" />
              Save Changes
            </Button>
          </div>
        )}

        {/* Logout Button */}
        <div className="pt-4">
          <Button
            onClick={() => setShowLogoutModal(true)}
            variant="outline"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Currency Modal */}
      <Modal
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
        title="Add Currency"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Select Currency
            </label>
            <select
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
              className="w-full mt-2 p-3 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Choose a currency</option>
              {availableCurrencies
                .filter(c => !profile.currencies.includes(c.code))
                .map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} ({currency.symbol})
                  </option>
                ))}
            </select>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowCurrencyModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCurrency}
              disabled={!newCurrency}
              className="flex-1"
            >
              Add Currency
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Add Custom Category"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Category Name
            </label>
            <Input
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter category name"
              className="mt-2"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Type
            </label>
            <select
              value={newCategory.type}
              onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
              className="w-full mt-2 p-3 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--background-secondary)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Color
            </label>
            <div className="flex space-x-2 mt-2">
              {categoryColors.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newCategory.color === color ? 'border-gray-400' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowCategoryModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={!newCategory.name}
              className="flex-1"
            >
              Add Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign Out"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Are you sure you want to sign out? You'll need to sign in again to access your data.
          </p>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowLogoutModal(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileNew;
