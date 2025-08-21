import React, { useState, useMemo } from 'react';
import { Tag, Plus, Edit3, Trash2, ChevronRight, ChevronDown, Target, BarChart3, Zap, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useFinance } from '../../contexts/FinanceContext';
import { useInternationalization } from '../../contexts/InternationalizationContext';
import { CategoryForm } from '../forms/CategoryForm';
import { CategoryBudgetForm } from '../forms/CategoryBudgetForm';
import { CategoryAnalytics } from './CategoryAnalytics';

interface CategoryNode {
  id: string;
  name: string;
  type: 'income' | 'expense';
  parentId?: string;
  children: CategoryNode[];
  icon?: string;
  color?: string;
  budget?: {
    amount: number;
    period: 'weekly' | 'monthly' | 'yearly';
    spent: number;
  };
  depth: number;
}

export const DynamicCategoryManager: React.FC = () => {
  const { userCategories, transactions, addUserCategory, updateUserCategory, deleteUserCategory } = useFinance();
  const { formatCurrency } = useInternationalization();
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'tree' | 'analytics' | 'insights'>('tree');

  // Build hierarchical category tree
  const categoryTree = useMemo(() => {
    const buildTree = (parentId?: string, depth = 0): CategoryNode[] => {
      return (userCategories || [])
        .filter(cat => cat.parentId === parentId)
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          type: cat.type,
          parentId: cat.parentId,
          icon: cat.icon,
          color: cat.color,
          children: buildTree(cat.id, depth + 1),
          depth,
          budget: calculateCategoryBudget(cat.id)
        }));
    };

    return {
      income: buildTree(undefined).filter(cat => cat.type === 'income'),
      expense: buildTree(undefined).filter(cat => cat.type === 'expense')
    };
  }, [userCategories]);

  function calculateCategoryBudget(categoryId: string) {
    const category = userCategories?.find(cat => cat.id === categoryId);
    if (!category) return undefined;

    const categoryTransactions = (transactions || []).filter(t => 
      t.category === category.name ||
      isSubcategoryOf(t.category, categoryId)
    );

    const spent = categoryTransactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);

    // Get budget from context (if exists)
    // This would need to be implemented in the FinanceContext
    return {
      amount: 1000, // Placeholder
      period: 'monthly' as const,
      spent
    };
  }

  function isSubcategoryOf(transactionCategory: string, parentCategoryId: string): boolean {
    // Check if transaction category is a subcategory of the given parent
    const findInTree = (nodes: CategoryNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === parentCategoryId) {
          return checkChildren(node.children, transactionCategory);
        }
        if (findInTree(node.children)) return true;
      }
      return false;
    };

    const checkChildren = (children: CategoryNode[], categoryName: string): boolean => {
      for (const child of children) {
        if (child.name === categoryName) return true;
        if (checkChildren(child.children, categoryName)) return true;
      }
      return false;
    };

    return findInTree([...categoryTree.income, ...categoryTree.expense]);
  }

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAddCategory = async (data: any) => {
    try {
      await addUserCategory({
        ...data,
        parentId: selectedParent
      });
      setShowCategoryModal(false);
      setSelectedParent(null);
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const CategoryTreeNode: React.FC<{ category: CategoryNode }> = ({ category }) => {
    const hasChildren = category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const indentation = category.depth * 20;

    return (
      <div>
        <div 
          className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/10 hover:bg-black/30 transition-colors"
          style={{ marginLeft: `${indentation}px` }}
        >
          <div className="flex items-center space-x-3">
            {hasChildren ? (
              <button onClick={() => toggleExpanded(category.id)}>
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4"></div>
            )}
            
            {category.icon && <span className="text-lg">{category.icon}</span>}
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color || '#6B7280' }}
            />
            <span className="font-medium text-white">{category.name}</span>
            <span className={`px-2 py-1 rounded text-xs ${
              category.type === 'income' ? 'bg-success-500/20 text-success-400' : 'bg-error-500/20 text-error-400'
            }`}>
              {category.type}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {category.budget && (
              <div className="text-right text-sm">
                <p className="text-white font-medium">
                  {formatCurrency(category.budget.spent)} / {formatCurrency(category.budget.amount)}
                </p>
                <div className="w-16 bg-white/20 rounded-full h-1 mt-1">
                  <div 
                    className={`h-1 rounded-full ${
                      category.budget.spent > category.budget.amount ? 'bg-error-500' : 'bg-success-500'
                    }`}
                    style={{ width: `${Math.min((category.budget.spent / category.budget.amount) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            <button
              onClick={() => {
                setSelectedParent(category.id);
                setShowCategoryModal(true);
              }}
              className="p-1 hover:bg-primary-500/20 rounded transition-colors"
              title="Add subcategory"
            >
              <Plus size={14} className="text-primary-400" />
            </button>
            
            <button
              onClick={() => {
                setEditingCategory(category);
                setShowCategoryModal(true);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <Edit3 size={14} className="text-gray-400" />
            </button>
            
            <button
              onClick={() => deleteUserCategory(category.id)}
              className="p-1 hover:bg-error-500/20 rounded transition-colors"
            >
              <Trash2 size={14} className="text-error-400" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {category.children.map(child => (
              <CategoryTreeNode key={child.id} category={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Tag size={20} className="text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Dynamic Category System</h3>
              <p className="text-sm text-yellow-200">Organize your finances your way</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCategoryModal(true)}
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600 text-black"
          >
            <Plus size={16} className="mr-2" />
            Add Category
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Total Categories</p>
            <p className="text-lg font-bold text-white">{(userCategories || []).length}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Income Types</p>
            <p className="text-lg font-bold text-success-400">
              {categoryTree.income.length}
            </p>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Expense Types</p>
            <p className="text-lg font-bold text-error-400">
              {categoryTree.expense.length}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-black/20 rounded-xl p-1 border border-white/10">
        {[
          { id: 'tree', label: 'Category Tree', icon: Tag },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'insights', label: 'AI Insights', icon: Zap }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'tree' && (
        <div className="space-y-6">
          {/* Income Categories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-white flex items-center">
                <TrendingUp size={18} className="mr-2 text-success-400" />
                Income Categories
              </h4>
              <Button
                onClick={() => {
                  setSelectedParent(null);
                  setShowCategoryModal(true);
                }}
                size="sm"
                variant="outline"
                className="border-success-500/30 text-success-400 hover:bg-success-500/10"
              >
                <Plus size={14} className="mr-2" />
                Add Income Category
              </Button>
            </div>
            
            <div className="space-y-2">
              {categoryTree.income.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No income categories yet</p>
              ) : (
                categoryTree.income.map(category => (
                  <CategoryTreeNode key={category.id} category={category} />
                ))
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-white flex items-center">
                <TrendingDown size={18} className="mr-2 text-error-400" />
                Expense Categories
              </h4>
              <Button
                onClick={() => {
                  setSelectedParent(null);
                  setShowCategoryModal(true);
                }}
                size="sm"
                variant="outline"
                className="border-error-500/30 text-error-400 hover:bg-error-500/10"
              >
                <Plus size={14} className="mr-2" />
                Add Expense Category
              </Button>
            </div>
            
            <div className="space-y-2">
              {categoryTree.expense.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No expense categories yet</p>
              ) : (
                categoryTree.expense.map(category => (
                  <CategoryTreeNode key={category.id} category={category} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <CategoryAnalytics categories={userCategories || []} transactions={transactions || []} />
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="bg-primary-500/20 rounded-lg p-4 border border-primary-500/30">
            <div className="flex items-start space-x-3">
              <Zap size={18} className="text-primary-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-primary-400 mb-2">AI Category Insights</h4>
                <div className="text-sm text-primary-300 space-y-2">
                  <p>• Your most used category is "Food" with 45% of transactions</p>
                  <p>• Consider creating subcategories under "Entertainment" for better tracking</p>
                  <p>• You could save 15% by optimizing your "Subscription" category</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
          setSelectedParent(null);
        }}
        title={editingCategory ? 'Edit Category' : selectedParent ? 'Add Subcategory' : 'Add Category'}
      >
        <CategoryForm
          initialData={editingCategory}
          parentId={selectedParent}
          onSubmit={editingCategory ? updateUserCategory : handleAddCategory}
          onCancel={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
            setSelectedParent(null);
          }}
        />
      </Modal>

      {/* Budget Form Modal */}
      <Modal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        title="Set Category Budget"
      >
        <CategoryBudgetForm
          onSubmit={(data) => {
            // Handle budget setting
            setShowBudgetModal(false);
          }}
          onCancel={() => setShowBudgetModal(false)}
        />
      </Modal>
    </div>
  );
};