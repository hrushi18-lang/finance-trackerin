import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Shield, 
  Download, 
  Upload, 
  Trash2, 
  HelpCircle, 
  Info,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  Database,
  LogOut,
  Edit,
  Save,
  X,
  Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { financeManager } from '../lib/finance-manager';
import { offlineStorage } from '../lib/offline-storage';

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { syncData } = useFinance();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || ''
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await syncData();
      // Show success message
    } catch (error) {
      console.error('Error syncing data:', error);
      // Show error message
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await financeManager.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await financeManager.importAllData(data);
      // Show success message
    } catch (error) {
      console.error('Error importing data:', error);
      // Show error message
    }
  };

  const handleClearOfflineData = async () => {
    try {
      await offlineStorage.clear();
      // Show success message
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // This would typically involve calling a delete account API
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Update profile logic here
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: <User size={20} />,
          title: 'Profile',
          subtitle: 'Manage your personal information',
          onClick: () => setShowEditProfile(true)
        },
        {
          icon: <Bell size={20} />,
          title: 'Notifications',
          subtitle: 'Configure notification preferences',
          onClick: () => setShowNotifications(true)
        },
        {
          icon: <Shield size={20} />,
          title: 'Privacy & Security',
          subtitle: 'Manage your privacy settings',
          onClick: () => setShowPrivacy(true)
        }
      ]
    },
    {
      title: 'Data & Sync',
      items: [
        {
          icon: isOfflineMode ? <WifiOff size={20} /> : <Wifi size={20} />,
          title: 'Offline Mode',
          subtitle: isOfflineMode ? 'Currently offline' : 'Currently online',
          onClick: () => setIsOfflineMode(!isOfflineMode),
          rightElement: (
            <div className={`w-12 h-6 rounded-full transition-colors ${
              isOfflineMode ? 'bg-red-500' : 'bg-green-500'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                isOfflineMode ? 'translate-x-6' : 'translate-x-0.5'
              } mt-0.5`} />
            </div>
          )
        },
        {
          icon: <Database size={20} />,
          title: 'Data Management',
          subtitle: 'Export, import, and manage your data',
          onClick: () => setShowDataManagement(true)
        },
        {
          icon: <Upload size={20} />,
          title: 'Sync Data',
          subtitle: 'Sync your data across devices',
          onClick: handleSyncData,
          rightElement: isSyncing ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: 'var(--primary)' }} />
          ) : null
        }
      ]
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: <Palette size={20} />,
          title: 'Theme Settings',
          subtitle: 'Choose your preferred theme and colors',
          onClick: () => navigate('/theme-settings')
        },
        {
          icon: isDarkMode ? <Moon size={20} /> : <Sun size={20} />,
          title: 'Dark Mode',
          subtitle: isDarkMode ? 'Dark theme enabled' : 'Light theme enabled',
          onClick: toggleDarkMode,
          rightElement: (
            <div className={`w-12 h-6 rounded-full transition-colors ${
              isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                isDarkMode ? 'translate-x-7' : 'translate-x-0.5'
              } mt-0.5`} />
            </div>
          )
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={20} />,
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          onClick: () => setShowHelp(true)
        },
        {
          icon: <Info size={20} />,
          title: 'About',
          subtitle: 'App version and information',
          onClick: () => {}
        }
      ]
    },
    {
      title: 'Danger Zone',
      items: [
        {
          icon: <LogOut size={20} />,
          title: 'Sign Out',
          subtitle: 'Sign out of your account',
          onClick: handleSignOut,
          className: 'text-red-600'
        },
        {
          icon: <Trash2 size={20} />,
          title: 'Delete Account',
          subtitle: 'Permanently delete your account',
          onClick: () => setShowDeleteAccount(true),
          className: 'text-red-600'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-4">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: 'var(--background-secondary)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)'
            }}
          >
            <ArrowLeft size={18} style={{ color: 'var(--text-primary)' }} />
          </button>
          <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="px-4 space-y-6">
        {settingsSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <h2 className="text-sm font-body mb-3 px-2" style={{ color: 'var(--text-secondary)' }}>
              {section.title.toUpperCase()}
            </h2>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)'
              }}
            >
              {section.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={item.onClick}
                  className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    itemIndex < section.items.length - 1 ? 'border-b border-gray-200' : ''
                  } ${item.className || ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </h3>
                      <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  {item.rightElement || (
                    <div style={{ color: 'var(--text-tertiary)' }}>
                      <ArrowLeft size={16} className="rotate-180" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Your name"
          />
          <Input
            label="Email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="your@email.com"
            disabled
          />
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowEditProfile(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateProfile}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Data Management Modal */}
      <Modal
        isOpen={showDataManagement}
        onClose={() => setShowDataManagement(false)}
        title="Data Management"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Export Data
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Download a backup of all your financial data
            </p>
            <Button
              variant="primary"
              onClick={handleExportData}
              icon={<Download size={16} />}
              fullWidth
            >
              Export Data
            </Button>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Import Data
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Restore data from a backup file
            </p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
              id="import-file"
            />
            <Button
              variant="secondary"
              onClick={() => document.getElementById('import-file')?.click()}
              icon={<Upload size={16} />}
              fullWidth
            >
              Import Data
            </Button>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Clear Offline Data
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Remove all locally stored data (requires internet to restore)
            </p>
            <Button
              variant="secondary"
              onClick={handleClearOfflineData}
              icon={<Trash2 size={16} />}
              fullWidth
              className="text-red-600"
            >
              Clear Offline Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Bill Reminders
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Get notified before bills are due
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                Enable bill reminders
              </span>
              <div className="w-12 h-6 bg-green-500 rounded-full">
                <div className="w-5 h-5 bg-white rounded-full translate-x-6 mt-0.5" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Goal Updates
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Receive updates on your financial goals
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                Enable goal updates
              </span>
              <div className="w-12 h-6 bg-green-500 rounded-full">
                <div className="w-5 h-5 bg-white rounded-full translate-x-6 mt-0.5" />
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Budget Alerts
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Get alerts when approaching budget limits
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-body" style={{ color: 'var(--text-primary)' }}>
                Enable budget alerts
              </span>
              <div className="w-12 h-6 bg-gray-300 rounded-full">
                <div className="w-5 h-5 bg-white rounded-full translate-x-0.5 mt-0.5" />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy & Security"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Data Encryption
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              All your data is encrypted both in transit and at rest
            </p>
            <div className="flex items-center space-x-2">
              <Shield size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--success)' }}>
                Encryption enabled
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Two-Factor Authentication
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Add an extra layer of security to your account
            </p>
            <Button
              variant="secondary"
              onClick={() => {}}
              fullWidth
            >
              Enable 2FA
            </Button>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Data Sharing
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              We never share your personal financial data with third parties
            </p>
            <div className="flex items-center space-x-2">
              <Shield size={16} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-body" style={{ color: 'var(--success)' }}>
                Data sharing disabled
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="Help & Support"
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Getting Started
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Learn how to set up your first account and start tracking your finances
            </p>
            <Button
              variant="secondary"
              onClick={() => {}}
              fullWidth
            >
              View Guide
            </Button>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              Contact Support
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Need help? Our support team is here to assist you
            </p>
            <Button
              variant="primary"
              onClick={() => {}}
              fullWidth
            >
              Contact Support
            </Button>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-heading text-sm" style={{ color: 'var(--text-primary)' }}>
              FAQ
            </h3>
            <p className="text-xs font-body" style={{ color: 'var(--text-secondary)' }}>
              Find answers to frequently asked questions
            </p>
            <Button
              variant="secondary"
              onClick={() => {}}
              fullWidth
            >
              View FAQ
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="font-heading text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Are you sure?
            </h3>
            <p className="text-sm font-body" style={{ color: 'var(--text-secondary)' }}>
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </div>
          
          <div className="space-y-3">
            <Input
              label="Type 'DELETE' to confirm"
              type="text"
              placeholder="DELETE"
              required
            />
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteAccount(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};