import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';
import { BadgePercent, AlertTriangle, Check, Clock } from 'lucide-react';
import { getPayoffPlans } from '../../services/payoff-service';
import type { PayoffPlan } from '../../types';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';

const PayoffProgress: React.FC = () => {
  const [plans, setPlans] = useState<PayoffPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
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

    fetchPlans();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Payoff Progress</h2>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
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

  if (plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Payoff Progress</h2>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BadgePercent className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No payoff plans</h3>
          <p className="text-gray-500 mb-4">Create a plan to pay off your credit cards</p>
          <Link to="/payoff-plans/new">
            <Button variant="primary">Create Payoff Plan</Button>
          </Link>
        </CardContent>
      </Card>
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
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Payoff Progress</h2>
        <Link to="/payoff-plans">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {plans.slice(0, 2).map((plan) => (
            <div key={plan.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">{plan.name}</h3>
                <span className="text-sm text-gray-500">{formatStrategy(plan.strategy)}</span>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Monthly Payment</span>
                <span className="font-medium text-gray-900">{formatCurrency(plan.monthly_payment)}</span>
              </div>
              
              {plan.payoff_timeline && (
                <>
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Time to payoff</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {plan.payoff_timeline.total_months} months
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Total interest</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(plan.payoff_timeline.total_interest)}
                    </span>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    {plan.selected_cards?.map((card) => {
                      const cardDetail = plan.payoff_timeline?.cards.find(c => c.card_id === card.id);
                      return (
                        <div key={card.id} className="text-xs flex justify-between items-center">
                          <div className="flex items-center">
                            {cardDetail?.months_to_payoff === 0 ? (
                              <Check className="h-3 w-3 text-green-500 mr-1" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
                            )}
                            <span className="text-gray-700">{card.name}</span>
                          </div>
                          <span className="text-gray-500">
                            {cardDetail?.months_to_payoff || 0} months left
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      {plans.length > 2 && (
        <CardFooter className="border-t pt-4">
          <div className="w-full text-center">
            <span className="text-sm text-gray-500">
              {plans.length - 2} more {plans.length - 2 === 1 ? 'plan' : 'plans'} not shown
            </span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default PayoffProgress;