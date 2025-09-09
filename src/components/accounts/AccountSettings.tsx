import React, { useState } from 'react';
import { 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CurrencySelector } from '../currency/CurrencySelector';
import { Modal } from '../common/Modal';
import { useFinance } from '../../contexts/FinanceContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';

interface AccountSettingsProps {
  account: any;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ account }) => {
  const { updateAccount, deleteAccount } = useFinance();
  const { profile } = useProfile();
  const { formatCurrency } = useInternationalization();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: account.name || '',
    currency: account.currency || profile?.primaryCurrency || 'USD',
    institution: account.institution || '',
    isVisible: account.isVisible !== false,
    notes: account.notes || ''
  });

  const [originalData, setOriginalData] = useState(formData);

  const handleEdit = () => {
    setOriginalData(formData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateAccount(account.id, {
        name: formData.name,
        currency: formData.currency,
        institution: formData.institution,
        isVisible: formData.isVisible,
        notes: formData.notes
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteAccount(account.id);
      setShowDeleteConfirm(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    if (newCurrency !== formData.currency) {
      // Show conversion warning if currency changes
      const currentBalance = account.balance || 0;
      setFormData(prev => ({
        ...prev,
        currency: newCurrency
      }));
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  return (
    <>
      {/* Settings Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="secondary"
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2"
        >
          <Settings size={16} />
          <span>Account Settings</span>
        </Button>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Account Settings"
        className="max-w-md"
      >
        <div className="space-y-6">
          {/* Account Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Account Information
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Account Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Enter account name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Institution
                </label>
                <Input
                  value={formData.institution}
                  onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Bank or institution name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Currency
                </label>
                <CurrencySelector
                  value={formData.currency}
                  onChange={handleCurrencyChange}
                  disabled={!isEditing}
                  showFlag={true}
                  showFullName={true}
                  popularOnly={false}
                />
                {formData.currency !== originalData.currency && (
                  <div className="mt-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} className="text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        Changing currency will update the symbol but keep the same balance amount.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Add notes about this account"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isVisible"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                  disabled={!isEditing}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isVisible" className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Show account in main view
                </label>
              </div>
            </div>
          </div>

          {/* Current Balance Display */}
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Current Balance
                </p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatCurrency(account.balance || 0)}
                </p>
              </div>
              <DollarSign size={24} style={{ color: 'var(--primary)' }} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {!isEditing ? (
              <Button
                variant="primary"
                onClick={handleEdit}
                className="flex-1"
              >
                Edit Account
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={!hasChanges || isLoading}
                  loading={isLoading}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </>
            )}
          </div>

          {/* Danger Zone */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-red-600 mb-3">
              Danger Zone
            </h3>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              <Trash2 size={16} className="mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Account"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle size={24} className="text-red-600" />
            <div>
              <p className="font-medium text-red-800">Warning</p>
              <p className="text-sm text-red-700">
                This action cannot be undone. All transactions and data associated with this account will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Account: {account.name}
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Balance: {formatCurrency(account.balance || 0)}
            </p>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              disabled={isLoading}
              loading={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AccountSettings;
