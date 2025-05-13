import React, { useState } from 'react';
import { CreditCard } from '../../types';
import { Card } from '../ui/Card';
import { CreditCard as CreditCardIcon, ChevronDown } from 'lucide-react';

interface CreditCardSummaryProps {
  creditCards: CreditCard[];
}

type SortOption = {
  label: string;
  value: string;
  sortFn: (a: CreditCard, b: CreditCard) => number;
};

const CreditCardSummary: React.FC<CreditCardSummaryProps> = ({ creditCards }) => {
  const [sortBy, setSortBy] = useState<string>('balance-high');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateUtilization = (balance: number, limit: number) => {
    if (limit === 0) return 0;
    return (balance / limit) * 100;
  };

  const sortOptions: SortOption[] = [
    {
      label: 'Highest Balance',
      value: 'balance-high',
      sortFn: (a, b) => b.current_balance - a.current_balance
    },
    {
      label: 'Lowest Balance',
      value: 'balance-low',
      sortFn: (a, b) => a.current_balance - b.current_balance
    },
    {
      label: 'Highest Utilization',
      value: 'utilization-high',
      sortFn: (a, b) => calculateUtilization(b.current_balance, b.credit_limit) - calculateUtilization(a.current_balance, a.credit_limit)
    },
    {
      label: 'Lowest Utilization',
      value: 'utilization-low',
      sortFn: (a, b) => calculateUtilization(a.current_balance, a.credit_limit) - calculateUtilization(b.current_balance, b.credit_limit)
    },
    {
      label: 'Highest Credit Limit',
      value: 'limit-high',
      sortFn: (a, b) => b.credit_limit - a.credit_limit
    },
    {
      label: 'Lowest Credit Limit',
      value: 'limit-low',
      sortFn: (a, b) => a.credit_limit - b.credit_limit
    }
  ];

  const totalAvailableCredit = creditCards.reduce((sum, card) => sum + card.credit_limit, 0);
  const totalCurrentBalance = creditCards.reduce((sum, card) => sum + card.current_balance, 0);
  const totalUtilization = calculateUtilization(totalCurrentBalance, totalAvailableCredit);

  const selectedSort = sortOptions.find(option => option.value === sortBy) || sortOptions[0];
  const sortedCards = [...creditCards].sort(selectedSort.sortFn);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Summary Section */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Available Credit</h3>
            <p className="text-2xl font-semibold text-green-600">
              {formatCurrency(totalAvailableCredit)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Current Balance</h3>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(totalCurrentBalance)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Credit Utilization</h3>
            <p className="text-2xl font-semibold" style={{ 
              color: totalUtilization > 30 ? '#DC2626' : '#059669'
            }}>
              {totalUtilization.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex justify-end">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-2 bg-white border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>Sort by: {selectedSort.label}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      option.value === sortBy 
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Credit Cards List */}
        <div className="space-y-2">
          {sortedCards.map((card) => {
            const utilization = calculateUtilization(card.current_balance, card.credit_limit);
            return (
              <div 
                key={card.id} 
                className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <CreditCardIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">{card.name}</h4>
                    <p className="text-sm text-gray-500">Limit: {formatCurrency(card.credit_limit)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatCurrency(card.current_balance)}
                  </p>
                  <p 
                    className="text-sm" 
                    style={{ color: utilization > 30 ? '#DC2626' : '#059669' }}
                  >
                    {utilization.toFixed(1)}% utilized
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default CreditCardSummary;
