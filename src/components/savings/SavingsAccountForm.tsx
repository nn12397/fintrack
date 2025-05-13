import React, { useState } from 'react';
import { Building2, PiggyBank, Wallet } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import type { SavingsAccount } from '../../types';

interface SavingsAccountFormProps {
  account?: SavingsAccount;
  onSubmit: (account: Partial<SavingsAccount>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const SavingsAccountForm: React.FC<SavingsAccountFormProps> = ({
  account,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<SavingsAccount>>({
    name: '',
    account_type: 'financial_institute',
    institution_name: '',
    current_balance: 0,
    target_balance: null,
    notes: '',
    is_primary: false,
    auto_transfer_enabled: false,
    auto_transfer_threshold: null,
    auto_transfer_amount: null,
    ...account,
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.name?.trim()) {
        throw new Error('Account name is required');
      }
      if (!formData.account_type) {
        throw new Error('Account type is required');
      }
      if (formData.account_type === 'financial_institute' && !formData.institution_name?.trim()) {
        throw new Error('Institution name is required for financial institute accounts');
      }

      // Validate auto-transfer settings
      if (formData.auto_transfer_enabled) {
        if (!formData.auto_transfer_threshold || formData.auto_transfer_threshold <= 0) {
          throw new Error('Auto-transfer threshold must be greater than 0');
        }
        if (!formData.auto_transfer_amount || formData.auto_transfer_amount <= 0) {
          throw new Error('Auto-transfer amount must be greater than 0');
        }
      }

      await onSubmit(formData);
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to save savings account';
      
      // Handle specific error cases
      if (errorMessage.includes('duplicate key')) {
        errorMessage = 'There was an error creating the account. Please try again.';
      }
      
      setError(errorMessage);
      
      // Scroll error into view if needed
      const errorElement = document.querySelector('.error-message');
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        // Reset auto-transfer values when disabled
        ...(name === 'auto_transfer_enabled' && !checked ? {
          auto_transfer_threshold: null,
          auto_transfer_amount: null,
        } : {})
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="error-message bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Account Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />

        <Select
          label="Account Type"
          name="account_type"
          value={formData.account_type}
          onChange={handleInputChange}
          required
        >
          <option value="financial_institute">Financial Institute</option>
          <option value="cash">Cash</option>
          <option value="piggy_bank">Piggy Bank</option>
        </Select>

        {formData.account_type === 'financial_institute' && (
          <Input
            label="Institution Name"
            name="institution_name"
            value={formData.institution_name}
            onChange={handleInputChange}
            required
            startAdornment={<Building2 size={18} className="text-gray-400" />}
          />
        )}

        <Input
          type="number"
          label="Current Balance"
          name="current_balance"
          value={formData.current_balance}
          onChange={handleInputChange}
          startAdornment={<Wallet size={18} className="text-gray-400" />}
          step="0.01"
          required
        />

        <Input
          type="number"
          label="Target Balance (Optional)"
          name="target_balance"
          value={formData.target_balance || ''}
          onChange={handleInputChange}
          startAdornment={<PiggyBank size={18} className="text-gray-400" />}
          step="0.01"
        />

        <Input
          label="Notes (Optional)"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
        />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_primary"
            name="is_primary"
            checked={formData.is_primary}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_primary" className="text-sm text-gray-700">
            Set as primary savings account
          </label>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="auto_transfer_enabled"
              name="auto_transfer_enabled"
              checked={formData.auto_transfer_enabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto_transfer_enabled" className="text-sm text-gray-700">
              Enable auto-transfer
            </label>
          </div>

          {formData.auto_transfer_enabled && (
            <div className="space-y-4 pl-6">
              <Input
                type="number"
                label="Auto-transfer Threshold"
                name="auto_transfer_threshold"
                value={formData.auto_transfer_threshold || ''}
                onChange={handleInputChange}
                startAdornment={<Wallet size={18} className="text-gray-400" />}
                step="0.01"
                required
                helperText="Balance threshold to trigger auto-transfer"
              />

              <Input
                type="number"
                label="Auto-transfer Amount"
                name="auto_transfer_amount"
                value={formData.auto_transfer_amount || ''}
                onChange={handleInputChange}
                startAdornment={<Wallet size={18} className="text-gray-400" />}
                step="0.01"
                required
                helperText="Amount to transfer when threshold is reached"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {account ? 'Update Account' : 'Add Account'}
        </Button>
      </div>
    </form>
  );
};

export default SavingsAccountForm;