import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, DollarSign, CreditCard, FileText } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import type { SavingsPayment, SavingsAccount } from '../../types';

interface SavingsPaymentFormProps {
  accounts: SavingsAccount[];
  payment?: SavingsPayment | null;
  onSubmit: (payment: Omit<SavingsPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const SavingsPaymentForm: React.FC<SavingsPaymentFormProps> = ({
  accounts,
  payment,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Omit<SavingsPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
    savings_id: payment?.savings_id || accounts[0]?.id || '',
    amount: payment?.amount || 0,
    payment_type: payment?.payment_type || 'deposit',
    payment_date: payment?.payment_date || format(new Date(), 'yyyy-MM-dd'),
    payment_method: payment?.payment_method || 'bank_transfer',
    notes: payment?.notes || null,
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.savings_id) {
      setError('Please select a savings account');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!formData.payment_date) {
      setError('Please select a payment date');
      return;
    }

    try {
      await onSubmit({
        savings_id: formData.savings_id,
        amount: formData.amount,
        payment_date: formData.payment_date,
        payment_type: formData.payment_type,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save payment');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Card className="p-6">
        <div className="space-y-6">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Savings Account
            </label>
            <Select
              value={formData.savings_id}
              onChange={(e) => setFormData(prev => ({ ...prev, savings_id: e.target.value }))}
              className="w-full"
            >
              <option value="">Select an account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(account.current_balance)}
                </option>
              ))}
            </Select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                step="0.01"
                min="0"
                className="pl-10"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <Select
              value={formData.payment_type}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_type: e.target.value as 'deposit' | 'withdrawal' }))}
              className="w-full"
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </Select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CreditCard className="h-5 w-5 text-gray-400" />
              </div>
              <Select
                value={formData.payment_method}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as 'cash' | 'bank_transfer' | 'debit_card' | 'direct_deposit' }))}
                className="w-full pl-10"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="debit_card">Debit Card</option>
                <option value="direct_deposit">Direct Deposit</option>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value || null }))}
                className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Add any additional notes..."
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end space-x-4">
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
          {payment ? 'Update Payment' : 'Add Payment'}
        </Button>
      </div>
    </form>
  );
};

export default SavingsPaymentForm;
