import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Calendar, DollarSign, CreditCard, AlertCircle, Users, GraduationCap, Home, Car, ShoppingCart, Wallet, Scale, Zap, FileText, Globe, Building, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { QuickLiabilityForm } from '../components/forms/QuickLiabilityForm';
import { DetailedLiabilityForm } from '../components/forms/DetailedLiabilityForm';
import { LiabilityModificationForm } from '../components/forms/LiabilityModificationForm';
import { LiabilityMockTransactionForm } from '../components/forms/LiabilityMockTransactionForm';
import { getLiabilityBehavior, LiabilityType } from '../lib/liability-behaviors';

interface EnhancedLiability {
  id: string;
  name: string;
  liabilityType: LiabilityType;
  description?: string;
  liabilityStatus: 'new' | 'existing' | 'paid_off' | 'defaulted' | 'restructured' | 'closed' | 'archived';
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  monthlyPayment: number;
  minimumPayment: number;
  paymentDay: number;
  loanTermMonths?: number;
  remainingTermMonths?: number;
  startDate: Date;
  dueDate?: Date;
  nextPaymentDate?: Date;
  currencyCode: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  autoGenerateBills: boolean;
  sendReminders: boolean;
  reminderDays: number;
  paymentStrategy: 'equal' | 'proportional' | 'priority' | 'manual';
  accountIds: string[];
  typeSpecificData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const typeIcons: Record<string, React.ReactNode> = {
  'education_loan': <GraduationCap size={20} />,
  'student_credit_card': <CreditCard size={20} />,
  'family_debt': <Users size={20} />,
  'bnpl': <ShoppingCart size={20} />,
  'personal_loan': <Wallet size={20} />,
  'credit_card': <CreditCard size={20} />,
  'auto_loan': <Car size={20} />,
  'home_loan': <Home size={20} />,
  'gold_loan': <Scale size={20} />,
  'utility_debt': <Zap size={20} />,
  'tax_debt': <FileText size={20} />,
  'international_debt': <Globe size={20} />
};

export const EnhancedLiabilities: React.FC = () => {
  const navigate = useNavigate();
  const { 
    liabilities, 
    addLiability, 
    updateLiability, 
    deleteLiability,
    modifyLiability,
    extendLiabilityTerm,
    shortenLiabilityTerm,
    changeLiabilityAmount,
    changeLiabilityDates,
    payLiabilityFromMultipleAccounts,
    addTransaction,
    accounts
  } = useFinance();
  const { formatCurrency } = useInternationalization();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LiabilityType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paid_off' | 'overdue'>('all');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [showModificationForm, setShowModificationForm] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<EnhancedLiability | null>(null);
  const [showMockTransactionForm, setShowMockTransactionForm] = useState(false);
  const [selectedLiabilityForMock, setSelectedLiabilityForMock] = useState<EnhancedLiability | null>(null);
  const [quickAddData, setQuickAddData] = useState<{ name: string; type: LiabilityType; status: 'new' | 'existing' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter liabilities based on search and filters
  const filteredLiabilities = (liabilities || []).filter(liability => {
    const matchesSearch = liability.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         liability.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || liability.liabilityType === filterType;
    
    const matchesStatus = (() => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'active') return liability.liabilityStatus === 'new' || liability.liabilityStatus === 'existing';
      if (filterStatus === 'paid_off') return liability.liabilityStatus === 'paid_off';
      if (filterStatus === 'overdue') {
        if (!liability.nextPaymentDate) return false;
        return new Date(liability.nextPaymentDate) < new Date() && liability.remainingAmount > 0;
      }
      return true;
    })();

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleQuickAddSubmit = (data: { name: string; type: LiabilityType; status: 'new' | 'existing' }) => {
    setQuickAddData(data);
    setShowQuickAdd(false);
    setShowDetailedForm(true);
  };

  const handleDetailedFormSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      const liabilityData = {
        ...data,
        liabilityType: quickAddData?.type || data.liabilityType,
        liabilityStatus: quickAddData?.status || data.liabilityStatus,
        totalAmount: data.totalAmount,
        remainingAmount: data.liabilityStatus === 'new' ? data.totalAmount : data.remainingAmount,
        currencyCode: data.currencyCode || 'USD',
        accountIds: data.accountIds || [],
        typeSpecificData: data.typeSpecificData || {}
      };

      await addLiability(liabilityData);
      
      setShowDetailedForm(false);
      setQuickAddData(null);
    } catch (error: any) {
      console.error('Error creating liability:', error);
      setError(error.message || 'Failed to create liability');
    } finally {
      setLoading(false);
    }
  };

  const handleModifyLiability = async (modificationData: any) => {
    if (!selectedLiability) return;

    try {
      setLoading(true);
      setError(null);

      await modifyLiability(selectedLiability.id, modificationData);
      
      setShowModificationForm(false);
      setSelectedLiability(null);
    } catch (error: any) {
      console.error('Error modifying liability:', error);
      setError(error.message || 'Failed to modify liability');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLiability = async (id: string) => {
    if (!confirm('Are you sure you want to delete this liability?')) return;

    try {
      setLoading(true);
      setError(null);
      await deleteLiability(id);
    } catch (error: any) {
      console.error('Error deleting liability:', error);
      setError(error.message || 'Failed to delete liability');
    } finally {
      setLoading(false);
    }
  };

  const handleMockTransaction = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create a mock transaction for the liability
      await addTransaction({
        type: data.type === 'payment' ? 'expense' : 'expense',
        amount: data.amount,
        category: 'Debt Payment',
        description: data.description,
        date: new Date(data.date).toISOString(),
        accountId: selectedLiabilityForMock?.accountIds?.[0] || accounts?.[0]?.id,
        affectsBalance: true,
        status: 'completed',
        notes: data.notes || `Mock transaction for ${selectedLiabilityForMock?.name}`,
        isRecurring: data.isRecurring,
        recurringFrequency: data.recurringFrequency,
        recurringEndDate: data.recurringEndDate
      });
      
      setShowMockTransactionForm(false);
      setSelectedLiabilityForMock(null);
    } catch (error: any) {
      console.error('Error adding mock transaction:', error);
      setError(error.message || 'Failed to add mock transaction');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-green-500/20 text-green-400';
      case 'existing': return 'bg-blue-500/20 text-blue-400';
      case 'paid_off': return 'bg-gray-500/20 text-gray-400';
      case 'defaulted': return 'bg-red-500/20 text-red-400';
      case 'restructured': return 'bg-yellow-500/20 text-yellow-400';
      case 'closed': return 'bg-gray-500/20 text-gray-400';
      case 'archived': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const isOverdue = (liability: EnhancedLiability) => {
    if (!liability.nextPaymentDate || liability.remainingAmount <= 0) return false;
    return new Date(liability.nextPaymentDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/liabilities')}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Enhanced Liabilities</h1>
              <p className="text-gray-300">Manage all your debts with type-specific behaviors</p>
            </div>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Button
              onClick={() => setShowQuickAdd(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus size={20} className="mr-2" />
              Quick Add
            </Button>
            <Button
              onClick={() => setShowDetailedForm(true)}
              variant="outline"
            >
              <Plus size={20} className="mr-2" />
              Detailed Add
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle size={18} className="text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-black/20 rounded-xl p-6 border border-white/10 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search liabilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} className="text-blue-400" />}
              className="bg-black/20 border-white/20 text-white"
            />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as LiabilityType | 'all')}
              className="px-4 py-3 rounded-xl border border-white/20 bg-black/20 text-white focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="education_loan">Education Loan</option>
              <option value="student_credit_card">Student Credit Card</option>
              <option value="family_debt">Family Debt</option>
              <option value="bnpl">Buy Now Pay Later</option>
              <option value="personal_loan">Personal Loan</option>
              <option value="credit_card">Credit Card</option>
              <option value="auto_loan">Auto Loan</option>
              <option value="home_loan">Home Loan</option>
              <option value="gold_loan">Gold Loan</option>
              <option value="utility_debt">Utility Debt</option>
              <option value="tax_debt">Tax Debt</option>
              <option value="international_debt">International Debt</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 rounded-xl border border-white/20 bg-black/20 text-white focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paid_off">Paid Off</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Liabilities List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLiabilities.map((liability) => {
            const behavior = getLiabilityBehavior(liability.liabilityType);
            const overdue = isOverdue(liability);
            
            return (
              <div
                key={liability.id}
                className={`bg-black/20 rounded-xl p-6 border transition-all hover:border-white/30 ${
                  overdue ? 'border-red-500/50 bg-red-500/10' : 'border-white/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{behavior.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{liability.name}</h3>
                      <p className="text-sm text-gray-400">{behavior.displayName}</p>
                    </div>
                  </div>
                  {overdue && (
                    <div className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-medium">
                      Overdue
                    </div>
                  )}
                </div>

                {/* Status and Priority */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(liability.liabilityStatus)}`}>
                    {liability.liabilityStatus.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(liability.priority)}`}>
                    {liability.priority.toUpperCase()} PRIORITY
                  </span>
                </div>

                {/* Financial Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Total Amount</span>
                    <span className="font-semibold text-white">
                      {formatCurrency(liability.totalAmount, liability.currencyCode)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Remaining</span>
                    <span className="font-semibold text-orange-400">
                      {formatCurrency(liability.remainingAmount, liability.currencyCode)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Monthly Payment</span>
                    <span className="font-semibold text-blue-400">
                      {formatCurrency(liability.monthlyPayment, liability.currencyCode)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Interest Rate</span>
                    <span className="font-semibold text-yellow-400">
                      {liability.interestRate}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(((liability.totalAmount - liability.remainingAmount) / liability.totalAmount) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${((liability.totalAmount - liability.remainingAmount) / liability.totalAmount) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Next Payment */}
                {liability.nextPaymentDate && (
                  <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
                    <Calendar size={16} />
                    <span>
                      Next payment: {new Date(liability.nextPaymentDate).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedLiabilityForMock(liability);
                      setShowMockTransactionForm(true);
                    }}
                    className="text-green-400 hover:text-green-300 hover:border-green-400"
                    title="Add Mock Transaction"
                  >
                    <DollarSign size={16} className="mr-1" />
                    Mock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedLiability(liability);
                      setShowModificationForm(true);
                    }}
                    className="flex-1"
                  >
                    <Edit size={16} className="mr-1" />
                    Modify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteLiability(liability.id)}
                    className="text-red-400 hover:text-red-300 hover:border-red-400"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredLiabilities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">No liabilities found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first liability'
              }
            </p>
            <Button
              onClick={() => setShowQuickAdd(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus size={20} className="mr-2" />
              Add Liability
            </Button>
          </div>
        )}

        {/* Modals */}
        {showQuickAdd && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <QuickLiabilityForm
                onSubmit={handleQuickAddSubmit}
                onCancel={() => setShowQuickAdd(false)}
              />
            </div>
          </div>
        )}

        {showDetailedForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <DetailedLiabilityForm
                initialData={quickAddData ? {
                  name: quickAddData.name,
                  liabilityType: quickAddData.type,
                  liabilityStatus: quickAddData.status
                } : undefined}
                onSubmit={handleDetailedFormSubmit}
                onCancel={() => {
                  setShowDetailedForm(false);
                  setQuickAddData(null);
                }}
              />
            </div>
          </div>
        )}

        {showModificationForm && selectedLiability && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <LiabilityModificationForm
                liability={selectedLiability}
                onSubmit={handleModifyLiability}
                onCancel={() => {
                  setShowModificationForm(false);
                  setSelectedLiability(null);
                }}
              />
            </div>
          </div>
        )}

        {/* Mock Transaction Modal */}
        {showMockTransactionForm && selectedLiabilityForMock && (
          <LiabilityMockTransactionForm
            liability={selectedLiabilityForMock}
            isOpen={showMockTransactionForm}
            onClose={() => {
              setShowMockTransactionForm(false);
              setSelectedLiabilityForMock(null);
            }}
            onSubmit={handleMockTransaction}
          />
        )}
      </div>
    </div>
  );
};
