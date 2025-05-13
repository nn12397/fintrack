import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, DollarSign, Hash, Clock, CalendarRange, FileText } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import type { Bill, Category, CreditCard, DebitCard } from '../../types';

interface BillFormProps {
  bill?: Bill;
  categories: Category[];
  creditCards: CreditCard[];
  debitCards: DebitCard[];
  onSubmit: (bill: Partial<Bill>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BillForm: React.FC<BillFormProps> = ({
  bill,
  categories,
  creditCards,
  debitCards,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Bill>>({
    name: '',
    amount: undefined,
    due_date: format(new Date(), 'yyyy-MM-dd'),
    category_id: '',
    bill_type: 'one-time',
    frequency: 'monthly',
    is_autopay: false,
    card_id: null,
    notes: '',
    recurrence_interval: undefined,
    start_date: undefined,
    end_date: undefined,
    recurrence_day: undefined,
    recurrence_week_day: undefined,
    ...bill,
  });

  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'direct' | 'credit' | 'debit'>(() => {
    if (bill?.card_id) {
      if (creditCards.some(c => c.id === bill.card_id)) {
        return 'credit';
      } else if (debitCards.some(d => d.id === bill.card_id)) {
        return 'debit';
      }
    }
    return 'direct';
  });

  useEffect(() => {
    if (bill) {
      setFormData({
        ...bill,
        due_date: format(new Date(bill.due_date), 'yyyy-MM-dd'),
        start_date: bill.start_date ? format(new Date(bill.start_date), 'yyyy-MM-dd') : undefined,
        end_date: bill.end_date ? format(new Date(bill.end_date), 'yyyy-MM-dd') : undefined,
      });
      
      if (bill.card_id) {
        if (creditCards.some(c => c.id === bill.card_id)) {
          setPaymentMethod('credit');
        } else if (debitCards.some(d => d.id === bill.card_id)) {
          setPaymentMethod('debit');
        } else {
          setPaymentMethod('direct');
        }
      } else {
        setPaymentMethod('direct');
      }
    }
  }, [bill, creditCards, debitCards]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.name?.trim()) {
        throw new Error('Bill name is required');
      }
      if (!formData.amount || formData.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (!formData.category_id) {
        throw new Error('Category is required');
      }

      if (formData.bill_type === 'recurring') {
        if (!formData.recurrence_interval) {
          throw new Error('Recurrence interval is required for recurring bills');
        }
        if (!formData.start_date) {
          throw new Error('Start date is required for recurring bills');
        }
        
        if (['monthly', 'quarterly', 'yearly'].includes(formData.recurrence_interval)) {
          if (!formData.recurrence_day || formData.recurrence_day < 1 || formData.recurrence_day > 31) {
            throw new Error('Please select a valid day of the month (1-31)');
          }
        } else if (['weekly', 'bi-weekly'].includes(formData.recurrence_interval)) {
          if (formData.recurrence_week_day === undefined || formData.recurrence_week_day < 0 || formData.recurrence_week_day > 6) {
            throw new Error('Please select a valid day of the week');
          }
        }
      }

      if (paymentMethod === 'credit' || paymentMethod === 'debit') {
        if (!formData.card_id) {
          throw new Error(`Please select a ${paymentMethod} card`);
        }
      }

      const submitData = {
        ...formData,
        card_id: paymentMethod === 'direct' ? null : formData.card_id,
      };

      const { category, card, ...finalData } = submitData;
      await onSubmit(finalData);
    } catch (err: any) {
      setError(err.message || 'Failed to save bill');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : parseFloat(value)
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
          card_id: null,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          card_id: null,
        }));
      }
    }

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

    if (name === 'card_id') {
      setFormData(prev => ({
        ...prev,
        card_id: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Bill Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            startAdornment={<FileText className="text-primary-500" />}
            className="bg-white"
          />

          <Input
            type="number"
            label="Amount"
            name="amount"
            value={formData.amount ?? ''}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            startAdornment={<DollarSign className="text-accent-500" />}
            className="bg-white"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Select
            label="Category"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            required
            startAdornment={<Hash className="text-primary-500" />}
            className="bg-white"
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            label="Bill Type"
            name="bill_type"
            value={formData.bill_type}
            onChange={handleInputChange}
            required
            startAdornment={<Clock className="text-accent-500" />}
            className="bg-white"
          >
            <option value="one-time">One-time</option>
            <option value="recurring">Recurring</option>
          </Select>
        </div>
      </div>

      {formData.bill_type === 'recurring' && (
        <div className="bg-gray-50 p-6 rounded-lg space-y-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-4">Recurrence Settings</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Select
              label="Recurrence Interval"
              name="recurrence_interval"
              value={formData.recurrence_interval}
              onChange={handleInputChange}
              required
              startAdornment={<CalendarRange className="text-primary-500" />}
              className="bg-white"
            >
              <option value="">Select interval</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </Select>

            {['monthly', 'quarterly', 'yearly'].includes(formData.recurrence_interval || '') && (
              <Input
                type="number"
                label="Day of Month"
                name="recurrence_day"
                value={formData.recurrence_day}
                onChange={handleInputChange}
                required
                min="1"
                max="31"
                startAdornment={<Calendar className="text-accent-500" />}
                className="bg-white"
              />
            )}

            {['weekly', 'bi-weekly'].includes(formData.recurrence_interval || '') && (
              <Select
                label="Day of Week"
                name="recurrence_week_day"
                value={formData.recurrence_week_day}
                onChange={handleInputChange}
                required
                startAdornment={<Calendar className="text-accent-500" />}
                className="bg-white"
              >
                <option value="">Select day</option>
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </Select>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              type="date"
              label="Start Date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              required
              startAdornment={<Calendar className="text-primary-500" />}
              className="bg-white"
            />

            <Input
              type="date"
              label="End Date (Optional)"
              name="end_date"
              value={formData.end_date}
              onChange={handleInputChange}
              startAdornment={<Calendar className="text-accent-500" />}
              className="bg-white"
            />
          </div>
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-lg space-y-6">
        <h3 className="text-lg font-semibold text-primary-900 mb-4">Payment Settings</h3>

        <Select
          label="Payment Method"
          name="payment_method"
          value={paymentMethod}
          onChange={(e) => {
            setPaymentMethod(e.target.value as 'direct' | 'credit' | 'debit');
            setFormData(prev => ({
              ...prev,
              card_id: null
            }));
          }}
          startAdornment={<DollarSign className="text-primary-500" />}
          className="bg-white"
        >
          <option value="direct">Direct Payment</option>
          <option value="credit">Credit Card</option>
          <option value="debit">Debit Card</option>
        </Select>

        {paymentMethod === 'credit' && (
          <Select
            label="Credit Card"
            name="card_id"
            value={formData.card_id || ''}
            onChange={handleInputChange}
            required
            startAdornment={<DollarSign className="text-accent-500" />}
            className="bg-white"
          >
            <option value="">Select a credit card</option>
            {creditCards.map(card => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </Select>
        )}

        {paymentMethod === 'debit' && (
          <Select
            label="Debit Card"
            name="card_id"
            value={formData.card_id || ''}
            onChange={handleInputChange}
            required
            startAdornment={<DollarSign className="text-accent-500" />}
            className="bg-white"
          >
            <option value="">Select a debit card</option>
            {debitCards.map(card => (
              <option key={card.id} value={card.id}>
                {card.name}
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Notes (Optional)"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          startAdornment={<FileText className="text-primary-500" />}
          className="bg-white"
        />

        <div className="flex items-center space-x-2 bg-white p-3 rounded-lg">
          <input
            type="checkbox"
            id="is_autopay"
            name="is_autopay"
            checked={formData.is_autopay}
            onChange={handleInputChange}
            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="is_autopay" className="text-sm font-medium text-gray-700">
            Enable Auto-pay
          </label>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6">
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
          {bill ? 'Update Bill' : 'Create Bill'}
        </Button>
      </div>
    </form>
  );
};

export default BillForm;