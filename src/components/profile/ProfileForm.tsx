import React, { useState } from 'react';
import { format, getDay, parseISO } from 'date-fns';
import { DollarSign, Calendar } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import type { UserProfile } from '../../types';

interface ProfileFormProps {
  profile: UserProfile | null;
  onSubmit: (data: Partial<UserProfile>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    income_amount: profile?.income_amount || 0,
    income_frequency: profile?.income_frequency || 'monthly',
    income_day: profile?.income_day || null,
    income_start_date: profile?.income_start_date || format(new Date(), 'yyyy-MM-dd'),
    user_entry_next_paydate: profile?.user_entry_next_paydate || null,
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.income_amount || formData.income_amount <= 0) {
        throw new Error('Income amount must be greater than 0');
      }

      if (formData.income_frequency === 'specific-date' && !formData.income_day) {
        throw new Error('Please select a day of the month for specific date income');
      }

      if (formData.income_frequency === 'monthly' && (!formData.income_day || formData.income_day < 1 || formData.income_day > 31)) {
        throw new Error('Please select a valid day of the month (1-31)');
      }

      if (formData.income_frequency === 'bi-weekly' && !formData.user_entry_next_paydate) {
        throw new Error('Please select your next pay date for bi-weekly income');
      }

      if (!formData.income_start_date) {
        throw new Error('Income start date is required');
      }

      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: value,
        };

        // Handle bi-weekly frequency
        if (name === 'user_entry_next_paydate' && value) {
          // Create date in local timezone by appending T00:00:00
          const date = parseISO(value + 'T00:00:00');
          const dayOfWeek = date.getDay();
          newData.income_day = dayOfWeek;
          newData.user_entry_next_paydate = format(date, 'yyyy-MM-dd');
        }

        // Reset income_day when changing frequency
        if (name === 'income_frequency') {
          if (value !== 'specific-date' && value !== 'monthly' && value !== 'bi-weekly') {
            newData.income_day = null;
          }
          if (value !== 'bi-weekly') {
            newData.user_entry_next_paydate = null;
          }
        }

        return newData;
      });
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
          label="Income Amount"
          name="income_amount"
          value={formData.income_amount}
          onChange={handleInputChange}
          startAdornment={<DollarSign size={18} className="text-gray-400" />}
          step="0.01"
          min="0"
          required
        />

        <Select
          label="Income Frequency"
          name="income_frequency"
          value={formData.income_frequency}
          onChange={handleInputChange}
          required
          startAdornment={<Calendar size={18} className="text-gray-400" />}
        >
          <option value="weekly">Weekly</option>
          <option value="bi-weekly">Bi-weekly</option>
          <option value="bi-monthly">Bi-monthly (15th & Last Day)</option>
          <option value="monthly">Monthly</option>
          <option value="specific-date">Specific Date</option>
        </Select>

        {formData.income_frequency === 'specific-date' && (
          <Input
            type="number"
            label="Day of Month"
            name="income_day"
            value={formData.income_day || ''}
            onChange={handleInputChange}
            min="1"
            max="31"
            required
            startAdornment={<Calendar size={18} className="text-gray-400" />}
            helperText="Enter a day between 1 and 31"
          />
        )}

        {formData.income_frequency === 'monthly' && (
          <Input
            type="number"
            label="Day of Month"
            name="income_day"
            value={formData.income_day || ''}
            onChange={handleInputChange}
            min="1"
            max="31"
            required
            startAdornment={<Calendar size={18} className="text-gray-400" />}
            helperText="Enter a day between 1 and 31"
          />
        )}

        {formData.income_frequency === 'bi-weekly' && (
          <Input
            type="date"
            label="Next Pay Date"
            name="user_entry_next_paydate"
            value={formData.user_entry_next_paydate || ''}
            onChange={handleInputChange}
            startAdornment={<Calendar size={18} className="text-gray-400" />}
            required
            helperText="Select your next pay date"
          />
        )}

        <Input
          type="date"
          label="Income Start Date"
          name="income_start_date"
          value={formData.income_start_date || ''}
          onChange={handleInputChange}
          startAdornment={<Calendar size={18} className="text-gray-400" />}
          required
          helperText="Select when your income payments begin"
        />
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
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default ProfileForm;