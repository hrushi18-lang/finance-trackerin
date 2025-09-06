import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/common/Button';
import { ArrowLeft, Check, Palette, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ThemeSettings: React.FC = () => {
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(theme);

  const themes = [
    {
      id: 'cool-blue' as Theme,
      name: 'Light Theme',
      description: 'Modern blue with neumorphic design',
      preview: {
        background: '#f8fafc',
        primary: '#2563eb',
        surface: '#ffffff',
        text: '#1e293b'
      }
    },
    {
      id: 'olive' as Theme,
      name: 'Dark Theme',
      description: 'Olive green dark mode',
      preview: {
        background: '#fefcf8',
        primary: '#3e5725',
        surface: '#ffffff',
        text: '#3e5725'
      }
    }
  ];

  const handleSave = () => {
    setTheme(selectedTheme);
    navigate(-1);
  };

  const handleCancel = () => {
    setSelectedTheme(theme);
    navigate(-1);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={24} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>
          Theme Settings
        </h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="px-6 pb-6 space-y-8">
        {/* Appearance Section */}
        <div>
          <h2 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
            Appearance
          </h2>
          <div className="flex items-center justify-between p-4 rounded-2xl card-neumorphic">
            <div className="flex items-center space-x-3">
              {isDarkMode ? <Moon size={24} style={{ color: 'var(--text-primary)' }} /> : <Sun size={24} style={{ color: 'var(--text-primary)' }} />}
              <div>
                <p className="font-body" style={{ color: 'var(--text-primary)' }}>
                  Dark Mode
                </p>
                <p className="text-sm font-serif-light" style={{ color: 'var(--text-secondary)' }}>
                  Switch between light and dark themes
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  isDarkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <h2 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
            Theme Color
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {themes.map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => setSelectedTheme(themeOption.id)}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  selectedTheme === themeOption.id
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  backgroundColor: themeOption.preview.background,
                  borderColor: selectedTheme === themeOption.id ? themeOption.preview.primary : undefined
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: themeOption.preview.primary }}
                    />
                    <div className="text-left">
                      <p className="font-body font-semibold" style={{ color: themeOption.preview.text }}>
                        {themeOption.name}
                      </p>
                      <p className="text-sm font-serif-light" style={{ color: 'var(--text-secondary)' }}>
                        {themeOption.description}
                      </p>
                    </div>
                  </div>
                  {selectedTheme === themeOption.id && (
                    <Check size={20} style={{ color: themeOption.preview.primary }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Section */}
        <div>
          <h2 className="text-lg font-heading mb-4" style={{ color: 'var(--text-primary)' }}>
            Preview
          </h2>
          <div 
            className="p-6 rounded-2xl card-neumorphic"
            style={{ backgroundColor: themes.find(t => t.id === selectedTheme)?.preview.background }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading" style={{ color: themes.find(t => t.id === selectedTheme)?.preview.text }}>
                  Your Balance
                </h3>
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: 'var(--text-tertiary)' }} />
              </div>
              
              <div className="space-y-2">
                <p className="text-3xl font-numbers" style={{ color: themes.find(t => t.id === selectedTheme)?.preview.text }}>
                  $12,345.67
                </p>
                <div className="flex items-center space-x-2">
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-body"
                    style={{ 
                      backgroundColor: themes.find(t => t.id === selectedTheme)?.preview.primary,
                      color: 'white'
                    }}
                  >
                    + $1,234.56
                  </span>
                  <span className="text-sm font-serif-light" style={{ color: 'var(--text-secondary)' }}>
                    this month
                  </span>
                </div>
              </div>
              
              <button
                className="w-full py-3 px-4 rounded-xl font-body font-semibold text-white"
                style={{ backgroundColor: themes.find(t => t.id === selectedTheme)?.preview.primary }}
              >
                + Add Money
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
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
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
