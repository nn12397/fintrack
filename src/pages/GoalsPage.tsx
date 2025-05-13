import React, { useEffect, useState } from 'react';
import { getPurchaseGoals } from '../services/goals-service';
import type { PurchaseGoal } from '../types';
import { AlertTriangle, Target, Clock } from 'lucide-react';
import { format } from 'date-fns';

const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<PurchaseGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getPurchaseGoals();
        setGoals(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load purchase goals');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Goals</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{goal.name}</h2>
                <Target className="text-blue-500" />
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Progress</p>
                  <div className="mt-1">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>{formatCurrency(goal.current_amount)}</span>
                      <span>{formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {goal.progress?.toFixed(1)}% Complete
                    </p>
                  </div>
                </div>

                {goal.target_date && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Target Date</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(goal.target_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">Remaining</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(goal.target_amount - goal.current_amount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoalsPage;