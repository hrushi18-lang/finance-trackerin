import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus, Edit3, Trash2, BarChart3, Calculator, AlertTriangle, CheckCircle, Building, Car, Home, GraduationCap, Wallet, DollarSign, ArrowLeft, Search } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { LuxuryLiabilityForm } from '../components/forms/LuxuryLiabilityForm';
import { LiabilityModificationForm } from '../components/forms/LiabilityModificationForm';
import { PaymentForm } from '../components/forms/PaymentForm';
import { Input } from '../components/common/Input';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { LiabilityType } from '../lib/liability-behaviors';

const Liabilities: React.FC = () => {
  const navigate = useNavigate();
  const { liabilities, updateLiability, deleteLiability, accounts, repayLiabilityFromAccount } = useFinance();
  const { formatCurrency, formatCurrencyWithSecondary, currency, supportedCurrencies } = useInternationalization();
  
  // Format liability amount with currency conversion info
  const formatLiabilityAmount = (liability: any) => {
    const liabilityCurrency = liability.currencyCode || currency.code;
    const needsConversion = liabilityCurrency !== currency.code;
    
    if (needsConversion) {
      // Simple conversion rate (in real app, this would come from an API)
      const conversionRates: { [key: string]: { [key: string]: number } } = {
        'USD': { 'INR': 83.0, 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0, 'CAD': 1.25, 'AUD': 1.35 },
        'EUR': { 'USD': 1.18, 'INR': 97.5, 'GBP': 0.86, 'JPY': 129.0, 'CAD': 1.47, 'AUD': 1.59 },
        'GBP': { 'USD': 1.37, 'INR': 113.5, 'EUR': 1.16, 'JPY': 150.0, 'CAD': 1.71, 'AUD': 1.85 },
        'INR': { 'USD': 0.012, 'EUR': 0.010, 'GBP': 0.009, 'JPY': 1.32, 'CAD': 0.015, 'AUD': 0.016 },
        'JPY': { 'USD': 0.009, 'INR': 0.76, 'EUR': 0.008, 'GBP': 0.007, 'CAD': 0.011, 'AUD': 0.012 },
        'CAD': { 'USD': 0.80, 'INR': 66.4, 'EUR': 0.68, 'GBP': 0.58, 'JPY': 87.5, 'AUD': 1.08 },
        'AUD': { 'USD': 0.74, 'INR': 61.5, 'EUR': 0.63, 'GBP': 0.54, 'JPY': 81.0, 'CAD': 0.93 }
      };
      
      const rate = conversionRates[liabilityCurrency]?.[currency.code] || 1;
      const convertedAmount = liability.remainingAmount * rate;
      
      const liabilityCurrencyInfo = supportedCurrencies.find(c => c.code === liabilityCurrency);
      const liabilitySymbol = liabilityCurrencyInfo?.symbol || liabilityCurrency;
      
      return (
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">
            {liabilitySymbol}{liability.remainingAmount.toFixed(2)} {liabilityCurrency}
          </div>
          <div className="text-sm text-gray-500">
            ≈ {formatCurrency(convertedAmount)}
          </div>
        </div>
      );
    }
    
    return <span className="font-numbers">{formatCurrency(liability.remainingAmount)}</span>;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLuxuryForm, setShowLuxuryForm] = useState(false);
  const [showModificationForm, setShowModificationForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLiability, setEditingLiability] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [liabilityToDelete, setLiabilityToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'payments'>('overview');
  
  // Enhanced features state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LiabilityType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paid_off' | 'overdue'>('all');

  // Enhanced handler functions
  const handleLuxuryFormComplete = () => {
    setShowLuxuryForm(false);
    // Liability is already created by the form
  };

  const handleModifyLiability = async (modificationData: any) => {
    if (!selectedLiability) return;

    try {
      setIsSubmitting(true);
      setError(null);

      // For now, we'll use updateLiability - in a full implementation, you'd use modifyLiability
      await updateLiability(selectedLiability, modificationData);
      
      setShowModificationForm(false);
      setSelectedLiability(null);
    } catch (error: any) {
      console.error('Error modifying liability:', error);
      setError(error.message || 'Failed to modify liability');
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleMakePayment = async (paymentData: { amount: number; description: string; createTransaction: boolean; accountId: string }) => {
    const liability = liabilities.find(l => l.id === selectedLiability);
    if (!liability) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const paymentAmount = Number(paymentData.amount) || 0;
      const currentRemaining = Number(liability.remainingAmount) || 0;
      
      // Handle overpayment
      const actualPayment = Math.min(paymentAmount, currentRemaining);
      
      // Create payment transaction if requested
      if (paymentData.createTransaction && paymentData.accountId) {
        await repayLiabilityFromAccount(paymentData.accountId, liability.id, actualPayment, paymentData.description);
      }
      
      // Update liability remaining amount
      await updateLiability(liability.id, {
        remainingAmount: Math.max(0, currentRemaining - actualPayment),
        status: Math.max(0, currentRemaining - actualPayment) === 0 ? 'paid_off' : liability.status
      });
      
      setShowPaymentModal(false);
      setSelectedLiability(null);
    } catch (error: any) {
      console.error('Error making payment:', error);
      setError(error.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLiability = (liabilityId: string) => {
    setLiabilityToDelete(liabilityId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLiability = async () => {
    if (!liabilityToDelete) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      await deleteLiability(liabilityToDelete);
      setShowDeleteConfirm(false);
      setLiabilityToDelete(null);
    } catch (error: any) {
      console.error('Error deleting liability:', error);
      setError(error.message || 'Failed to delete liability');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate liability statistics
  const liabilityStats = {
    totalLiabilities: liabilities.length,
    activeLiabilities: liabilities.filter(l => l.status === 'active').length,
    totalDebt: liabilities.reduce((sum, l) => sum + (l.remainingAmount || 0), 0),
    totalMonthlyPayments: liabilities.reduce((sum, l) => sum + (l.monthlyPayment || 0), 0),
    averageInterestRate: liabilities.length > 0 
      ? liabilities.reduce((sum, l) => sum + (l.interestRate || 0), 0) / liabilities.length 
      : 0
  };

  // Get liability icon
  const getLiabilityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'credit_card': return <CreditCard size={20} className="text-red-600" />;
      case 'personal_loan': return <Wallet size={20} className="text-blue-600" />;
      case 'mortgage': return <Home size={20} className="text-green-600" />;
      case 'auto_loan': return <Car size={20} className="text-purple-600" />;
      case 'student_loan': return <GraduationCap size={20} className="text-orange-600" />;
      case 'business_loan': return <Building size={20} className="text-indigo-600" />;
      default: return <CreditCard size={20} className="text-gray-600" />;
    }
  };

  // Get liability status
  const getLiabilityStatus = (liability: any) => {
    if (liability.status === 'paid_off') return { status: 'Paid Off', color: 'text-green-600 bg-green-100' };
    if (liability.remainingAmount <= 0) return { status: 'Paid Off', color: 'text-green-600 bg-green-100' };
    return { status: 'Active', color: 'text-blue-600 bg-blue-100' };
  };


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


  // Convert EnhancedLiability to Liability for PaymentForm
  const convertToLiability = (enhancedLiability: any) => {
    return {
      id: enhancedLiability.id,
      name: enhancedLiability.name,
      type: enhancedLiability.liabilityType,
      totalAmount: enhancedLiability.totalAmount,
      remainingAmount: enhancedLiability.remainingAmount,
      interestRate: enhancedLiability.interestRate,
      monthlyPayment: enhancedLiability.monthlyPayment,
      due_date: enhancedLiability.dueDate || enhancedLiability.nextPaymentDate
    };
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      {/* Immersive Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/cards')}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-heading">Liabilities</h1>
          </div>
          <button
            onClick={() => setShowLuxuryForm(true)}
            className="btn-primary flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus size={20} />
            <span className="font-semibold">Add Liability</span>
          </button>
        </div>
      </div>
      
      {/* Enhanced Filters */}
      <div className="px-4 mb-4">
        <div className="card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search liabilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search size={18} className="text-blue-400" />}
              className="bg-white border-gray-200 text-gray-900"
            />
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as LiabilityType | 'all')}
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"
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
              className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paid_off">Paid Off</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="px-4 space-y-4">
        {/* Liability Summary */}
        <div className="card p-4 slide-in-up">
          <div className="mb-4">
            <h2 className="text-lg font-heading">Debt Overview</h2>
          </div>
          
          {liabilities.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-numbers">{liabilityStats.activeLiabilities}</p>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Active Debts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-numbers" style={{ color: 'var(--error)' }}>
                  {formatCurrency(liabilityStats.totalDebt)}
                </p>
                <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Total Debt</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--background-secondary)' }}>
                <CreditCard size={20} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-heading mb-2">No Liabilities Yet</h3>
              <p className="text-sm font-body mb-4">
                Add your first liability to start tracking your debt
              </p>
              <button
                onClick={() => setShowLuxuryForm(true)}
                className="btn-primary bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus size={20} className="mr-2" />
                Add Your First Liability
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        {liabilities.length > 0 && (
          <div className="flex space-x-1 p-1 rounded-xl" style={{ backgroundColor: 'var(--background-secondary)' }}>
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'analytics', label: 'Analytics', icon: Calculator },
              { key: 'payments', label: 'Payments', icon: DollarSign }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-1 ${
                  activeTab === tab.key
                    ? 'text-white transform scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:scale-105'
                }`}
                style={{
                  backgroundColor: activeTab === tab.key ? 'var(--primary)' : 'transparent'
                }}
              >
                <tab.icon size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Liabilities List */}
        {filteredLiabilities.length > 0 && (
          <div className="slide-in-up">
            <h3 className="text-lg font-heading mb-4">Your Liabilities</h3>
            <div className="space-y-3">
              {filteredLiabilities.map((liability) => {
                const status = getLiabilityStatus(liability);
                const progress = ((liability.totalAmount - liability.remainingAmount) / liability.totalAmount) * 100;
                
                return (
                  <div key={liability.id} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
                          {getLiabilityIcon(liability.liabilityType)}
                        </div>
                        <div>
                          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{liability.name}</h4>
                          <p className="text-sm font-body capitalize">
                            {liability.liabilityType.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedLiability(liability.id);
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                          style={{ backgroundColor: 'var(--success)', color: 'white' }}
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => {
                            setEditingLiability(liability);
                            setShowEditModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteLiability(liability.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-gray-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Remaining</p>
                        <div className="text-lg font-numbers">
                          {formatLiabilityAmount(liability)}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>Interest Rate</p>
                        <p className="text-lg font-numbers">
                          {(liability.interestRate || 0).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
                        <span>Paid: {formatCurrencyWithSecondary(liability.totalAmount - (liability.remainingAmount || 0))}</span>
                        <span>Total: {formatCurrencyWithSecondary(liability.totalAmount)}</span>
                      </div>
                      <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border-light)' }}>
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: 'var(--primary)'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.status}
                      </span>
                      <span className="text-sm font-body" style={{ color: 'var(--text-tertiary)' }}>
                        {progress.toFixed(0)}% paid
                      </span>
                    </div>

                    {/* Liability Completion Actions */}
                    {progress >= 100 && (
                      <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Liability Paid Off! 🎉</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Archive liability
                              updateLiability(liability.id, { ...liability, status: 'archived' });
                            }}
                            className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            Archive
                          </button>
                          <button
                            onClick={() => {
                              // Delete liability
                              handleDeleteLiability(liability.id);
                            }}
                            className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => {
                              // Restart liability (reset to original amount)
                              updateLiability(liability.id, { 
                                ...liability, 
                                remainingAmount: liability.totalAmount,
                                status: 'active'
                              });
                            }}
                            className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                          >
                            Restart
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="card p-4" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} />
              <p className="text-sm font-body">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Luxury Liability Form */}
      {showLuxuryForm && (
        <LuxuryLiabilityForm
          onComplete={handleLuxuryFormComplete}
          onCancel={() => setShowLuxuryForm(false)}
        />
      )}

      {/* Modification Modal */}
      <Modal
        isOpen={showModificationForm}
        onClose={() => setShowModificationForm(false)}
        title="Modify Liability"
      >
        {selectedLiability && (
          <LiabilityModificationForm
            liability={liabilities.find(l => l.id === selectedLiability)}
            onSubmit={handleModifyLiability}
            onCancel={() => {
              setShowModificationForm(false);
              setSelectedLiability(null);
            }}
          />
        )}
      </Modal>

      {/* Edit Liability Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Liability"
      >
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✏️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Edit Liability</h3>
            <p className="text-gray-500 mb-6">
              Use the modification form to make changes to your liability
            </p>
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedLiability(editingLiability?.id);
                setShowModificationForm(true);
              }}
              className="btn-primary bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Modify Liability
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Make Payment"
      >
        {selectedLiability && (
          <PaymentForm
            liability={selectedLiability ? convertToLiability(liabilities.find(l => l.id === selectedLiability)) : undefined}
            accounts={accounts}
            onSubmit={handleMakePayment}
            onCancel={() => setShowPaymentModal(false)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Liability"
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Liability</h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone. Are you sure you want to delete this liability?
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteLiability}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Liabilities;
