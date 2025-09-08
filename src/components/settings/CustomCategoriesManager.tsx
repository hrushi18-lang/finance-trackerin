import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, X, Tag } from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContextOffline';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { FontOptimizedText } from '../common/FontOptimizedText';

const CustomCategoriesManager: React.FC = () => {
  const { 
    userCategories, 
    addUserCategory, 
    updateUserCategory, 
    deleteUserCategory 
  } = useFinance();
  
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense' | 'bill' | 'goal' | 'liability' | 'budget' | 'account',
    color: '#6B7280',
    icon: 'Circle'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const categoryTypes = [
    { value: 'income', label: 'Income', color: '#10B981' },
    { value: 'expense', label: 'Expense', color: '#EF4444' },
    { value: 'bill', label: 'Bill', color: '#3B82F6' },
    { value: 'goal', label: 'Goal', color: '#7C3AED' },
    { value: 'liability', label: 'Liability', color: '#F59E0B' },
    { value: 'budget', label: 'Budget', color: '#14B8A6' },
    { value: 'account', label: 'Account', color: '#8B5CF6' }
  ];

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    
    try {
      setIsAdding(true);
      await addUserCategory({
        name: newCategory.name.trim(),
        type: newCategory.type,
        color: newCategory.color,
        icon: newCategory.icon,
        isActive: true
      });
      setNewCategory({
        name: '',
        type: 'expense',
        color: '#6B7280',
        icon: 'Circle'
      });
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditCategory = async (categoryId: string, updates: Partial<typeof newCategory>) => {
    try {
      setIsEditing(true);
      await updateUserCategory(categoryId, updates);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteUserCategory(categoryId);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const groupedCategories = categoryTypes.reduce((acc, type) => {
    acc[type.value] = userCategories.filter(cat => cat.type === type.value);
    return acc;
  }, {} as Record<string, typeof userCategories>);

  return (
    <div className="space-y-6">
      {/* Add New Category */}
      <div className="bg-gray-50 rounded-xl p-4">
        <FontOptimizedText fontFamily="heading" className="text-lg mb-4">
          Add New Category
        </FontOptimizedText>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Category Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter category name"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={newCategory.type}
              onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex space-x-2">
              {['#6B7280', '#EF4444', '#10B981', '#3B82F6', '#7C3AED', '#F59E0B', '#14B8A6'].map(color => (
                <button
                  key={color}
                  onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-full border-2 ${
                    newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={handleAddCategory}
              disabled={!newCategory.name.trim() || isAdding}
              className="w-full"
            >
              <Plus size={16} className="mr-2" />
              {isAdding ? 'Adding...' : 'Add Category'}
            </Button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {categoryTypes.map(type => {
          const categories = groupedCategories[type.value] || [];
          if (categories.length === 0) return null;
          
          return (
            <div key={type.value} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <FontOptimizedText fontFamily="heading" className="text-lg">
                  {type.label} Categories
                </FontOptimizedText>
                <span className="text-sm text-gray-500">({categories.length})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map(category => (
                  <div 
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    {editingCategory === category.id ? (
                      <div className="flex-1 flex items-center space-x-2">
                        <Input
                          value={category.name}
                          onChange={(e) => {
                            // Update local state for immediate feedback
                            const updatedCategories = userCategories.map(cat => 
                              cat.id === category.id ? { ...cat, name: e.target.value } : cat
                            );
                            // This would need to be handled properly with state management
                          }}
                          className="flex-1"
                          size="sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditCategory(category.id, { name: category.name })}
                          disabled={isEditing}
                        >
                          <Save size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingCategory(null)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <FontOptimizedText fontFamily="titles" className="text-sm">
                            {category.name}
                          </FontOptimizedText>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingCategory(category.id)}
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {userCategories.length === 0 && (
        <div className="text-center py-8">
          <Tag size={48} className="text-gray-300 mx-auto mb-4" />
          <FontOptimizedText fontFamily="heading" className="text-lg text-gray-500 mb-2">
            No Custom Categories
          </FontOptimizedText>
          <FontOptimizedText fontFamily="description" className="text-sm text-gray-400">
            Create your first custom category above
          </FontOptimizedText>
        </div>
      )}
    </div>
  );
};

export default CustomCategoriesManager;
