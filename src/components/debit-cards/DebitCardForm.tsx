import React, { useState } from 'react';
import { DollarSign, Building2, CreditCard } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import type { DebitCard } from '../../types';

interface DebitCardFormProps {
  card?: DebitCard;
  onSubmit: (card: Partial<DebitCard>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DebitCardForm: React.FC<DebitCardFormProps> = ({
  card,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<DebitCard>>({
    name: '',
    bank_name: '',
    last_four_digits: '',
    available_balance: 0,
    account_type: 'checking',
    is_primary: false,
    auto_reload_enabled: false,
    auto_reload_threshold: null,
    auto_reload_amount: null,
    ...card,
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate form data
      if (!formData.name?.trim()) {
        throw new Error('Card name is required');
      }
      if (!formData.bank_name?.trim()) {
        throw new Error('Bank name is required');
      }
      if (!formData.last_four_digits?.trim() || !/^\d{4}$/.test(formData.last_four_digits)) {
        throw new Error('Last 4 digits must be exactly 4 numbers');
      }

      // Validate auto-reload settings
      if (formData.auto_reload_enabled) {
        if (!formData.auto_reload_threshold || formData.auto_reload_threshold <= 0) {
          throw new Error('Auto-reload threshold must be greater than 0');
        }
        if (!formData.auto_reload_amount || formData.auto_reload_amount <= 0) {
          throw new Error('Auto-reload amount must be greater than 0');
        }
      }

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save debit card');
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
        // Reset auto-reload values when disabled
        ...(name === 'auto_reload_enabled' && !checked ? {
          auto_reload_threshold: null,
          auto_reload_amount: null,
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
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Card Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          startAdornment={<CreditCard size={18} className="text-gray-400" />}
          required
        />

        <Input
          label="Bank Name"
          name="bank_name"
          value={formData.bank_name}
          onChange={handleInputChange}
          startAdornment={<Building2 size={18} className="text-gray-400" />}
          required
        />

        <Input
          label="Last 4 Digits"
          name="last_four_digits"
          value={formData.last_four_digits}
          onChange={handleInputChange}
          pattern="\d{4}"
          maxLength={4}
          required
          helperText="Enter the last 4 digits of your card"
        />

        <Input
          type="number"
          label="Available Balance"
          name="available_balance"
          value={formData.available_balance}
          onChange={handleInputChange}
          startAdornment={<DollarSign size={18} className="text-gray-400" />}
          step="0.01"
          required
        />

        <Select
          label="Account Type"
          name="account_type"
          value={formData.account_type}
          onChange={handleInputChange}
          required
        >
          <option value="">Select account type</option>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
        </Select>

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
            Set as primary debit card
          </label>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="auto_reload_enabled"
              name="auto_reload_enabled"
              checked={formData.auto_reload_enabled}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto_reload_enabled" className="text-sm text-gray-700">
              Enable auto-reload
            </label>
          </div>

          {formData.auto_reload_enabled && (
            <div className="space-y-4 pl-6">
              <Input
                type="number"
                label="Auto-reload Threshold"
                name="auto_reload_threshold"
                value={formData.auto_reload_threshold || ''}
                onChange={handleInputChange}
                startAdornment={<DollarSign size={18} className="text-gray-400" />}
                step="0.01"
                required
                helperText="Balance threshold to trigger auto-reload"
              />

              <Input
                type="number"
                label="Auto-reload Amount"
                name="auto_reload_amount"
                value={formData.auto_reload_amount || ''}
                onChange={handleInputChange}
                startAdornment={<DollarSign size={18} className="text-gray-400" />}
                step="0.01"
                required
                helperText="Amount to add when auto-reload is triggered"
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
          {card ? 'Update Card' : 'Add Card'}
        </Button>
      </div>
    </form>
  );
};

export default DebitCardForm