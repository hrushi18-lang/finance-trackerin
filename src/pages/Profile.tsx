import React, { useState } from 'react';
import { User, Settings, Bell, Shield, HelpCircle, Info, LogOut, Repeat, DollarSign, Globe, Calculator, RefreshCw, Tag, Wallet, CreditCard, Target, PieChart, Calendar, TrendingUp, Edit3, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Already exists
import { useTranslation } from 'react-i18next';
import { TopNavigation } from '../components/layout/TopNavigation';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { CurrencySelector } from '../components/common/CurrencySelector';
import { RegionSelector } from '../components/common/RegionSelector';
import { NotificationsPanel } from '../components/common/NotificationsPanel';
import { CategoryManagement } from '../components/settings/CategoryManagement';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { CurrencyIcon } from '../components/common/CurrencyIcon';
import { format } from 'date-fns';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth(); // Already exists
  const { accounts, goals, budgets, liabilities, recurringTransactions } = useFinance();
  const { formatCurrency, currency } = useInternationalization();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  const handleLogout = async () => {
    try { // Already exists
      setIsLoggingOut(true);
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleRestartOnboarding = () => {
    navigate('/onboarding'); // Already exists
  };

  // Calculate summary stats
  const totalBalance = (accounts || [])
    .filter(account => account.isVisible)
    .reduce((sum, account) => sum + (Number(account.balance) || 0), 0); // Already exists

  const activeGoals = (goals || []).filter(g => 
    (g.currentAmount / g.targetAmount) < 1
  );

  const totalGoalTarget = (goals || []).reduce((sum, g) => sum + g.targetAmount, 0); // Already exists

  const activeBudgets = (budgets || []).length;
  const totalBudgetLimit = (budgets || []).reduce((sum, b) => sum + b.amount, 0);

  const outstandingLiabilities = (liabilities || []).filter(l => l.remainingAmount > 0);
  const totalDebt = outstandingLiabilities.reduce((sum, l) => sum + l.remainingAmount, 0);

  const upcomingBills = (bills || []) // Changed to bills
    .filter(rt => rt.isActive && rt.type === 'expense')
    .sort((a, b) => new Date(a.nextOccurrenceDate).getTime() - new Date(b.nextOccurrenceDate).getTime())
    .slice(0, 3);

  const getAccountIcon = (type: string) => {
    const icons = {
      bank_savings: '🏦',
      bank_current: '🏛️',
      bank_student: '🎓',
      digital_wallet: '📱',
      cash: '💵',
      credit_card: '💳',
      investment: '📈'
    };
    return icons[type as keyof typeof icons] || '💳';
  };

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation title="Profile & Settings" /> // Already exists
      
      <div className="px-4 py-4 sm:py-6 space-y-6">
        {/* Basic Info Section */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-primary-500/20 rounded-lg">
              <User size={24} className="text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Basic Information</h2>
          </div>
          
          {/* User Profile */} // Already exists
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={32} className="text-primary-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-white mb-1">
              {user?.name || 'User'}
            </h3>
            <p className="text-gray-400">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-2">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          {/* International Settings */} // Already exists
          <div className="space-y-4">
            <LanguageSwitcher />
            <CurrencySelector />
            <RegionSelector />
          </div>
        </div>

        {/* Account & Subscription Section */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Settings size={24} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Account & Subscription</h2>
          </div>
          
          <div className="space-y-4"> // Already exists
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Plan</h3>
                  <p className="text-sm text-gray-400">Current subscription plan</p>
                </div>
                <span className="px-3 py-1 bg-success-500/20 text-success-400 rounded-full text-sm font-medium">
                  Free
                </span>
              </div>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">Features</h3>
                  <p className="text-sm text-gray-400">All core features included</p>
                </div>
                <span className="text-sm text-primary-400">Unlimited</span>
              </div>
            </div>
          </div>
        </div>

        {/* Linked Accounts Overview */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3"> // Already exists
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Wallet size={24} className="text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Linked Accounts</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBalances(!showBalances)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={showBalances ? "Hide balances" : "Show balances"}
              >
                {showBalances ? (
                  <EyeOff size={16} className="text-gray-400" />
                ) : (
                  <Eye size={16} className="text-gray-400" />
                )}
              </button>
              <Button
                onClick={() => navigate('/accounts-hub')}
                size="sm"
                variant="outline"
                className="border-primary-500/30 text-primary-400 hover:bg-primary-500/10"
              >
                Manage Accounts
              </Button>
            </div>
          </div>

          {(accounts || []).length === 0 ? ( // Already exists
            <div className="text-center py-8">
              <Wallet size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">No accounts added yet</p>
              <Button onClick={() => navigate('/accounts-hub')}>
                <Plus size={16} className="mr-2" />
                Add First Account
              </Button>
            </div>
          ) : ( // Already exists
            <div className="space-y-3">
              {/* Total Balance */}
              {showBalances && (
                <div className="bg-black/30 rounded-lg p-4 text-center mb-4">
                  <p className="text-sm text-gray-400 mb-1">Total Balance</p>
                  <p className="text-2xl font-bold text-white">
                    <CurrencyIcon currencyCode={currency.code} size={20} className="inline mr-2" />
                    {totalBalance.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(accounts || []).filter(a => a.isVisible).length} visible accounts
                  </p>
                </div>
              )}

              {/* Account List */} // Already exists
              {(accounts || []).slice(0, 5).map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getAccountIcon(account.type)}</span>
                    <div>
                      <p className="font-medium text-white">{account.name}</p>
                      <p className="text-xs text-gray-400 capitalize">
                        {account.type.replace('_', ' ')}
                        {account.institution && ` • ${account.institution}`}
                        {account.platform && ` • ${account.platform}`}
                      </p>
                    </div>
                  </div>
                  {account.isVisible && showBalances && (
                    <p className="font-medium text-white">
                      <CurrencyIcon currencyCode={currency.code} size={14} className="inline mr-1" />
                      {account.balance.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
              
              {(accounts || []).length > 5 && ( // Already exists
                <div className="text-center pt-2">
                  <button
                    onClick={() => navigate('/accounts-hub')}
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                  >
                    View All {(accounts || []).length} Accounts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Goals & Budgets Snapshot */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg"> // Already exists
              <Target size={24} className="text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Goals & Budgets</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Goals Summary */}
            <div className="bg-black/30 rounded-lg p-4"> // Already exists
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Target size={16} className="text-primary-400" />
                  <span className="font-medium text-white">Goals</span>
                </div>
                <Button
                  onClick={() => navigate('/goals')}
                  size="sm"
                  variant="outline"
                  className="text-xs border-primary-500/30 text-primary-400"
                >
                  Manage
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">
                  Active: {activeGoals.length} goals
                </p>
                <p className="text-lg font-bold text-white">
                  <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                  {totalGoalTarget.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total target amount</p>
              </div>
            </div>

            {/* Budgets Summary */} // Already exists
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <PieChart size={16} className="text-warning-400" />
                  <span className="font-medium text-white">Budgets</span>
                </div>
                <Button
                  onClick={() => navigate('/budgets')}
                  size="sm"
                  variant="outline"
                  className="text-xs border-warning-500/30 text-warning-400"
                >
                  Manage
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">
                  Active: {activeBudgets} budgets
                </p>
                <p className="text-lg font-bold text-white">
                  <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                  {totalBudgetLimit.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total budget limit</p>
              </div>
            </div>
          </div>

          {/* Recent Goals */} // Already exists
          {(goals || []).length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Recent Goals</h4>
              {(goals || []).slice(0, 3).map((goal) => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Target size={14} className="text-primary-400" />
                      <div>
                        <p className="text-sm font-medium text-white">{goal.title}</p>
                        <p className="text-xs text-gray-400">{goal.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white">{progress.toFixed(1)}%</p>
                      <p className="text-xs text-gray-400">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Liabilities & Bills Snapshot */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg"> // Already exists
              <CreditCard size={24} className="text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Liabilities & Bills</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Liabilities Summary */}
            <div className="bg-black/30 rounded-lg p-4"> // Already exists
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <CreditCard size={16} className="text-error-400" />
                  <span className="font-medium text-white">Debts</span>
                </div>
                <Button
                  onClick={() => navigate('/liabilities')}
                  size="sm"
                  variant="outline"
                  className="text-xs border-error-500/30 text-error-400"
                >
                  Manage
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">
                  Outstanding: {outstandingLiabilities.length}
                </p>
                <p className="text-lg font-bold text-white">
                  <CurrencyIcon currencyCode={currency.code} size={16} className="inline mr-1" />
                  {totalDebt.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Total debt</p>
              </div>
            </div>

            {/* Bills Summary */} // Already exists
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-blue-400" />
                  <span className="font-medium text-white">Bills</span>
                </div>
                <Button
                  onClick={() => navigate('/bills')}
                  size="sm"
                  variant="outline"
                  className="text-xs border-blue-500/30 text-blue-400"
                >
                  Manage
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">
                  Active: {(recurringTransactions || []).filter(rt => rt.isActive && rt.type === 'expense').length}
                </p>
                <p className="text-lg font-bold text-white">
                  {upcomingBills.length > 0 ? format(new Date(upcomingBills[0].nextOccurrenceDate), 'MMM dd') : 'None'}
                </p>
                <p className="text-xs text-gray-500">Next due date</p>
              </div>
            </div>
          </div>

          {/* Upcoming Bills */} // Already exists
          {upcomingBills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Upcoming Bills</h4>
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar size={14} className="text-blue-400" />
                    <div> // Already exists
                      <p className="text-sm font-medium text-white">{bill.description}</p>
                      <p className="text-xs text-gray-400">{bill.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(bill.amount)}
                    </p> // Already exists
                    <p className="text-xs text-gray-400">
                      {format(new Date(bill.nextOccurrenceDate), 'MMM dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* App Settings */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg"> // Already exists
              <Settings size={24} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">App Settings</h2>
          </div>

          <div className="space-y-3">
            <button 
              className="w-full p-4 flex items-center space-x-4 text-left bg-black/30 rounded-lg hover:bg-black/40 transition-colors" // Already exists
              onClick={() => setShowNotifications(true)}
            >
              <Bell size={18} className="text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-white">Notifications</p>
                <p className="text-sm text-gray-400">Manage alerts and reminders</p>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button 
              className="w-full p-4 flex items-center space-x-4 text-left bg-black/30 rounded-lg hover:bg-black/40 transition-colors" // Already exists
              onClick={() => setShowCategoryModal(true)}
            >
              <Tag size={18} className="text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-white">Categories</p>
                <p className="text-sm text-gray-400">Customize transaction categories</p>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button 
              className="w-full p-4 flex items-center space-x-4 text-left bg-black/30 rounded-lg hover:bg-black/40 transition-colors" // Already exists
              onClick={handleRestartOnboarding}
            >
              <RefreshCw size={18} className="text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-white">Restart Onboarding</p>
                <p className="text-sm text-gray-400">Go through setup again</p>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button 
              className="w-full p-4 flex items-center space-x-4 text-left bg-black/30 rounded-lg hover:bg-black/40 transition-colors" // Already exists
              onClick={() => navigate('/privacy')}
            >
              <Shield size={18} className="text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-white">Privacy & Security</p>
                <p className="text-sm text-gray-400">Security settings</p>
              </div>
              <span className="text-gray-400">›</span>
            </button>

            <button 
              className="w-full p-4 flex items-center space-x-4 text-left bg-black/30 rounded-lg hover:bg-black/40 transition-colors" // Already exists
              onClick={() => navigate('/about')}
            >
              <Info size={18} className="text-gray-400" />
              <div className="flex-1">
                <p className="font-medium text-white">About FinTrack</p>
                <p className="text-sm text-gray-400">App information</p>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gray-500/20 rounded-lg"> // Already exists
              <User size={24} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Account Actions</h2>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => setShowLogoutConfirm(true)} // Already exists
              variant="outline"
              className="w-full border-error-500 text-error-400 hover:bg-error-500/10"
            >
              <LogOut size={18} className="mr-2" />
              {t('logout')}
            </Button>
          </div>
        </div>

        {/* App Info */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10"> // Already exists
          <div className="flex items-center space-x-3 text-gray-400">
            <Info size={14} />
            <div className="text-xs">
              <p className="text-white">FinTrack v1.0.0</p>
              <p className="text-gray-400">Your Personal Finance Coach</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <NotificationsPanel // Already exists
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      {/* Category Management Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Manage Categories"
      >
        <CategoryManagement />
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal // Already exists
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Sign Out"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </p>
          <div className="flex space-x-3 pt-4"> // Already exists
            <Button
              variant="outline"
              onClick={() => setShowLogoutConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-error-500 hover:bg-error-600"
              loading={isLoggingOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};