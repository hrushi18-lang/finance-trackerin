import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Tag, Palette, Hash, AlertCircle } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  description?: string;
}

interface CategoryFormProps {
  initialData?: any;
  parentId?: string | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const iconOptions = [
  '💰', '🏠', '🍔', '🚗', '🎬', '🛍️', '💊', '📚', 
  '✈️', '🎯', '💳', '📱', '⚡', '🎵', '🏋️', '🎨',
  '🍕', '☕', '🚕', '🎮', '💻', '👕', '🏥', '📖'
];

const colorOptions = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#F97316', '#84CC16', '#06B6D4',
  '#F43F5E', '#8B5A2B', '#6B7280', '#1F2937', '#374151'
];

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialData,
  parentId,
  onSubmit,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CategoryFormData>({
    defaultValues: initialData || {
      type: 'expense',
      color: colorOptions[0],
      icon: iconOptions[0]
    }
  });

  const selectedType = watch('type');
  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await onSubmit({
        ...data,
        parentId: parentId || null
      });
      
    } catch (error: any) {
      console.error('Error submitting category:', error);
      setError(error.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-error-500/20 border border-error-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} className="text-error-400" />
            <p className="text-error-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Parent Category Info */}
      {parentId && (
        <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
          <p className="text-blue-400 text-sm">
            This will be created as a subcategory under the selected parent category.
          </p>
        </div>
      )}

      {/* Category Name */}
      <Input
        label="Category Name"
        type="text"
        icon={<Tag size={18} className="text-yellow-400" />}
        {...register('name', { 
          required: 'Category name is required',
          minLength: { value: 2, message: 'Name must be at least 2 characters' }
        })}
        error={errors.name?.message}
        className="bg-black/20 border-white/20 text-white"
        placeholder="e.g., Groceries, Online Courses"
      />

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Category Type</label>
        <div className="grid grid-cols-2 gap-3">
          <label className="cursor-pointer">
            <input
              type="radio"
              value="income"
              {...register('type', { required: 'Type is required' })}
              className="sr-only"
            />
            <div className={`p-4 rounded-xl border-2 text-center transition-colors ${
              selectedType === 'income' 
                ? 'border-success-500 bg-success-500/20 text-success-400' 
                : 'border-white/20 hover:border-white/30 text-gray-300'
            }`}>
              <span className="font-medium">Income</span>
            </div>
          </label>
          
          <label className="cursor-pointer">
            <input
              type="radio"
              value="expense"
              {...register('type', { required: 'Type is required' })}
              className="sr-only"
            />
            <div className={`p-4 rounded-xl border-2 text-center transition-colors ${
              selectedType === 'expense' 
                ? 'border-error-500 bg-error-500/20 text-error-400' 
                : 'border-white/20 hover:border-white/30 text-gray-300'
            }`}>
              <span className="font-medium">Expense</span>
            </div>
          </label>
        </div>
      </div>

      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Hash size={16} className="mr-2" />
          Icon (Optional)
        </label>
        <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
          {iconOptions.map((icon) => (
            <label key={icon} className="cursor-pointer">
              <input
                type="radio"
                value={icon}
                {...register('icon')}
                className="sr-only"
              />
              <div className={`p-2 rounded-lg border-2 text-center transition-colors ${
                selectedIcon === icon 
                  ? 'border-primary-500 bg-primary-500/20' 
                  : 'border-white/20 hover:border-white/30'
              }`}>
                <span className="text-lg">{icon}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center">
          <Palette size={16} className="mr-2" />
          Color (Optional)
        </label>
        <div className="grid grid-cols-5 gap-2">
          {colorOptions.map((color) => (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                value={color}
                {...register('color')}
                className="sr-only"
              />
              <div 
                className={`w-12 h-12 rounded-lg border-2 transition-colors ${
                  selectedColor === color 
                    ? 'border-white scale-110 shadow-lg' 
                    : 'border-white/20 hover:border-white/50'
                }`} 
                style={{ backgroundColor: color }}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Description */}
      <Input
        label="Description (Optional)"
        type="text"
        {...register('description')}
        className="bg-black/20 border-white/20 text-white"
        placeholder="Brief description of this category"
      />

      {/* Preview */}
      <div className="bg-black/30 rounded-lg p-4 border border-white/10">
        <p className="text-sm text-gray-400 mb-2">Preview:</p>
        <div className="flex items-center space-x-3">
          {selectedIcon && <span className="text-xl">{selectedIcon}</span>}
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: selectedColor || '#6B7280' }}
          />
          <span className="font-medium text-white">{watch('name') || 'Category Name'}</span>
          <span className={`px-2 py-1 rounded text-xs ${
            selectedType === 'income' ? 'bg-success-500/20 text-success-400' : 'bg-error-500/20 text-error-400'
          }`}>
            {selectedType}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          loading={isSubmitting}
        >
          {initialData ? 'Update' : 'Create'} Category
        </Button>
      </div>
    </form>
  );
};