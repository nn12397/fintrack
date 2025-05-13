import React, { useState } from 'react';
import { format } from 'date-fns';
import { DollarSign, Calendar } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import type { CreditCard, CreditCardPayment } from '../../types';

interface CreditCardPaymentFormProps {
  card: CreditCard;
  onSubmit: (payment: Partial<CreditCardPayment>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const CreditCardPaymentForm: React.FC<CreditCardPaymentFormProps> = ({
  card,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<CreditCardPayment>>({
    credit_card_id: card.id,
    amount: card.payment_amount,
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    previous_balance: card.current_balance,
    new_balance: Math.max(0, card.current_balance - card.payment_amount),
    payment_type: 'one-time',
    recurrence_interval: undefined,
    start_date: undefined,
    end_date: undefined,
    recurrence_day: undefined,
    recurrence_week_day: undefined,
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Validate form data
      if (!formData.amount || formData.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (formData.payment_type === 'recurring') {
        if (!formData.recurrence_interval) {
          throw new Error('Please select a recurrence interval');
        }
        if (!formData.start_date) {
          throw new Error('Start date is required for recurring payments');
        }

        // Validate recurrence details based on interval
        if (formData.recurrence_interval === 'monthly') {
          if (!formData.recurrence_day || formData.recurrence_day < 1 || formData.recurrence_day > 31) {
            throw new Error('Please select a valid day of the month (1-31)');
          }
        } else if (['weekly', 'bi-weekly'].includes(formData.recurrence_interval)) {
          if (formData.recurrence_week_day === undefined || formData.recurrence_week_day < 0 || formData.recurrence_week_day > 6) {
            throw new Error('Please select a valid day of the week');
          }
        }
      }

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save payment');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      const numValue = parseFloat(value) || 0;
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: numValue
        };
        
        // Update new_balance when amount changes
        if (name === 'amount') {
          newData.new_balance = Math.max(0, (prev.previous_balance || 0) - numValue);
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Reset recurrence fields when payment type changes
    if (name === 'payment_type') {
      if (value === 'one-time') {
        setFormData(prev => ({
          ...prev,
          payment_type: 'one-time',
          recurrence_interval: undefined,
          start_date: undefined,
          end_date: undefined,
          recurrence_day: undefined,
          recurrence_week_day: undefined,
        }));
      }
    }

    // Reset day fields when interval changes
    if (name === 'recurrence_interval') {
      if (value === 'monthly') {
        setFormData(prev => ({
          ...prev,
          recurrence_interval: value,
          recurrence_day: 1,
          recurrence_week_day: undefined,
        }));
      } else if (['weekly', 'bi-weekly'].includes(value)) {
        setFormData(prev => ({
          ...prev,
          recurrence_interval: value,
          recurrence_day: undefined,
          recurrence_week_day: 0,
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
          type="number"
          label="Payment Amount"
          name="amount"
          value={formData.amount}
          onChange={handleInputChange}
          startAdornment={<DollarSign size={18} className="text-gray-400" />}
          step="0.01"
          min="0"
          required
        />

        <Input
          type="date"
          label="Payment Date"
          name="payment_date"
          value={formData.payment_date}
          onChange={handleInputChange}
          startAdornment={<Calendar size={18} className="text-gray-400" />}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Previous Balance</p>
            <p className="text-lg font-medium text-gray-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(formData.previous_balance || 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">New Balance</p>
            <p className="text-lg font-medium text-gray-900">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(formData.new_balance || 0)}
            </p>
          </div>
        </div>

        <Select
          label="Payment Type"
          name="payment_type"
          value={formData.payment_type}
          onChange={handleInputChange}
          options={[
            { value: 'one-time', label: 'One-time Payment' },
            { value: 'recurring', label: 'Recurring Payment' }
          ]}
          required
        />

        {formData.payment_type === 'recurring' && (
          <div className="space-y-4 pt-4 border-t">
            <Select
              label="Recurrence Interval"
              name="recurrence_interval"
              value={formData.recurrence_interval || ''}
              onChange={handleInputChange}
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'bi-weekly', label: 'Bi-weekly' },
                { value: 'monthly', label: 'Monthly' }
              ]}
              required
            />

            <Input
              type="date"
              label="Start Date"
              name="start_date"
              value={formData.start_date || ''}
              onChange={handleInputChange}
              startAdornment={<Calendar size={18} className="text-gray-400" />}
              required
            />

            <Input
              type="date"
              label="End Date (Optional)"
              name="end_date"
              value={formData.end_date || ''}
              onChange={handleInputChange}
              startAdornment={<Calendar size={18} className="text-gray-400" />}
            />

            {formData.recurrence_interval === 'monthly' ? (
              <Input
                type="number"
                label="Day of Month"
                name="recurrence_day"
                value={formData.recurrence_day || ''}
                onChange={handleInputChange}
                min={1}
                max={31}
                required
              />
            ) : formData.recurrence_interval && ['weekly', 'bi-weekly'].includes(formData.recurrence_interval) ? (
              <Select
                label="Day of Week"
                name="recurrence_week_day"
                value={formData.recurrence_week_day?.toString() || ''}
                onChange={e => handleInputChange({
                  ...e,
                  target: { ...e.target, value: parseInt(e.target.value), name: 'recurrence_week_day' }
                })}
                options={[
                  { value: '0', label: 'Sunday' },
                  { value: '1', label: 'Monday' },
                  { value: '2', label: 'Tuesday' },
                  { value: '3', label: 'Wednesday' },
                  { value: '4', label: 'Thursday' },
                  { value: '5', label: 'Friday' },
                  { value: '6', label: 'Saturday' }
                ]}
                required
              />
            ) : null}
          </div>
        )}
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
          Make Payment
        </Button>
      </div>
    </form>
  );
};

export default CreditCardPaymentForm;