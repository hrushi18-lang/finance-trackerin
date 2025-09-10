import React, { useState } from 'react';
import { MoreVertical, Edit, Copy, Trash2, Archive, Eye, EyeOff, Star, TrendingUp, History, AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { FinancialAccount } from '../../types';

interface AccountActionsMenuProps {
  account: FinancialAccount;
  onEdit: (account: FinancialAccount) => void;
  onDuplicate: (account: FinancialAccount) => void;
  onTransfer: (account: FinancialAccount) => void;
  onViewHistory: (account: FinancialAccount) => void;
  onViewAnalytics: (account: FinancialAccount) => void;
  onToggleVisibility: (account: FinancialAccount) => void;
  onTogglePin: (account: FinancialAccount) => void;
  onArchive: (account: FinancialAccount) => void;
  onDelete: (account: FinancialAccount) => void;
  onClose: () => void;
}

export const AccountActionsMenu: React.FC<AccountActionsMenuProps> = ({
  account,
  onEdit,
  onDuplicate,
  onTransfer,
  onViewHistory,
  onViewAnalytics,
  onToggleVisibility,
  onTogglePin,
  onArchive,
  onDelete,
  onClose
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(account);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleArchive = () => {
    onArchive(account);
    setShowArchiveConfirm(false);
    onClose();
  };

  return (
    <>
      <div className="absolute top-2 right-2 z-10">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          
          <div className="absolute right-0 top-8 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
            {/* Quick Actions */}
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Quick Actions
            </div>
            
            <button
              onClick={() => { onEdit(account); onClose(); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Account</span>
            </button>
            
            <button
              onClick={() => { onDuplicate(account); onClose(); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>Duplicate Account</span>
            </button>
            
            <button
              onClick={() => { onTransfer(account); onClose(); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Transfer Funds</span>
            </button>

            {/* Analytics & Insights */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Analytics & Insights
            </div>
            
            <button
              onClick={() => { onViewHistory(account); onClose(); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <History className="h-4 w-4" />
              <span>View Transaction History</span>
            </button>
            
            <button
              onClick={() => { onViewAnalytics(account); onClose(); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Spending Breakdown</span>
            </button>

            {/* Visibility & Organization */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Organization
            </div>
            
            <button
              onClick={() => { onTogglePin(account); onClose(); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <Star className="h-4 w-4" />
              <span>{account.isPrimary ? 'Unpin from Dashboard' : 'Pin to Dashboard'}</span>
            </button>
            
            <button
              onClick={() => { onToggleVisibility(account); onClose(); }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              {account.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{account.isVisible ? 'Hide from Overview' : 'Show in Overview'}</span>
            </button>

            {/* Safety Features */}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Account Management
            </div>
            
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="w-full px-3 py-2 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center space-x-2"
            >
              <Archive className="h-4 w-4" />
              <span>Archive Account</span>
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        title="Archive Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <Archive className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Archive "{account.name}"?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will hide the account from your dashboard but keep all transaction history.
              </p>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <p className="font-medium">What happens when you archive:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Account will be hidden from dashboard</li>
                  <li>• All transaction history is preserved</li>
                  <li>• You can restore it anytime</li>
                  <li>• Analytics data remains intact</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowArchiveConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleArchive}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              Archive Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Account"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete "{account.name}"?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone. All data will be permanently lost.
              </p>
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800 dark:text-red-200">
                <p className="font-medium">This will permanently delete:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Account and all its data</li>
                  <li>• All transaction history</li>
                  <li>• All analytics and insights</li>
                  <li>• All linked goals and bills</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
