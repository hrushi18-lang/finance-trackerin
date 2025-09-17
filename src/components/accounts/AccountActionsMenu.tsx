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
          
          <div className="absolute right-0 top-8 w-64 bg-gray-800 dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-600 dark:border-gray-700 py-2 z-20 backdrop-blur-sm">
            {/* Quick Actions */}
            <div className="px-3 py-2 text-xs font-semibold text-white uppercase tracking-wide font-playfair">
              Quick Actions
            </div>
            
            <button
              onClick={() => { onEdit(account); onClose(); }}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-blue-500/20 flex items-center space-x-3 rounded-lg mx-2 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-blue-500/30 rounded-lg group-hover:bg-blue-500/50 transition-colors">
                <Edit className="h-4 w-4 text-blue-300" />
              </div>
              <div>
                <span className="font-medium font-playfair">Edit Account</span>
                <p className="text-xs text-white">Modify account details</p>
              </div>
            </button>
            
            <button
              onClick={() => { onDuplicate(account); onClose(); }}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-green-500/20 flex items-center space-x-3 rounded-lg mx-2 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-green-500/30 rounded-lg group-hover:bg-green-500/50 transition-colors">
                <Copy className="h-4 w-4 text-green-300" />
              </div>
              <div>
                <span className="font-medium font-playfair">Duplicate Account</span>
                <p className="text-xs text-white">Create a copy</p>
              </div>
            </button>
            
            <button
              onClick={() => { onTransfer(account); onClose(); }}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-purple-500/20 flex items-center space-x-3 rounded-lg mx-2 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-purple-500/30 rounded-lg group-hover:bg-purple-500/50 transition-colors">
                <TrendingUp className="h-4 w-4 text-purple-300" />
              </div>
              <div>
                <span className="font-medium font-playfair">Transfer Funds</span>
                <p className="text-xs text-white">Move money between accounts</p>
              </div>
            </button>

            {/* Analytics & Insights */}
            <div className="border-t border-gray-500 dark:border-gray-600 my-1"></div>
            <div className="px-3 py-2 text-xs font-semibold text-white uppercase tracking-wide font-playfair">
              Analytics & Insights
            </div>
            
            <button
              onClick={() => { onViewHistory(account); onClose(); }}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-indigo-500/20 flex items-center space-x-3 rounded-lg mx-2 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-indigo-500/30 rounded-lg group-hover:bg-indigo-500/50 transition-colors">
                <History className="h-4 w-4 text-indigo-300" />
              </div>
              <div>
                <span className="font-medium font-playfair">Transaction History</span>
                <p className="text-xs text-white">View all transactions</p>
              </div>
            </button>
            
            <button
              onClick={() => { onViewAnalytics(account); onClose(); }}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-orange-500/20 flex items-center space-x-3 rounded-lg mx-2 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-orange-500/30 rounded-lg group-hover:bg-orange-500/50 transition-colors">
                <TrendingUp className="h-4 w-4 text-orange-300" />
              </div>
              <div>
                <span className="font-medium font-playfair">Spending Analytics</span>
                <p className="text-xs text-white">View spending breakdown</p>
              </div>
            </button>

            {/* Visibility & Organization */}
            <div className="border-t border-gray-500 dark:border-gray-600 my-1"></div>
            <div className="px-3 py-2 text-xs font-semibold text-white uppercase tracking-wide font-playfair">
              Organization
            </div>
            
            <button
              onClick={() => { onTogglePin(account); onClose(); }}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-yellow-500/20 flex items-center space-x-3 rounded-lg mx-2 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-yellow-500/30 rounded-lg group-hover:bg-yellow-500/50 transition-colors">
                <Star className="h-4 w-4 text-yellow-300" />
              </div>
              <div>
                <span className="font-medium font-playfair">{account.isPrimary ? 'Unpin from Home' : 'Pin to Home'}</span>
                <p className="text-xs text-white">{account.isPrimary ? 'Remove from home screen' : 'Add to home screen'}</p>
              </div>
            </button>
            
            <button
              onClick={() => { onToggleVisibility(account); onClose(); }}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-cyan-500/20 flex items-center space-x-3 rounded-lg mx-2 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-cyan-500/30 rounded-lg group-hover:bg-cyan-500/50 transition-colors">
                {account.isVisible ? <EyeOff className="h-4 w-4 text-cyan-300" /> : <Eye className="h-4 w-4 text-cyan-300" />}
              </div>
              <div>
                <span className="font-medium font-playfair">{account.isVisible ? 'Hide from Overview' : 'Show in Overview'}</span>
                <p className="text-xs text-white">{account.isVisible ? 'Hide from financial overview' : 'Show in financial overview'}</p>
              </div>
            </button>

            {/* Safety Features */}
            <div className="border-t border-gray-500 dark:border-gray-600 my-1"></div>
            <div className="px-3 py-2 text-xs font-semibold text-white uppercase tracking-wide font-playfair">
              Account Management
            </div>
            
            <button
              onClick={() => setShowArchiveConfirm(true)}
              className="w-full px-4 py-3 text-left text-sm text-orange-300 hover:bg-orange-500/20 flex items-center space-x-3 rounded-lg mx-2 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-orange-500/30 rounded-lg group-hover:bg-orange-500/50 transition-colors">
                <Archive className="h-4 w-4 text-orange-300" />
              </div>
              <div>
                <span className="font-medium font-playfair">Archive Account</span>
                <p className="text-xs text-orange-300">Hide from home screen</p>
              </div>
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full px-4 py-3 text-left text-sm text-red-300 hover:bg-red-500/20 flex items-center space-x-3 rounded-lg mx-2 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-red-500/30 rounded-lg group-hover:bg-red-500/50 transition-colors">
                <Trash2 className="h-4 w-4 text-red-300" />
              </div>
              <div>
                <span className="font-medium font-playfair">Delete Account</span>
                <p className="text-xs text-red-300">Permanently remove</p>
              </div>
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
                This will hide the account from your home screen but keep all transaction history.
              </p>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <p className="font-medium">What happens when you archive:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• Account will be hidden from home screen</li>
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
