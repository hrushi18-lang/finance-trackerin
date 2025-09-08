import React, { useState } from 'react';
import { useFinance } from '../../contexts/FinanceContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { Plus, PiggyBank, Settings, AlertCircle } from 'lucide-react';

interface GoalsVaultManagerProps {
  onClose?: () => void;
}

export const GoalsVaultManager: React.FC<GoalsVaultManagerProps> = ({ onClose }) => {
  const { accounts, getGoalsVaultAccount, createGoalsVaultAccount, ensureGoalsVaultAccount, cleanupDuplicateGoalsVaults } = useFinance();
  const [isCreating, setIsCreating] = useState(false);
  const [vaultName, setVaultName] = useState('Goals Vault');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalsVault = getGoalsVaultAccount();

  const handleCreateVault = async () => {
    if (!vaultName.trim()) {
      setError('Vault name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createGoalsVaultAccount(vaultName.trim(), currencyCode);
      setIsCreating(false);
      setVaultName('Goals Vault');
      setCurrencyCode('USD');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Goals Vault');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnsureVault = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await ensureGoalsVaultAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ensure Goals Vault');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await cleanupDuplicateGoalsVaults();
      setError('Duplicate Goals Vault accounts have been cleaned up!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup duplicates');
    } finally {
      setIsLoading(false);
    }
  };

  if (goalsVault) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <PiggyBank className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {goalsVault.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Goals Vault Account
              </p>
            </div>
          </div>
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Current Balance</span>
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${goalsVault.balance.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Currency</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {goalsVault.currencyCode}
            </span>
          </div>

          <div className="pt-4 border-t border-green-200 dark:border-green-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This vault automatically stores funds for your financial goals. 
              When you contribute to goals, money is transferred here for safekeeping.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
          <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Goals Vault Not Found
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create a Goals Vault to manage your savings goals
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!isCreating ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            A Goals Vault is a special account that automatically stores funds for your financial goals. 
            You can create one now or let the system create it automatically when needed.
          </p>
          
          <div className="space-y-3">
            <div className="flex space-x-3">
              <Button
                onClick={() => setIsCreating(true)}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Goals Vault
              </Button>
              <Button
                onClick={handleEnsureVault}
                variant="secondary"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Creating...' : 'Auto Create'}
              </Button>
            </div>
            <Button
              onClick={handleCleanupDuplicates}
              variant="secondary"
              disabled={isLoading}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
            >
              {isLoading ? 'Cleaning...' : 'Clean Up Duplicates'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vault Name
            </label>
            <Input
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              placeholder="Enter vault name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleCreateVault}
              disabled={isLoading || !vaultName.trim()}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isLoading ? 'Creating...' : 'Create Vault'}
            </Button>
            <Button
              onClick={() => {
                setIsCreating(false);
                setError(null);
              }}
              variant="secondary"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
