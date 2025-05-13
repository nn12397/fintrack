import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/Card';
import { Calendar, AlertTriangle } from 'lucide-react';
import { getBillsByDateRange } from '../../services/bill-service';
import { format, addDays, isToday, isPast, isFuture } from 'date-fns';
import type { Bill } from '../../types';
import Button from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';

const UpcomingBills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBills = async () => {
      const today = new Date();
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(addDays(today, 30), 'yyyy-MM-dd');

      try {
        setIsLoading(true);
        const data = await getBillsByDateRange(startDate, endDate);
        setBills(data);
      } catch (err: any) {
        if (err.message === 'User not authenticated') {
          navigate('/login');
          return;
        }
        setError(err.message || 'Failed to load upcoming bills');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBills();
  }, [navigate]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Upcoming Bills</h2>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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

  if (bills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-800">Upcoming Bills</h2>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No upcoming bills</h3>
          <p className="text-gray-500 mb-4">Add your bills to track upcoming payments</p>
          <Link to="/bills/new">
            <Button variant="primary">Add Bill</Button>
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

  const getBillStatusClass = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return 'text-red-500';
    if (isToday(date)) return 'text-yellow-500';
    return 'text-green-500';
  };

  const totalUpcomingAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Upcoming Bills</h2>
        <Link to="/bills">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bills.slice(0, 5).map((bill) => {
            const dueDate = new Date(bill.due_date);
            const statusClass = getBillStatusClass(bill.due_date);
            
            return (
              <div key={bill.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: bill.category?.color || '#9CA3AF' }}
                  ></div>
                  <div>
                    <h3 className="font-medium text-gray-900">{bill.name}</h3>
                    <p className="text-xs text-gray-500">{bill.category?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(bill.amount)}</p>
                  <p className={`text-xs ${statusClass}`}>
                    {format(dueDate, 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="w-full flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Total Upcoming:</span>
          <span className="font-medium text-gray-900">{formatCurrency(totalUpcomingAmount)}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default UpcomingBills;