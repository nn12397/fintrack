import React, { useEffect, useState } from 'react';
import { getSpendingBudget, calculateRecommendedSpending, createSpendingBudget } from '../services/budget-service';
import type { SpendingBudget } from '../types';
import { AlertTriangle, PiggyBank, Calculator, Plus } from 'lucide-react';

const BudgetPage: React.FC = () => {
  const [budget, setBudget] = useState<SpendingBudget | null>(null);
  const [recommendation, setRecommendation] = useState<{
    spending: number;
    debt_payment: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [budgetData, recommendationData] = await Promise.all([
          getSpendingBudget(),
          calculateRecommendedSpending()
        ]);
        setBudget(budgetData);
        setRecommendation(recommendationData);
      } catch (err: any) {
        setError(err.message || 'Failed to load budget information');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center text-red-500">
        <AlertTriangle className="mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleCreateBudget = async () => {
    try {
      if (recommendation) {
        const newBudget = await createSpendingBudget({
          amount: recommendation.spending,
          frequency: 'monthly',
          is_auto_calculated: true
        });
        setBudget(newBudget);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create budget');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Spending Budget</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Budget */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Current Budget</h2>
              <PiggyBank className="text-blue-500 h-6 w-6" />
            </div>

            {budget ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Monthly Spending Limit</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(budget.amount)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Frequency</p>
                    <p className="text-lg font-medium text-gray-900">
                      {budget.frequency.charAt(0).toUpperCase() + budget.frequency.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Auto-calculated</p>
                    <p className="text-lg font-medium text-gray-900">
                      {budget.is_auto_calculated ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No budget set yet</p>
                <button
                  onClick={handleCreateBudget}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Budget
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Budget */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recommended Budget</h2>
              <Calculator className="text-green-500 h-6 w-6" />
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500">Recommended Monthly Spending</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(recommendation?.spending || 0)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Recommended Debt Payment</p>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(recommendation?.debt_payment || 0)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  This recommendation is based on your income, existing bills, and current debt levels.
                  Adjusting your spending to match these recommendations can help you achieve your financial goals faster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;