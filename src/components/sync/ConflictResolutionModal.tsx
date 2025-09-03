import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { 
  AlertTriangle, 
  Check, 
  X, 
  Merge, 
  Server, 
  Monitor,
  Calendar,
  DollarSign,
  Tag,
  FileText
} from 'lucide-react';
import { conflictResolver } from '../../lib/conflict-resolver';
import { format } from 'date-fns';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  isOpen,
  onClose,
  onResolve
}) => {
  const [conflicts, setConflicts] = useState(conflictResolver.getUnresolvedConflicts());
  const [selectedConflict, setSelectedConflict] = useState<any>(null);
  const [resolution, setResolution] = useState<'server' | 'client' | 'merge'>('merge');
  const [customData, setCustomData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConflicts(conflictResolver.getUnresolvedConflicts());
      if (conflicts.length > 0) {
        setSelectedConflict(conflicts[0]);
      }
    }
  }, [isOpen, conflicts.length]);

  const handleResolveConflict = async () => {
    if (!selectedConflict) return;

    setLoading(true);
    try {
      await conflictResolver.manualResolveConflict(
        selectedConflict.id,
        resolution,
        customData
      );
      
      // Update conflicts list
      setConflicts(conflictResolver.getUnresolvedConflicts());
      
      // Select next conflict or close if none
      if (conflicts.length > 1) {
        const currentIndex = conflicts.findIndex(c => c.id === selectedConflict.id);
        const nextConflict = conflicts[currentIndex + 1] || conflicts[0];
        setSelectedConflict(nextConflict);
      } else {
        onResolve();
        onClose();
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipConflict = () => {
    if (conflicts.length > 1) {
      const currentIndex = conflicts.findIndex(c => c.id === selectedConflict.id);
      const nextConflict = conflicts[currentIndex + 1] || conflicts[0];
      setSelectedConflict(nextConflict);
    } else {
      onClose();
    }
  };

  const handleAutoResolveAll = async () => {
    setLoading(true);
    try {
      await conflictResolver.resolveConflicts();
      onResolve();
      onClose();
    } catch (error) {
      console.error('Error auto-resolving conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (field: string) => {
    switch (field) {
      case 'amount':
      case 'balance':
      case 'target_amount':
      case 'current_amount':
        return <DollarSign size={16} />;
      case 'date':
      case 'due_date':
      case 'target_date':
        return <Calendar size={16} />;
      case 'category':
        return <Tag size={16} />;
      case 'description':
      case 'notes':
        return <FileText size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const renderFieldComparison = (field: string, serverValue: any, clientValue: any) => {
    if (serverValue === clientValue) return null;

    return (
      <div key={field} className="p-3 rounded-xl border border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          {getFieldIcon(field)}
          <span className="font-medium text-sm capitalize">{field.replace('_', ' ')}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center space-x-1 mb-1">
              <Server size={12} className="text-red-600" />
              <span className="text-xs font-medium text-red-600">Server</span>
            </div>
            <p className="text-sm text-gray-700">
              {serverValue !== null && serverValue !== undefined ? serverValue.toString() : 'N/A'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center space-x-1 mb-1">
              <Monitor size={12} className="text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Client</span>
            </div>
            <p className="text-sm text-gray-700">
              {clientValue !== null && clientValue !== undefined ? clientValue.toString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMergeForm = () => {
    if (!selectedConflict || !selectedConflict.serverVersion || !selectedConflict.clientVersion) {
      return null;
    }

    const serverData = selectedConflict.serverVersion;
    const clientData = selectedConflict.clientVersion;
    const fields = Object.keys({ ...serverData, ...clientData });

    return (
      <div className="space-y-4">
        <h3 className="font-heading text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
          Merge Fields
        </h3>
        {fields.map(field => {
          if (field === 'id' || field === 'user_id' || field === 'created_at' || field === 'updated_at') {
            return null;
          }

          const serverValue = serverData[field];
          const clientValue = clientData[field];
          
          if (serverValue === clientValue) return null;

          return (
            <div key={field} className="space-y-2">
              <label className="block text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                {field.replace('_', ' ')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCustomData(prev => ({ ...prev, [field]: serverValue }))}
                  className={`p-2 rounded-lg border text-left ${
                    customData?.[field] === serverValue
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 mb-1">
                    <Server size={12} className="text-red-600" />
                    <span className="text-xs font-medium text-red-600">Server</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {serverValue !== null && serverValue !== undefined ? serverValue.toString() : 'N/A'}
                  </p>
                </button>
                <button
                  onClick={() => setCustomData(prev => ({ ...prev, [field]: clientValue }))}
                  className={`p-2 rounded-lg border text-left ${
                    customData?.[field] === clientValue
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-1 mb-1">
                    <Monitor size={12} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">Client</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {clientValue !== null && clientValue !== undefined ? clientValue.toString() : 'N/A'}
                  </p>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (conflicts.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="No Conflicts"
      >
        <div className="text-center py-8">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <h3 className="text-lg font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
            All conflicts resolved!
          </h3>
          <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
            Your data is now synchronized across all devices.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Resolve Conflicts (${conflicts.length} remaining)`}
    >
      <div className="space-y-6">
        {/* Conflict List */}
        <div>
          <h3 className="font-heading text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            Select Conflict to Resolve
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {conflicts.map((conflict) => (
              <button
                key={conflict.id}
                onClick={() => setSelectedConflict(conflict)}
                className={`w-full p-3 rounded-xl text-left transition-colors ${
                  selectedConflict?.id === conflict.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                      {conflict.table.replace('_', ' ').toUpperCase()}
                    </h4>
                    <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                      {conflict.conflictType} • {format(new Date(conflict.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                  <AlertTriangle size={16} className="text-orange-500" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conflict Details */}
        {selectedConflict && (
          <div>
            <h3 className="font-heading text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
              Conflict Details
            </h3>
            <div className="space-y-3">
              {selectedConflict.serverVersion && selectedConflict.clientVersion && (
                <>
                  {renderFieldComparison('name', selectedConflict.serverVersion.name, selectedConflict.clientVersion.name)}
                  {renderFieldComparison('description', selectedConflict.serverVersion.description, selectedConflict.clientVersion.description)}
                  {renderFieldComparison('amount', selectedConflict.serverVersion.amount, selectedConflict.clientVersion.amount)}
                  {renderFieldComparison('balance', selectedConflict.serverVersion.balance, selectedConflict.clientVersion.balance)}
                  {renderFieldComparison('category', selectedConflict.serverVersion.category, selectedConflict.clientVersion.category)}
                  {renderFieldComparison('date', selectedConflict.serverVersion.date, selectedConflict.clientVersion.date)}
                </>
              )}
            </div>
          </div>
        )}

        {/* Resolution Options */}
        <div>
          <h3 className="font-heading text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            Resolution Strategy
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setResolution('server')}
              className={`w-full p-3 rounded-xl border text-left transition-colors ${
                resolution === 'server'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Server size={20} className="text-red-600" />
                <div>
                  <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                    Use Server Version
                  </h4>
                  <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    Keep the server's version of this record
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setResolution('client')}
              className={`w-full p-3 rounded-xl border text-left transition-colors ${
                resolution === 'client'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Monitor size={20} className="text-blue-600" />
                <div>
                  <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                    Use Client Version
                  </h4>
                  <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    Keep your local version of this record
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setResolution('merge')}
              className={`w-full p-3 rounded-xl border text-left transition-colors ${
                resolution === 'merge'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Merge size={20} className="text-green-600" />
                <div>
                  <h4 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                    Merge Versions
                  </h4>
                  <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                    Combine both versions manually
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Merge Form */}
        {resolution === 'merge' && renderMergeForm()}

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={handleSkipConflict}
            className="flex-1"
            disabled={loading}
          >
            Skip
          </Button>
          <Button
            variant="primary"
            onClick={handleResolveConflict}
            className="flex-1"
            loading={loading}
          >
            Resolve
          </Button>
        </div>

        {/* Auto Resolve All */}
        <div className="pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleAutoResolveAll}
            loading={loading}
            fullWidth
          >
            Auto-Resolve All Conflicts
          </Button>
        </div>
      </div>
    </Modal>
  );
};
