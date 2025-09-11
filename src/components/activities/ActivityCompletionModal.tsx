import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ActivityCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityType: 'goal' | 'bill' | 'liability' | 'budget';
  activityName: string;
  onComplete: (action: 'continue' | 'extend' | 'archive' | 'delete', data?: any) => Promise<void>;
  loading?: boolean;
}

export const ActivityCompletionModal: React.FC<ActivityCompletionModalProps> = ({
  isOpen,
  onClose,
  activityType,
  activityName,
  onComplete,
  loading = false
}) => {
  const [selectedAction, setSelectedAction] = useState<'continue' | 'extend' | 'archive' | 'delete' | null>(null);
  const [extendData, setExtendData] = useState({
    newAmount: '',
    newDueDate: '',
    reason: ''
  });
  const [archiveData, setArchiveData] = useState({
    reason: ''
  });
  const [deleteData, setDeleteData] = useState({
    reason: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleActionSelect = (action: 'continue' | 'extend' | 'archive' | 'delete') => {
    setSelectedAction(action);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedAction) return;

    try {
      setError(null);
      
      switch (selectedAction) {
        case 'continue':
          await onComplete('continue');
          break;
        case 'extend':
          if (!extendData.newAmount && !extendData.newDueDate) {
            setError('Please provide new amount or due date for extension');
            return;
          }
          await onComplete('extend', {
            newAmount: extendData.newAmount ? parseFloat(extendData.newAmount) : undefined,
            newDueDate: extendData.newDueDate ? new Date(extendData.newDueDate) : undefined,
            reason: extendData.reason || 'Extended by user'
          });
          break;
        case 'archive':
          if (!archiveData.reason.trim()) {
            setError('Please provide a reason for archiving');
            return;
          }
          await onComplete('archive', {
            reason: archiveData.reason
          });
          break;
        case 'delete':
          if (!deleteData.reason.trim()) {
            setError('Please provide a reason for deletion');
            return;
          }
          await onComplete('delete', {
            reason: deleteData.reason
          });
          break;
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete action');
    }
  };

  const getActivityTypeLabel = (type: string) => {
    const labels = {
      goal: 'Goal',
      bill: 'Bill',
      liability: 'Liability',
      budget: 'Budget'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getActionIcon = (action: string) => {
    const icons = {
      continue: '▶️',
      extend: '📈',
      archive: '📦',
      delete: '🗑️'
    };
    return icons[action as keyof typeof icons] || '❓';
  };

  const getActionDescription = (action: string) => {
    const descriptions = {
      continue: 'Keep this activity active and continue as planned',
      extend: 'Extend the activity with new amount or timeline',
      archive: 'Archive this activity for future reference',
      delete: 'Permanently remove this activity (data preserved for analytics)'
    };
    return descriptions[action as keyof typeof descriptions] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Complete {getActivityTypeLabel(activityType)}</h2>
              <p className="text-purple-100 text-sm">{activityName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!selectedAction ? (
            // Action Selection
            <div className="space-y-4">
              <p className="text-gray-600 text-center">
                What would you like to do with this {activityType}?
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {(['continue', 'extend', 'archive', 'delete'] as const).map((action) => (
                  <button
                    key={action}
                    onClick={() => handleActionSelect(action)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getActionIcon(action)}</span>
                      <div>
                        <div className="font-medium capitalize">{action}</div>
                        <div className="text-xs text-gray-600">
                          {getActionDescription(action)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Action Details
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getActionIcon(selectedAction)}</span>
                <div>
                  <div className="font-medium capitalize">{selectedAction}</div>
                  <div className="text-sm text-gray-600">
                    {getActionDescription(selectedAction)}
                  </div>
                </div>
              </div>

              {selectedAction === 'extend' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Amount (optional)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter new amount"
                      value={extendData.newAmount}
                      onChange={(e) => setExtendData(prev => ({ ...prev, newAmount: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Due Date (optional)
                    </label>
                    <Input
                      type="date"
                      value={extendData.newDueDate}
                      onChange={(e) => setExtendData(prev => ({ ...prev, newDueDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason (optional)
                    </label>
                    <Input
                      placeholder="Why are you extending this activity?"
                      value={extendData.reason}
                      onChange={(e) => setExtendData(prev => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {selectedAction === 'archive' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Archiving *
                  </label>
                  <Input
                    placeholder="Why are you archiving this activity?"
                    value={archiveData.reason}
                    onChange={(e) => setArchiveData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              )}

              {selectedAction === 'delete' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Deletion *
                  </label>
                  <Input
                    placeholder="Why are you deleting this activity?"
                    value={deleteData.reason}
                    onChange={(e) => setDeleteData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Note: Transaction history will be preserved for analytics
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex space-x-3">
          {selectedAction && (
            <button
              onClick={() => setSelectedAction(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back
            </button>
          )}
          
          <div className="flex-1" />
          
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          
          {selectedAction && (
            <Button
              onClick={handleSubmit}
              loading={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {selectedAction === 'continue' ? 'Continue' : 
               selectedAction === 'extend' ? 'Extend' :
               selectedAction === 'archive' ? 'Archive' : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
