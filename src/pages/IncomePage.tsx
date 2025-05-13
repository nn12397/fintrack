import React, { useState, useEffect } from 'react';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import { AlertTriangle, DollarSign, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { getPaychecks } from '../services/paycheck-service';
import { getUserProfile } from '../services/profile-service';
import { getBills } from '../services/bill-service';
import { calculateMonthlyIncome } from '../services/income-service';
import type { Paycheck, UserProfile, Bill } from '../types';
import { useNavigate } from 'react-router-dom';

const IncomePage: React.FC = () => {
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPastPaychecks, setShowPastPaychecks] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [paychecksData, profileData, billsData] = await Promise.all([
          getPaychecks(),
          getUserProfile(),
          getBills()
        ]);

        if (!profileData) {
          navigate('/login');
          return;
        }

        setPaychecks(paychecksData);
        setProfile(profileData);
        setBills(billsData);
      } catch (err: any) {
        if (err.message === 'User not authenticated') {
          navigate('/login');
          return;
        }
        setError(err.message || 'Failed to load income data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const calculateMonthlyTotals = () => {
    const monthlyIncome = profile ? calculateMonthlyIncome(profile.income_amount, profile.income_frequency) : 0;
    const monthlyBills = bills.reduce((total, bill) => {
      if (bill.frequency === 'monthly') {
        return total + (bill.amount || 0);
      } else if (bill.frequency === 'bi-weekly') {
        return total + ((bill.amount || 0) * 26 / 12);
      } else if (bill.frequency === 'weekly') {
        return total + ((bill.amount || 0) * 52 / 12);
      }
      return total;
    }, 0);

    const availableBalance = monthlyIncome - monthlyBills;
    const debtToIncomeRatio = (monthlyBills / monthlyIncome) * 100;

    return {
      monthlyIncome,
      monthlyBills,
      availableBalance,
      debtToIncomeRatio
    };
  };

  const { monthlyIncome, monthlyBills, availableBalance, debtToIncomeRatio } = calculateMonthlyTotals();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
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

  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Weekly';
      case 'bi-weekly':
        return 'Bi-weekly';
      case 'bi-monthly':
        return 'Bi-monthly';
      case 'monthly':
        return 'Monthly';
      case 'specific-date':
        return 'Specific Date';
      default:
        return frequency;
    }
  };

  const getPaycheckStatus = (paycheck: Paycheck) => {
    const today = new Date();
    const paymentDate = parseISO(paycheck.payment_date);
    
    if (isToday(paymentDate)) {
      return {
        label: 'Today',
        className: 'bg-yellow-100 text-yellow-800'
      };
    }
    
    if (isAfter(paymentDate, today)) {
      const daysUntil = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        label: `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
        className: 'bg-blue-100 text-blue-800'
      };
    }
    
    return null;
  };

  const sortedPaychecks = [...paychecks].sort((a, b) => 
    parseISO(a.payment_date).getTime() - parseISO(b.payment_date).getTime()
  );

  const today = new Date();
  const upcomingPaychecks = sortedPaychecks.filter(p => 
    isAfter(parseISO(p.payment_date), today) || isToday(parseISO(p.payment_date))
  );
  const pastPaychecks = sortedPaychecks.filter(p => 
    isBefore(parseISO(p.payment_date), today) && !isToday(parseISO(p.payment_date))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Income</h1>
      </div>

      {/* Debt to Income Ratio Container */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Monthly Income</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyIncome)}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Monthly Bills</h3>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyBills)}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(availableBalance)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Debt to Income Ratio</h3>
            <span className="text-sm font-medium text-gray-700">
              {debtToIncomeRatio.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                debtToIncomeRatio > 50 ? 'bg-red-500' : 
                debtToIncomeRatio > 30 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(debtToIncomeRatio, 100)}%` }}
            ></div>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            {debtToIncomeRatio > 50 ? (
              <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
            )}
            <span>
              {debtToIncomeRatio > 50 
                ? 'High debt-to-income ratio. Consider reducing expenses.'
                : debtToIncomeRatio > 30
                ? 'Moderate debt-to-income ratio.'
                : 'Healthy debt-to-income ratio.'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Income Details</h2>
              <p className="text-sm text-gray-500">
                {formatCurrency(profile?.income_amount || 0)} {profile?.income_frequency}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">
                Started {profile?.income_start_date ? format(parseISO(profile.income_start_date), 'MMM d, yyyy') : 'Not set'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcomingPaychecks.map((paycheck) => {
                  const status = getPaycheckStatus(paycheck);
                  return (
                    <tr key={paycheck.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(parseISO(paycheck.payment_date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(paycheck.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFrequency(paycheck.frequency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {status && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.className}`}>
                            {status.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pastPaychecks.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowPastPaychecks(!showPastPaychecks)}
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                {showPastPaychecks ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Hide Past Paychecks
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show Past Paychecks ({pastPaychecks.length})
                  </>
                )}
              </button>

              {showPastPaychecks && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pastPaychecks.map((paycheck) => (
                        <tr key={paycheck.id} className="bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(parseISO(paycheck.payment_date), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                            {formatCurrency(paycheck.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFrequency(paycheck.frequency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            Past
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IncomePage;