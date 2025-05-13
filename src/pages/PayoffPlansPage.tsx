import React, { useEffect, useState } from 'react';
import { getPayoffPlans } from '../services/payoff-service';
import type { PayoffPlan } from '../types';
import { AlertTriangle, TrendingDown, Check } from 'lucide-react';

const PayoffPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<PayoffPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getPayoffPlans();
        setPlans(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load payoff plans');
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
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
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

  const formatStrategy = (strategy: string) => {
    switch (strategy) {
      case 'highest_interest':
        return 'Highest Interest First';
      case 'lowest_balance':
        return 'Snowball (Lowest Balance First)';
      case 'highest_balance':
        return 'Highest Balance First';
      case 'custom':
        return 'Custom Order';
      default:
        return strategy;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payoff Plans</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{plan.name}</h2>
                <span className="text-sm text-gray-500">
                  {formatStrategy(plan.strategy)}
                </span>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(plan.monthly_payment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time to Payoff</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {plan.payoff_timeline?.total_months || 0} months
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Total Interest</p>
                  <div className="flex items-center">
                    <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(plan.payoff_timeline?.total_interest || 0)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Cards in Plan</p>
                  <div className="space-y-2">
                    {plan.selected_cards?.map((card) => {
                      const cardDetail = plan.payoff_timeline?.cards.find(
                        (c) => c.card_id === card.id
                      );
                      return (
                        <div
                          key={card.id}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded"
                        >
                          <div className="flex items-center">
                            {cardDetail?.months_to_payoff === 0 ? (
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                            )}
                            <span className="text-sm font-medium text-gray-700">
                              {card.name}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {cardDetail?.months_to_payoff || 0} months left
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PayoffPlansPage;