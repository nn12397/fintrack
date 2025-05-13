import React, { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import type { Category } from '../../types';
import { createCategory, updateCategory, deleteCategory } from '../../services/category-service';

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onCategoriesChange,
  isOpen,
  onClose,
}) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: editingCategory.name,
          color: editingCategory.color,
        });
      } else {
        await createCategory(newCategory);
      }
      onCategoriesChange();
      setEditingCategory(null);
      setNewCategory({ name: '', color: '#3B82F6' });
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm('Are you sure you want to delete this category? All bills in this category will also be deleted.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await deleteCategory(category.id);
      onCategoriesChange();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Categories"
      size="lg"
    >
      <div className="space-y-6">
        {error && (
          <div className="flex items-center text-red-500 bg-red-50 p-4 rounded">
            <AlertTriangle className="mr-2" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Existing Categories */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Existing Categories</h3>
            <div className="grid gap-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`p-3 rounded-lg border ${
                    editingCategory?.id === category.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {editingCategory?.id === category.id ? (
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        placeholder="Category name"
                        required
                      />
                      <input
                        type="color"
                        value={editingCategory.color}
                        onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                        className="h-10 w-20"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={isSubmitting}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCategory(null)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(category)}
                          disabled={isSubmitting}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add New Category */}
          {!editingCategory && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Add New Category</h3>
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Category name"
                  required
                />
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="h-10 w-20"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus size={16} />}
                  isLoading={isSubmitting}
                >
                  Add
                </Button>
              </form>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CategoryManager;