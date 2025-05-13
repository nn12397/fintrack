import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';
import { CreditCard, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { getCreditCards } from '../../services/credit-card-service';
import type { CreditCard as CreditCardType } from '../../types';
import Button from '../ui/Button';
import { Link } from 'react-router-dom';

const CreditCardSummary: React.FC = () => {
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCreditCards = async () => {
      try {
        setIsLoading(true);
        const data = await getCreditCards();
        setCreditCards(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load credit cards');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditCards();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Credit Cards</h2>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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

  if (creditCards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Credit Cards</h2>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No credit cards found</h3>
          <p className="text-gray-500 mb-4">Add your credit cards to track balances and plan payoffs</p>
          <Link to="/credit-cards/new">
            <Button variant="primary">Add Credit Card</Button>
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

  const getUtilizationColor = (utilization: number) => {
    if (utilization <= 30) return 'bg-green-500';
    if (utilization <= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const totalBalance = creditCards.reduce((sum, card) => sum + card.current_balance, 0);
  const totalLimit = creditCards.reduce((sum, card) => sum + card.credit_limit, 0);
  const avgUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Credit Cards</h2>
        <Link to="/credit-cards">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {creditCards.slice(0, 3).map((card) => (
            <div key={card.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-900">{card.name}</h3>
                <span className="text-sm font-medium text-gray-500">
                  {formatCurrency(card.current_balance)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getUtilizationColor(card.utilization || 0)}`}
                  style={{ width: `${Math.min(card.utilization || 0, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Utilization: {card.utilization?.toFixed(1)}%</span>
                <span>Limit: {formatCurrency(card.credit_limit)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="w-full">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Total Balance:</span>
            <span className="font-medium text-gray-900">{formatCurrency(totalBalance)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Average Utilization:</span>
            <div className="flex items-center">
              {avgUtilization > 30 ? (
                <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span className={avgUtilization > 30 ? 'text-red-500' : 'text-green-500'}>
                {avgUtilization.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CreditCardSummary;