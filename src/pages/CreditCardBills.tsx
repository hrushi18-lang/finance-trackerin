import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Settings,
  Download,
  Filter,
  Search,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { useCreditCardBills } from '../contexts/CreditCardBillContext';
import { useFinance } from '../contexts/FinanceContext';
import { useInternationalization } from '../contexts/InternationalizationContext';
import { CreditCardBillForm } from '../components/credit-cards/CreditCardBillForm';
import { CreditCardPaymentForm } from '../components/credit-cards/CreditCardPaymentForm';
import { 
  CreditCardBillCycle, 
  CreditCardBillFormData, 
  CreditCardPaymentFormData, 
  MidCycleImportData 
} from '../types/credit_card_bills';

const CreditCardBills: React.FC = () => {
  const { 
    creditCardBills, 
    creditCardPayments, 
    creditCardSettings,
    isLoading, 
    error,
    createCreditCardBill,
    makeCreditCardPayment,
    updateCreditCardSettings,
    importMidCycleBalance,
    generateCreditCardBills,
    getUpcomingBills,
    getOverdueBills,
    formatCreditCardBillAmount,
    getBillStatusColor,
    getPaymentStatusColor
  } = useCreditCardBills();
  
  const { accounts } = useFinance();
  const { formatCurrency, formatCurrencyWithSecondary } = useInternationalization();
  
  // State
  const [showBillForm, setShowBillForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState<CreditCardBillCycle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter bills based on search and status
  const filteredBills = creditCardBills.filter(bill => {
    const matchesSearch = bill.creditCardAccountId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.cycleStatus.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.cycleStatus === statusFilter;
    const matchesArchived = showArchived ? true : bill.cycleStatus !== 'closed';
    
    return matchesSearch && matchesStatus && matchesArchived;
  });

  // Get upcoming and overdue bills
  const upcomingBills = getUpcomingBills();
  const overdueBills = getOverdueBills();

  // Handle create bill
  const handleCreateBill = async (data: CreditCardBillFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await createCreditCardBill(data);
      setShowBillForm(false);
    } catch (err: any) {
      console.error('Error creating bill:', err);
      setErrorMessage(err.message || 'Failed to create credit card bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle import mid-cycle balance
  const handleImportBalance = async (data: MidCycleImportData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await importMidCycleBalance(data);
      setShowImportForm(false);
    } catch (err: any) {
      console.error('Error importing balance:', err);
      setErrorMessage(err.message || 'Failed to import mid-cycle balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle make payment
  const handleMakePayment = async (data: CreditCardPaymentFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await makeCreditCardPayment(data);
      setShowPaymentForm(false);
      setSelectedBill(null);
    } catch (err: any) {
      console.error('Error making payment:', err);
      setErrorMessage(err.message || 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle auto-generate bills
  const handleAutoGenerate = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await generateCreditCardBills();
    } catch (err: any) {
      console.error('Error generating bills:', err);
      setErrorMessage(err.message || 'Failed to generate bills');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get account name
  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.name || 'Unknown Account';
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const colorClasses = getBillStatusColor(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    const colorClasses = getPaymentStatusColor(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CreditCard className="h-8 w-8 mr-3" />
                Credit Card Bills
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your credit card bills, payments, and statements
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowImportForm(true)}
                variant="secondary"
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Import Balance
              </Button>
              <Button
                onClick={handleAutoGenerate}
                disabled={isSubmitting}
                variant="secondary"
                className="flex items-center"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Bills
              </Button>
              <Button
                onClick={() => setShowBillForm(true)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Bill
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bills</p>
                <p className="text-2xl font-semibold text-gray-900">{creditCardBills.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-semibold text-red-600">{overdueBills.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="text-2xl font-semibold text-yellow-600">{upcomingBills.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Paid This Month</p>
                <p className="text-2xl font-semibold text-green-600">
                  {creditCardPayments.filter(p => 
                    new Date(p.paymentDate).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="billed">Billed</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid_minimum">Paid Minimum</option>
                <option value="paid_full">Paid Full</option>
                <option value="overdue">Overdue</option>
                <option value="closed">Closed</option>
              </select>
              
              <Button
                onClick={() => setShowArchived(!showArchived)}
                variant="secondary"
                className="flex items-center"
              >
                {showArchived ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </Button>
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredBills.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No credit card bills</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first credit card bill or importing an existing balance.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => setShowBillForm(true)}
                  className="mr-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bill
                </Button>
                <Button
                  onClick={() => setShowImportForm(true)}
                  variant="secondary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import Balance
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cycle Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getAccountName(bill.creditCardAccountId)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {bill.currencyCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bill.cycleStartDate.toLocaleDateString()} - {bill.cycleEndDate.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Statement: {bill.statementDate.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(bill.remainingBalance, bill.currencyCode)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Min: {formatCurrency(bill.minimumDue, bill.currencyCode)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {bill.dueDate.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.ceil((bill.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(bill.cycleStatus)}
                          {getPaymentStatusBadge(bill.paymentStatus)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {bill.remainingBalance > 0 && (
                            <Button
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowPaymentForm(true);
                              }}
                              size="sm"
                              className="flex items-center"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              setSelectedBill(bill);
                              // Show bill details
                            }}
                            size="sm"
                            variant="secondary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals */}
        <CreditCardBillForm
          isOpen={showBillForm}
          onClose={() => setShowBillForm(false)}
          onSubmit={handleCreateBill}
        />

        <CreditCardBillForm
          isOpen={showImportForm}
          onClose={() => setShowImportForm(false)}
          onSubmit={handleImportBalance}
          isMidCycleImport={true}
        />

        {selectedBill && (
          <CreditCardPaymentForm
            isOpen={showPaymentForm}
            onClose={() => {
              setShowPaymentForm(false);
              setSelectedBill(null);
            }}
            onSubmit={handleMakePayment}
            billCycle={selectedBill}
          />
        )}
      </div>
    </div>
  );
};

export default CreditCardBills;
