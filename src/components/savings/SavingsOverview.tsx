import React from 'react';
import { format, parseISO } from 'date-fns';
import { PiggyBank, Target, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../ui/Card';
import type { SavingsAccount, SavingsPlan, SavingsPayment } from '../../types';

interface SavingsOverviewProps {
  accounts: SavingsAccount[];
  plans: SavingsPlan[];
  recentPayments: SavingsPayment[];
}

const SavingsOverview: React.FC<SavingsOverviewProps> = ({
  accounts,
  plans,
  recentPayments,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalSavings = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  
  const monthlyGoal = plans.reduce((sum, plan) => {
    const baseAmount = plan.payment_amount;
    switch (plan.payment_frequency) {
      case 'weekly':
        return sum + (baseAmount * 4); // 4 weeks per month
      case 'bi-weekly':
        return sum + (baseAmount * 2); // 2 bi-weekly periods per month
      case 'bi-monthly':
        return sum + (baseAmount * 2); // 2 payments per month
      case 'monthly':
      default:
        return sum + baseAmount;
    }
  }, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Savings */}
      <Card className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-[#1e293b] p-3 rounded-xl">
            <PiggyBank className="h-6 w-6 text-[#f97316]" />
          </div>
          <div className="text-right">
            <p className="text-base text-gray-600">Total Savings</p>
            <p className="text-2xl font-bold text-[#1e293b]">{formatCurrency(totalSavings)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</span>
        </div>
      </Card>

      {/* Monthly Goal */}
      <Card className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-[#1e293b] p-3 rounded-xl">
            <Target className="h-6 w-6 text-[#f97316]" />
          </div>
          <div className="text-right">
            <p className="text-base text-gray-600">Monthly Goal</p>
            <p className="text-2xl font-bold text-[#1e293b]">{formatCurrency(monthlyGoal)}</p>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">From {plans.length} active plan{plans.length !== 1 ? 's' : ''}</span>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-[#1e293b] p-3 rounded-xl">
            <Calendar className="h-6 w-6 text-[#f97316]" />
          </div>
          <div className="text-right">
            <p className="text-base text-gray-600">Recent Activity</p>
            <p className="text-2xl font-bold text-[#1e293b]">
              {recentPayments.length} transaction{recentPayments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {recentPayments.slice(0, 2).map(payment => (
            <div key={payment.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {payment.payment_type === 'deposit' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className="text-gray-600">
                  {format(parseISO(payment.payment_date), 'MMM d')}
                </span>
              </div>
              <span className={payment.payment_type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                {payment.payment_type === 'deposit' ? '+' : '-'}{formatCurrency(payment.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SavingsOverview;