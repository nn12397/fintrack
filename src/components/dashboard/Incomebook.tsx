import React, { useEffect, useState } from 'react';
import { format, addMonths, parseISO, startOfMonth, endOfMonth, isBefore } from 'date-fns';
import { getPaychecks } from '../../services/paycheck-service';
import { getBills } from '../../services/bill-service';
import { getCategories } from '../../services/category-service';
import { getMonthlyBills } from '../../utils/bill-utils';
import { getDebitCards } from '../../services/debit-card-service';
import { getNextPaycheckDate } from '../../services/paycheck-service';
import { getRecentSavingsPayments } from '../../services/savings-payment-service';
import { Bill, Paycheck, Category } from '../../types';
import { Card } from '../ui/Card';
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Switch } from '../ui/Switch';

interface PaycheckPeriod {
  paycheck: Paycheck;
  startDate: Date;
  endDate: Date;
  bills: Bill[];
  savingsPayments: {
    id: string;
    amount: number;
    payment_date: string;
    plan_name: string;
  }[];
  startingBalance: number;
  endingBalance: number;
}

interface IncomebookProps {
  projectedBalance: number | null;
}

const IncomeBook: React.FC<IncomebookProps> = ({ projectedBalance }: IncomebookProps) => {
  const [periods, setPeriods] = useState<PaycheckPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(projectedBalance !== null ? projectedBalance : 0);
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [includeSavings, setIncludeSavings] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState<Set<string>>(new Set());
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [debitCards, setDebitCards] = useState<any[]>([]);
  const [nextPayDate, setNextPayDate] = useState<string | null>(null);
  const [savingsPayments, setSavingsPayments] = useState<any[]>([]);

  const togglePeriod = (periodId: string) => {
    setExpandedPeriods((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(periodId)) {
        newSet.delete(periodId);
      } else {
        newSet.add(periodId);
      }
      return newSet;
    });
  };

  const handleSavingsToggle = (checked: boolean) => {
    setIncludeSavings(checked);
  };

  const toggleBreakdown = (periodId: string) => {
    setShowBreakdown((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(periodId)) {
        newSet.delete(periodId);
      } else {
        newSet.add(periodId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [paychecksData, billsData, categoriesData, debitCardsData, nextPayDateResult, savingsPaymentsData] = await Promise.all([
          getPaychecks(),
          getBills(),
          getCategories(),
          getDebitCards(),
          getNextPaycheckDate(),
          getRecentSavingsPayments()
        ]);

        setPaychecks(paychecksData);
        setBills(billsData);
        setCategories(categoriesData);
        setDebitCards(debitCardsData);
        setNextPayDate(nextPayDateResult);
        setSavingsPayments(savingsPaymentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Use projectedBalance as starting balance if available
  const startingBalance = projectedBalance !== null ? projectedBalance : debitCards.reduce(
    (sum, card) => sum + card.available_balance,
    0
  );

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch all required data in parallel
        const [nextPayDate, debitCards, allBills, allCategories, savingsPayments] = await Promise.all([
          getNextPaycheckDate(),
          getDebitCards(),
          getBills(),
          getCategories(),
          getRecentSavingsPayments(100)
        ]);

        if (!nextPayDate) {
          setError('Next pay date is not available');
          return;
        }

        // Calculate total available funds from debit cards
        const totalAvailableFunds = debitCards.reduce((sum, card) => sum + (card.available_balance || 0), 0);

        // Get monthly bills for current period
        const monthlyBills = getMonthlyBills(allBills, [], allCategories, startOfMonth(today));

        // Filter bills between today and next pay date
        const nextPayDateObj = parseISO(nextPayDate);
        const filteredBills = monthlyBills.filter(bill => {
          const billDate = parseISO(bill.due_date || '');
          return billDate >= today && billDate <= nextPayDateObj;
        });

        // Calculate total bills and remaining balance
        const upcomingBillsTotal = filteredBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
        const remainingAfterBills = totalAvailableFunds - upcomingBillsTotal;
        setCurrentBalance(projectedBalance !== null ? projectedBalance : remainingAfterBills);

        // Get next 6 months of paychecks
        const startDate = new Date();
        const endDate = addMonths(startDate, 6);
        const paychecks = await getPaychecks();
        
        if (!paychecks || paychecks.length === 0) {
          setError('No paychecks found');
          return;
        }

        // Filter paychecks within our 6-month window
        const relevantPaychecks = paychecks.filter(paycheck => {
          if (!paycheck.payment_date) return false;
          const payDate = parseISO(paycheck.payment_date);
          return isBefore(payDate, endDate) && !isBefore(payDate, startDate);
        });

        if (relevantPaychecks.length === 0) {
          setError('No paychecks found in the next 6 months');
          return;
        }

        // Calculate periods between paychecks
        let runningBalance = projectedBalance !== null ? projectedBalance : remainingAfterBills; // Start with the projected balance
        const calculatedPeriods: PaycheckPeriod[] = [];

        for (let i = 0; i < relevantPaychecks.length; i++) {
          const currentPaycheck = relevantPaychecks[i];
          if (!currentPaycheck.payment_date) continue;
          
          const currentPayDate = parseISO(currentPaycheck.payment_date);
          
          // Determine period end date (next paycheck or end of 6 months)
          const nextPaycheck = relevantPaychecks[i + 1];
          const periodEndDate = nextPaycheck && nextPaycheck.payment_date
            ? parseISO(nextPaycheck.payment_date)
            : endDate;

          // Get monthly bills for the current period
          const monthlyBills = getMonthlyBills(
            allBills,
            [],
            allCategories,
            startOfMonth(currentPayDate)
          );

          // Filter bills for this period and sort by due date
          const periodBills = monthlyBills
            .filter(bill => {
              if (!bill.due_date) return false;
              const billDate = parseISO(bill.due_date);
              return billDate >= currentPayDate && billDate < periodEndDate;
            })
            // Remove duplicate credit card payments
            .reduce((unique, bill) => {
              // If it's not a credit card payment, keep it
              if (bill.category?.name !== 'Credit Card') {
                unique.push(bill);
                return unique;
              }

              // Check if we already have a credit card payment with the same amount
              const existingPayment = unique.find(
                (existing: Bill) => 
                  existing.category?.name === 'Credit Card' && 
                  existing.amount === bill.amount &&
                  existing.due_date === bill.due_date
              );

              // If no matching payment found, add this one
              if (!existingPayment) {
                unique.push(bill);
              }

              return unique;
            }, [] as Bill[])
            .sort((a, b) => {
              const dateA = parseISO(a.due_date || '');
              const dateB = parseISO(b.due_date || '');
              return dateA.getTime() - dateB.getTime();
            });

          // Add savings payments for this period if enabled
          const periodSavingsPayments = includeSavings ? savingsPayments
            .filter(payment => {
              if (!payment.payment_date) return false;
              const paymentDate = parseISO(payment.payment_date);
              return paymentDate >= currentPayDate && paymentDate < periodEndDate;
            })
            .map(payment => ({
              id: payment.id,
              amount: payment.amount || 0,
              payment_date: payment.payment_date,
              plan_name: 'Savings Payment' // Simplified since we don't need plan name
            }))
            .sort((a, b) => {
              const dateA = parseISO(a.payment_date);
              const dateB = parseISO(b.payment_date);
              return dateA.getTime() - dateB.getTime();
            }) : [];

          // Add savings to total bills
          const totalSavings = periodSavingsPayments.reduce((sum, payment) => sum + payment.amount, 0);
          const totalBills = periodBills.reduce((sum, bill) => sum + (bill.amount || 0), 0) + totalSavings;

          // Calculate balances
          const startingBalance = runningBalance;
          runningBalance += currentPaycheck.amount || 0;
          runningBalance -= totalBills;

          calculatedPeriods.push({
            paycheck: currentPaycheck,
            startDate: currentPayDate,
            endDate: periodEndDate,
            bills: periodBills,
            savingsPayments: periodSavingsPayments,
            startingBalance: startingBalance,
            endingBalance: runningBalance,
          });
        }

        setPeriods(calculatedPeriods);
      } catch (err) {
        console.error('Error in IncomeBook:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while loading data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [includeSavings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm text-yellow-700">No pay periods found in the next 6 months</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold text-[#1e293b]">6-Month Income Book</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-base text-gray-600">Include Savings Plans:</span>
            <Switch
              checked={includeSavings}
              onCheckedChange={handleSavingsToggle}
              className="data-[state=checked]:bg-[#f97316]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-base text-gray-600">Starting Balance (after current bills):</span>
            <span className="text-xl font-semibold text-[#f97316]">
              {formatCurrency(currentBalance)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {periods.map((period) => (
          <Card key={period.paycheck.id} className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
            <div className="space-y-4">
              <div 
                className="flex justify-between items-center border-b pb-2 cursor-pointer"
                onClick={() => togglePeriod(period.paycheck.id)}
              >
                <div>
                  <h3 className="text-lg font-bold text-[#1e293b]">
                    Paycheck {format(period.startDate, 'MMM d, yyyy')}
                  </h3>
                  <p className="text-base text-gray-600">
                    Period: {format(period.startDate, 'MMM d')} - {format(period.endDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#1e293b]">
                      {formatCurrency(period.paycheck.amount || 0)}
                    </p>
                    <p className="text-base text-gray-600">
                      Starting Balance: {formatCurrency(period.startingBalance)}
                    </p>
                  </div>
                  {expandedPeriods.has(period.paycheck.id) ? (
                    <ChevronUp className="h-6 w-6 text-[#f97316]" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-[#f97316]" />
                  )}
                </div>
              </div>

              {/* Always show total bills and ending balance */}
              <div className="flex justify-between items-center text-base">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Total Bills:</span>
                    <span className="text-[#f97316] font-semibold">
                      {formatCurrency(period.bills.reduce((sum, bill) => sum + (bill.amount || 0), 0))}
                    </span>
                  </div>
                  {includeSavings && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Total Savings:</span>
                      <span className="text-blue-600 font-semibold">
                        {formatCurrency(period.savingsPayments.reduce((sum, payment) => sum + payment.amount, 0))}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Ending Balance:</span>
                  <span className={`font-semibold ${
                    period.endingBalance >= 0 ? 'text-[#1e293b]' : 'text-[#f97316]'
                  }`}>
                    {formatCurrency(period.endingBalance)}
                  </span>
                </div>
              </div>

              {/* Add this after the ending balance display */}
              <div className="text-right">
                <button
                  onClick={() => toggleBreakdown(period.paycheck.id)}
                  className="text-sm text-[#f97316] hover:text-[#ea580c] hover:underline"
                >
                  {showBreakdown.has(period.paycheck.id) ? 'Hide breakdown' : 'See breakdown'}
                </button>
              </div>

              {/* Add the breakdown section */}
              {showBreakdown.has(period.paycheck.id) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Paycheck Amount</span>
                    <span className="font-medium">{formatCurrency(period.paycheck.amount || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ Starting Balance</span>
                    <span className="font-medium">{formatCurrency(period.startingBalance)}</span>
                  </div>
                  <div className="border-t border-gray-200 my-2 pt-2">
                    <div className="flex justify-between font-medium">
                      <span>= Subtotal</span>
                      <span>{formatCurrency((period.paycheck.amount || 0) + period.startingBalance)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[#f97316]">
                    <span>- Total Bills</span>
                    <span className="font-medium">
                      {formatCurrency(period.bills.reduce((sum, bill) => sum + (bill.amount || 0), 0))}
                    </span>
                  </div>
                  {includeSavings && (
                    <div className="flex justify-between text-blue-600">
                      <span>- Total Savings</span>
                      <span className="font-medium">
                        {formatCurrency(period.savingsPayments.reduce((sum, payment) => sum + payment.amount, 0))}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 my-2 pt-2">
                    <div className="flex justify-between font-bold">
                      <span>= Ending Balance</span>
                      <span className={period.endingBalance >= 0 ? 'text-[#1e293b]' : 'text-[#f97316]'}>
                        {formatCurrency(period.endingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Show detailed bills list only when expanded */}
              {expandedPeriods.has(period.paycheck.id) && period.bills.length > 0 && (
                <div className="space-y-2 mt-2">
                  <h4 className="font-semibold text-[#1e293b]">Upcoming Bills:</h4>
                  {period.bills.map((bill) => (
                    <div key={`${bill.id}-${bill.due_date}`} className="flex justify-between items-center pl-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: bill.category?.color || '#94A3B8' }}
                        />
                        <span className="text-[#1e293b] font-medium">{bill.name}</span>
                        <span className="text-sm text-gray-600">
                          ({format(parseISO(bill.due_date || ''), 'MMM d')})
                        </span>
                      </div>
                      <span className="text-[#f97316] font-semibold">{formatCurrency(bill.amount || 0)}</span>
                    </div>
                  ))}
                  
                  {includeSavings && period.savingsPayments.length > 0 && (
                    <>
                      <h4 className="font-semibold text-[#1e293b] mt-4">Savings Payments:</h4>
                      {period.savingsPayments.map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center pl-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-[#1e293b] font-medium">{payment.plan_name}</span>
                            <span className="text-sm text-gray-600">
                              ({format(parseISO(payment.payment_date), 'MMM d')})
                            </span>
                          </div>
                          <span className="text-blue-600 font-semibold">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default IncomeBook;
