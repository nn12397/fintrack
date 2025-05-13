import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { CreditCard, Receipt, DollarSign, PiggyBank, AlertTriangle } from 'lucide-react';
import { calculateFinancialSummary } from '../../services/budget-service';
import type { FinancialSummary } from '../../types';
import { useNavigate } from 'react-router-dom';

const FinancialSummaryComponent: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const data = await calculateFinancialSummary();
        if (data === null) {
          navigate('/login');
          return;
        }
        setSummary(data);
      } catch (err: any) {
        if (err.message === 'User not authenticated') {
          navigate('/login');
          return;
        }
        setError(err.message || 'Failed to load financial summary');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [navigate]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center text-red-500">
            <AlertTriangle className="mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDtiRatioStatus = (ratio: number) => {
    if (ratio <= 0.3) return 'text-green-500';
    if (ratio <= 0.4) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-gray-800">Financial Summary</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Monthly Income</h3>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.income)}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Monthly Bills</h3>
              <Receipt className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_bills)}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Debt</h3>
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total_debt)}</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-500">Available Income</h3>
              <PiggyBank className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.available_income)}</p>
          </div>
        </div>

        <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-500">Debt-to-Income Ratio</h3>
          </div>
          <div className="flex items-end gap-2">
            <p className={`text-2xl font-bold ${getDtiRatioStatus(summary.debt_to_income_ratio)}`}>
              {(summary.debt_to_income_ratio * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mb-1">
              {summary.debt_to_income_ratio <= 0.3
                ? 'Healthy'
                : summary.debt_to_income_ratio <= 0.4
                ? 'Moderate'
                : 'High'}
            </p>
          </div>
          <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getDtiRatioStatus(summary.debt_to_income_ratio)}`}
              style={{ width: `${Math.min(summary.debt_to_income_ratio * 100, 100)}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Debt-to-income ratio measures your monthly debt payments compared to your income.
            Generally, a DTI ratio of 30% or less is considered healthy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryComponent;