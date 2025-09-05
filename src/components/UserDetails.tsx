import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Modal } from './common/Modal';
import { Edit, Save, X, User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const UserDetails: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const handleEdit = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Note: Email cannot be changed in Supabase Auth
      // Only name can be updated
      if (profileData.name !== user?.name) {
        await updateProfile({ name: profileData.name });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      {/* User Details Card */}
      <div className="card-neumorphic p-6 slide-in-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-heading" style={{ color: 'var(--text-primary)' }}>
                {isEditing ? (
                  <Input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-lg font-heading"
                    style={{ color: 'var(--text-primary)' }}
                  />
                ) : (
                  user?.name || 'User'
                )}
              </h3>
              <p className="text-sm font-serif-light" style={{ color: 'var(--text-secondary)' }}>
                {user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
          
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Edit size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="p-2 rounded-full hover:bg-green-100 transition-colors"
              >
                <Save size={20} className="text-green-600" />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 rounded-full hover:bg-red-100 transition-colors"
              >
                <X size={20} className="text-red-600" />
              </button>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail size={16} style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              {user?.email || 'user@example.com'}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <Calendar size={16} style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'Recently'}
            </span>
          </div>
        </div>

        {/* Edit Note */}
        {isEditing && (
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--background-secondary)' }}>
            <p className="text-xs font-serif-light" style={{ color: 'var(--text-tertiary)' }}>
              Note: Email cannot be changed. Contact support if you need to update your email address.
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body mb-2" style={{ color: 'var(--text-primary)' }}>
              Full Name
            </label>
            <Input
              type="text"
              value={profileData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-body mb-2" style={{ color: 'var(--text-primary)' }}>
              Email Address
            </label>
            <Input
              type="email"
              value={profileData.email}
              disabled
              className="bg-gray-100"
              placeholder="Email cannot be changed"
            />
            <p className="text-xs font-serif-light mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Email cannot be changed. Contact support if needed.
            </p>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </Modal>
    </>
  );
};
