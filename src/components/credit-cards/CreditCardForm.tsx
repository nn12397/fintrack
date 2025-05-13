import React, { useState } from 'react';
import { format } from 'date-fns';
import { DollarSign, Percent, Calendar, Clock, Building2, CreditCard } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import type { CreditCard as CreditCardType, PaymentFrequency } from '../../types';

interface CreditCardFormProps {
  card?: CreditCardType;
  onSubmit: (card: Partial<CreditCardType>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CreditCardForm: React.FC<CreditCardFormProps> = ({
  card,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<CreditCardType>>({
    name: '',
    bank_name: '',
    last_four_digits: '',
    current_balance: 0,
    credit_limit: 0,
    interest_rate: 0,
    minimum_payment: 0,
    due_date: format(new Date(), 'yyyy-MM-dd'),
    is_autopay: false,
    payment_amount: 0,
    payment_frequency: 'monthly',
    payment_day: null,
    payment_week_day: null,
    payment_start_date: format(new Date(), 'yyyy-MM-dd'),
    payment_end_date: null,
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
      if (!formData.credit_limit || formData.credit_limit <= 0) {
        throw new Error('Credit limit must be greater than 0');
      }
      // Only validate minimum payment if there is a balance
      if (formData.current_balance > 0 && (!formData.minimum_payment || formData.minimum_payment <= 0)) {
        throw new Error('Minimum payment must be greater than 0 when there is a balance');
      }
      if (formData.current_balance > 0 && (!formData.payment_amount || formData.payment_amount < (formData.minimum_payment || 0))) {
        throw new Error('Payment amount must be at least the minimum payment when there is a balance');
      }

      // Validate payment schedule based on frequency
      if (formData.payment_frequency === 'monthly' && !formData.payment_day) {
        throw new Error('Please select a payment day for monthly payments');
      }
      if (['weekly', 'bi-weekly'].includes(formData.payment_frequency || '') && 
          formData.payment_week_day === null) {
        throw new Error('Please select a day of the week for weekly/bi-weekly payments');
      }

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save credit card');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      const numericValue = parseFloat(value) || 0;
      setFormData(prev => {
        // If it's the current_balance field and the value is 0, clear the due date
        if (name === 'current_balance' && numericValue === 0) {
          return {
            ...prev,
            [name]: numericValue,
            due_date: null, // Set due date to null when balance is 0
            minimum_payment: 0 // Also reset minimum payment to 0
          };
        }
        return {
          ...prev,
          [name]: numericValue
        };
      });
    } else if (type === 'date') {
      // For date inputs, set null if empty string
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? null : value
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Reset payment day/week day when frequency changes
    if (name === 'payment_frequency') {
      const frequency = value as PaymentFrequency;
      if (frequency === 'monthly') {
        setFormData(prev => ({
          ...prev,
          payment_frequency: frequency,
          payment_day: prev.payment_day || 1,
          payment_week_day: null
        }));
      } else if (['weekly', 'bi-weekly'].includes(frequency)) {
        setFormData(prev => ({
          ...prev,
          payment_frequency: frequency,
          payment_day: null,
          payment_week_day: prev.payment_week_day || 0
        }));
      } else if (frequency === 'bi-monthly') {
        setFormData(prev => ({
          ...prev,
          payment_frequency: frequency,
          payment_day: null,
          payment_week_day: null
        }));
      }
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
          label="Current Balance"
          name="current_balance"
          value={formData.current_balance}
          onChange={handleInputChange}
          startAdornment={<DollarSign size={18} className="text-gray-400" />}
          step="0.01"
          min="0"
          required
        />

        <Input
          type="number"
          label="Credit Limit"
          name="credit_limit"
          value={formData.credit_limit}
          onChange={handleInputChange}
          startAdornment={<DollarSign size={18} className="text-gray-400" />}
          step="0.01"
          min="0"
          required
        />

        <Input
          type="number"
          label="Interest Rate"
          name="interest_rate"
          value={formData.interest_rate}
          onChange={handleInputChange}
          endAdornment={<Percent size={18} className="text-gray-400" />}
          step="0.01"
          min="0"
          required
        />

        <Input
          type="number"
          label="Minimum Payment"
          name="minimum_payment"
          value={formData.minimum_payment}
          onChange={handleInputChange}
          startAdornment={<DollarSign size={18} className="text-gray-400" />}
          step="0.01"
          min="0"
          required
        />

        <Input
          type="date"
          label="Due Date"
          name="due_date"
          value={formData.due_date || ''}
          onChange={handleInputChange}
          startAdornment={<Calendar size={18} className="text-gray-400" />}
          required={formData.current_balance > 0}
          disabled={formData.current_balance === 0}
          helperText={formData.current_balance === 0 ? "Due date not required when balance is 0" : undefined}
        />

        <div className="border-t pt-4 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Schedule</h3>

          <div className="space-y-4">
            <Input
              type="number"
              label="Payment Amount"
              name="payment_amount"
              value={formData.payment_amount}
              onChange={handleInputChange}
              startAdornment={<DollarSign size={18} className="text-gray-400" />}
              step="0.01"
              min={formData.minimum_payment}
              required
              helperText={`Must be at least ${new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(formData.minimum_payment || 0)}`}
            />

            <Select
              label="Payment Frequency"
              name="payment_frequency"
              value={formData.payment_frequency}
              onChange={handleInputChange}
              required
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="bi-monthly">Bi-monthly (15th & Last Day)</option>
              <option value="monthly">Monthly</option>
            </Select>

            {formData.payment_frequency === 'monthly' && (
              <Input
                type="number"
                label="Payment Day"
                name="payment_day"
                value={formData.payment_day || ''}
                onChange={handleInputChange}
                min={1}
                max={31}
                required
                helperText="Enter the day of the month (1-31)"
              />
            )}

            {['weekly', 'bi-weekly'].includes(formData.payment_frequency || '') && (
              <Select
                label="Payment Day"
                name="payment_week_day"
                value={formData.payment_week_day?.toString() || ''}
                onChange={e => handleInputChange({
                  ...e,
                  target: { ...e.target, value: parseInt(e.target.value), name: 'payment_week_day' }
                })}
                required
              >
                <option value="">Select a day</option>
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </Select>
            )}

            <Input
              type="date"
              label="Start Date"
              name="payment_start_date"
              value={formData.payment_start_date}
              onChange={handleInputChange}
              startAdornment={<Clock size={18} className="text-gray-400" />}
              required
            />

            <Input
              type="date"
              label="End Date (Optional)"
              name="payment_end_date"
              value={formData.payment_end_date || ''}
              onChange={handleInputChange}
              startAdornment={<Clock size={18} className="text-gray-400" />}
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_autopay"
                name="is_autopay"
                checked={formData.is_autopay}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_autopay" className="text-sm text-gray-700">
                Auto-pay enabled
              </label>
            </div>
          </div>
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

export default CreditCardForm;