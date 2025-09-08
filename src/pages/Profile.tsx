import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  CreditCard, 
  Target, 
  FileText, 
  Calendar, 
  Settings, 
  Edit3,
  Plus,
  ChevronRight,
  Eye,
  EyeOff,
  Camera,
  Building2,
  Wallet,
  PiggyBank,
  Smartphone,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContextOffline';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { FontOptimizedText } from '../components/common/FontOptimizedText';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { accounts, goals, liabilities, recurringTransactions } = useFinance();
  const { formatCurrency } = useInternationalization();
  const navigate = useNavigate();
  const [showBalances, setShowBalances] = useState(true);

  // Calculate upcoming events (bills due in next 7 days)
  const upcomingBills = recurringTransactions
    ?.filter(rt => rt.isActive && rt.type === 'expense')
    .filter(rt => {
      const dueDate = new Date(rt.nextOccurrenceDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.nextOccurrenceDate).getTime() - new Date(b.nextOccurrenceDate).getTime())
    .slice(0, 3) || [];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank_savings':
        return <PiggyBank size={20} className="text-blue-500" />;
      case 'bank_current':
        return <Building2 size={20} className="text-blue-500" />;
      case 'digital_wallet':
        return <Smartphone size={20} className="text-purple-500" />;
      case 'investment':
        return <TrendingUp size={20} className="text-green-500" />;
      case 'credit_card':
        return <CreditCard size={20} className="text-red-500" />;
      case 'cash':
        return <Wallet size={20} className="text-yellow-500" />;
      default:
        return <CreditCard size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User size={32} className="text-white" />
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                <Camera size={12} className="text-gray-600" />
              </button>
            </div>
            
            {/* User Info */}
            <div className="flex-1">
              <FontOptimizedText fontFamily="heading" className="text-xl">
                {user?.name || 'User'}
              </FontOptimizedText>
              <FontOptimizedText fontFamily="description" className="text-sm text-gray-600">
                {user?.email || 'user@example.com'}
              </FontOptimizedText>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Settings size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Balance Toggle */}
        <div className="flex items-center justify-between mb-6">
          <FontOptimizedText fontFamily="heading" className="text-lg">
            Financial Overview
          </FontOptimizedText>
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {showBalances ? <Eye size={16} /> : <EyeOff size={16} />}
            <FontOptimizedText fontFamily="titles" className="text-sm">
              {showBalances ? 'Hide' : 'Show'} Balances
            </FontOptimizedText>
          </button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-6 space-y-6">
        {/* Accounts Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <FontOptimizedText fontFamily="heading" className="text-lg">
              Your Accounts
            </FontOptimizedText>
            <button 
              onClick={() => navigate('/accounts')}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <Plus size={16} />
              <FontOptimizedText fontFamily="titles" className="text-sm">
                Add
              </FontOptimizedText>
            </button>
          </div>
          
          {accounts && accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.slice(0, 3).map((account) => (
                <div 
                  key={account.id}
                  onClick={() => navigate(`/account/${account.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    {getAccountIcon(account.type)}
                    <div>
                      <FontOptimizedText fontFamily="titles" className="text-sm">
                        {account.name}
                      </FontOptimizedText>
                      <FontOptimizedText fontFamily="description" className="text-xs text-gray-500">
                        {account.type.replace('_', ' ').toUpperCase()}
                      </FontOptimizedText>
                    </div>
                  </div>
                  <div className="text-right">
                    <FontOptimizedText fontFamily="numbers" className="text-sm">
                      {showBalances ? formatCurrency(account.balance || 0) : '••••••'}
                    </FontOptimizedText>
                    <FontOptimizedText fontFamily="description" className="text-xs text-gray-500">
                      {account.currency}
                    </FontOptimizedText>
                  </div>
                </div>
              ))}
              {accounts.length > 3 && (
                <button 
                  onClick={() => navigate('/accounts')}
                  className="w-full py-2 text-center text-blue-600 hover:text-blue-700"
                >
                  <FontOptimizedText fontFamily="titles" className="text-sm">
                    View All {accounts.length} Accounts
                  </FontOptimizedText>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard size={48} className="text-gray-300 mx-auto mb-3" />
              <FontOptimizedText fontFamily="description" className="text-gray-500 mb-4">
                No accounts yet
              </FontOptimizedText>
              <button 
                onClick={() => navigate('/accounts')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FontOptimizedText fontFamily="titles" className="text-sm">
                  Add Your First Account
                </FontOptimizedText>
              </button>
            </div>
          )}
        </div>

        {/* Goals Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <FontOptimizedText fontFamily="heading" className="text-lg">
              Your Goals
            </FontOptimizedText>
            <button 
              onClick={() => navigate('/goals')}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <Plus size={16} />
              <FontOptimizedText fontFamily="titles" className="text-sm">
                Add
              </FontOptimizedText>
            </button>
          </div>
          
          {goals && goals.length > 0 ? (
            <div className="space-y-3">
              {goals.slice(0, 3).map((goal) => (
                <div 
                  key={goal.id}
                  onClick={() => navigate(`/goal/${goal.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Target size={20} className="text-green-500" />
                    <div className="flex-1">
                      <FontOptimizedText fontFamily="titles" className="text-sm">
                        {goal.name}
                      </FontOptimizedText>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <FontOptimizedText fontFamily="numbers" className="text-sm">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </FontOptimizedText>
                    <FontOptimizedText fontFamily="description" className="text-xs text-gray-500">
                      {Math.round((goal.currentAmount / goal.targetAmount) * 100)}%
                    </FontOptimizedText>
                  </div>
                </div>
              ))}
              {goals.length > 3 && (
                <button 
                  onClick={() => navigate('/goals')}
                  className="w-full py-2 text-center text-blue-600 hover:text-blue-700"
                >
                  <FontOptimizedText fontFamily="titles" className="text-sm">
                    View All {goals.length} Goals
                  </FontOptimizedText>
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target size={48} className="text-gray-300 mx-auto mb-3" />
              <FontOptimizedText fontFamily="description" className="text-gray-500 mb-4">
                No goals set yet
              </FontOptimizedText>
              <button 
                onClick={() => navigate('/goals')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FontOptimizedText fontFamily="titles" className="text-sm">
                  Set Your First Goal
                </FontOptimizedText>
              </button>
            </div>
          )}
        </div>

        {/* Liabilities Section */}
        {liabilities && liabilities.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <FontOptimizedText fontFamily="heading" className="text-lg">
                Your Liabilities
              </FontOptimizedText>
              <button 
                onClick={() => navigate('/liabilities')}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <Plus size={16} />
                <FontOptimizedText fontFamily="titles" className="text-sm">
                  Add
                </FontOptimizedText>
              </button>
            </div>
            
            <div className="space-y-3">
              {liabilities.slice(0, 3).map((liability) => (
                <div 
                  key={liability.id}
                  onClick={() => navigate(`/liability/${liability.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <FileText size={20} className="text-red-500" />
                    <div>
                      <FontOptimizedText fontFamily="titles" className="text-sm">
                        {liability.name}
                      </FontOptimizedText>
                      <FontOptimizedText fontFamily="description" className="text-xs text-gray-500">
                        {liability.type}
                      </FontOptimizedText>
                    </div>
                  </div>
                  <div className="text-right">
                    <FontOptimizedText fontFamily="numbers" className="text-sm text-red-600">
                      {formatCurrency(liability.remainingAmount)}
                    </FontOptimizedText>
                    <FontOptimizedText fontFamily="description" className="text-xs text-gray-500">
                      Remaining
                    </FontOptimizedText>
                  </div>
                </div>
              ))}
              {liabilities.length > 3 && (
                <button 
                  onClick={() => navigate('/liabilities')}
                  className="w-full py-2 text-center text-blue-600 hover:text-blue-700"
                >
                  <FontOptimizedText fontFamily="titles" className="text-sm">
                    View All {liabilities.length} Liabilities
                  </FontOptimizedText>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Events Section */}
        {upcomingBills.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <FontOptimizedText fontFamily="heading" className="text-lg">
                Upcoming Events
              </FontOptimizedText>
              <button 
                onClick={() => navigate('/bills')}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
              >
                <Calendar size={16} />
                <FontOptimizedText fontFamily="titles" className="text-sm">
                  View All
                </FontOptimizedText>
              </button>
            </div>
            
            <div className="space-y-3">
              {upcomingBills.map((bill, index) => (
                <div 
                  key={index}
                  onClick={() => navigate('/bills')}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Calendar size={20} className="text-orange-500" />
                    <div>
                      <FontOptimizedText fontFamily="titles" className="text-sm">
                        {bill.description}
                      </FontOptimizedText>
                      <FontOptimizedText fontFamily="description" className="text-xs text-gray-500">
                        Due {new Date(bill.nextOccurrenceDate).toLocaleDateString()}
                      </FontOptimizedText>
                    </div>
                  </div>
                  <div className="text-right">
                    <FontOptimizedText fontFamily="numbers" className="text-sm">
                      {formatCurrency(bill.amount)}
                    </FontOptimizedText>
                    <FontOptimizedText fontFamily="description" className="text-xs text-gray-500">
                      {bill.frequency}
                    </FontOptimizedText>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <FontOptimizedText fontFamily="heading" className="text-lg">
              Categories
            </FontOptimizedText>
            <button 
              onClick={() => navigate('/settings')}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
            >
              <Edit3 size={16} />
              <FontOptimizedText fontFamily="titles" className="text-sm">
                Manage
              </FontOptimizedText>
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-center">
              <FontOptimizedText fontFamily="titles" className="text-sm text-blue-600">
                Income
              </FontOptimizedText>
            </div>
            <div className="p-3 rounded-xl bg-red-50 text-center">
              <FontOptimizedText fontFamily="titles" className="text-sm text-red-600">
                Expense
              </FontOptimizedText>
            </div>
            <div className="p-3 rounded-xl bg-green-50 text-center">
              <FontOptimizedText fontFamily="titles" className="text-sm text-green-600">
                Transfer
              </FontOptimizedText>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-center">
              <FontOptimizedText fontFamily="titles" className="text-sm text-purple-600">
                Investment
              </FontOptimizedText>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
