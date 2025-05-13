import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  PiggyBank, 
  Plus, 
  Pencil,
  Building2, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import type { SavingsAccount } from '../../types';

interface SavingsAccountsProps {
  accounts: SavingsAccount[];
  onAddAccount: () => void;
  onEditAccount: (account: SavingsAccount) => void;
}

const SavingsAccounts: React.FC<SavingsAccountsProps> = ({
  accounts,
  onAddAccount,
  onEditAccount,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'financial_institute':
        return <Building2 className="h-6 w-6 text-[#1e293b]" />;
      case 'cash':
        return <Wallet className="h-6 w-6 text-[#1e293b]" />;
      case 'piggy_bank':
        return <PiggyBank className="h-6 w-6 text-[#1e293b]" />;
      default:
        return <PiggyBank className="h-6 w-6 text-[#1e293b]" />;
    }
  };

  const formatAccountType = (type: string) => {
    switch (type) {
      case 'financial_institute':
        return 'Financial Institute';
      case 'cash':
        return 'Cash Savings';
      case 'piggy_bank':
        return 'Piggy Bank';
      default:
        return type;
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
        <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No savings accounts yet</h3>
        <p className="text-gray-500 mb-4">Start saving by adding your first savings account</p>
        <Button
          variant="primary"
          onClick={onAddAccount}
          leftIcon={<Plus size={20} />}
        >
          Add Savings Account
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {accounts.map(account => (
        <Card 
          key={account.id} 
          className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-[#1e293b] p-2 rounded-xl">
                  {getAccountTypeIcon(account.account_type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1e293b]">{account.name}</h3>
                  <p className="text-sm text-gray-600">{formatAccountType(account.account_type)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditAccount(account)}
                  leftIcon={<Pencil size={16} />}
                >
                  Edit
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-[#1e293b]">
                  {formatCurrency(account.current_balance)}
                </p>
              </div>

              {account.target_balance && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Target Balance</span>
                  <span className="font-medium text-[#1e293b]">
                    {formatCurrency(account.target_balance)}
                  </span>
                </div>
              )}

              {account.auto_transfer_enabled && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-medium text-[#1e293b]">Auto-Transfer Settings</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Threshold</span>
                    <span className="font-medium text-[#1e293b]">
                      {formatCurrency(account.auto_transfer_threshold || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transfer Amount</span>
                    <span className="font-medium text-[#1e293b]">
                      {formatCurrency(account.auto_transfer_amount || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SavingsAccounts;