import React, { useEffect, useState } from 'react';
import { format, addDays, parseISO, differenceInDays, isToday, addMonths, startOfMonth } from 'date-fns';
import { getDebitCards } from '../../services/debit-card-service';
import { getUserProfile } from '../../services/profile-service';
import { getNextPaycheckDate } from '../../services/paycheck-service';
import { Wallet, Receipt, ChevronDown, ChevronUp, Equal, CheckCircle2 } from 'lucide-react';
import type { DebitCard, Bill, CreditCardPayment, Category, CreditCard } from '../../types';
import { getBills } from '../../services/bill-service';
import { getCreditCards } from '../../services/credit-card-service';
import { getCategories } from '../../services/category-service';
import { getMonthlyBills } from '../../utils/bill-utils';
import { Card } from '../ui/Card';

interface NextPaycheckOverviewProps {
  onProjectedBalanceChange: (balance: number) => void;
}

const NextPaycheckOverview: React.FC<NextPaycheckOverviewProps> = ({ onProjectedBalanceChange }) => {
  const [debitCards, setDebitCards] = useState<DebitCard[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [nextPayDate, setNextPayDate] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getBillStatus = (dueDate: string) => {
    const date = parseISO(dueDate);
    const today = new Date();
    const daysUntilDue = differenceInDays(date, today);

    if (isToday(date)) {
      return {
        label: 'Due Today',
        className: 'bg-yellow-100 text-yellow-800'
      };
    }
    if (daysUntilDue <= 7 && daysUntilDue > 0) {
      return {
        label: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
        className: 'bg-blue-100 text-blue-800'
      };
    }
    return {
      label: format(date, 'MMM d'),
      className: 'bg-gray-100 text-gray-600'
    };
  };

  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  const generateRecurringBillDates = (bill: Bill, startDate: Date, endDate: Date): Date[] => {
    if (!bill.start_date) return [];
    
    const billStartDate = normalizeDate(parseISO(bill.start_date));
    const billEndDate = bill.end_date ? normalizeDate(parseISO(bill.end_date)) : null;
    
    const normalizedStartDate = normalizeDate(startDate);
    const normalizedEndDate = normalizeDate(endDate);
    
    if (billEndDate && billEndDate < normalizedStartDate) {
      return [];
    }

    const dates: Date[] = [];
    const intervalEnd = billEndDate && billEndDate < normalizedEndDate ? billEndDate : normalizedEndDate;

    switch (bill.recurrence_interval) {
      case 'weekly': {
        let currentDate = new Date(billStartDate);
        while (currentDate <= intervalEnd) {
          if (currentDate >= normalizedStartDate && currentDate <= intervalEnd) {
            dates.push(new Date(currentDate));
          }
          currentDate = addDays(currentDate, 7);
        }
        break;
      }

      case 'bi-weekly': {
        let currentDate = new Date(billStartDate);
        while (currentDate <= intervalEnd) {
          if (currentDate >= normalizedStartDate && currentDate <= intervalEnd) {
            dates.push(new Date(currentDate));
          }
          currentDate = addDays(currentDate, 14);
        }
        break;
      }

      case 'monthly': {
        if (bill.recurrence_day) {
          let currentDate = new Date(billStartDate);
          while (currentDate <= intervalEnd) {
            if (currentDate >= normalizedStartDate) {
              const monthlyDate = normalizeDate(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                bill.recurrence_day
              ));
              
              if (monthlyDate >= normalizedStartDate && monthlyDate <= intervalEnd) {
                dates.push(new Date(monthlyDate));
              }
            }
            currentDate = addMonths(currentDate, 1);
          }
        }
        break;
      }

      case 'quarterly': {
        if (bill.recurrence_day) {
          let currentDate = new Date(billStartDate);
          while (currentDate <= intervalEnd) {
            if (currentDate >= normalizedStartDate) {
              const quarterlyDate = normalizeDate(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                bill.recurrence_day
              ));
              
              if (quarterlyDate >= normalizedStartDate && quarterlyDate <= intervalEnd) {
                dates.push(new Date(quarterlyDate));
              }
            }
            currentDate = addMonths(currentDate, 3);
          }
        }
        break;
      }

      case 'yearly': {
        let currentDate = new Date(billStartDate);
        while (currentDate <= intervalEnd) {
          if (currentDate >= normalizedStartDate && currentDate <= intervalEnd) {
            dates.push(normalizeDate(new Date(currentDate)));
          }
          currentDate = addMonths(currentDate, 12);
        }
        break;
      }
    }

    return dates;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const profileData = await getUserProfile();
        
        if (!profileData) {
          throw new Error('User profile not found. Please check your profile settings.');
        }

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch all required data in parallel
        const [nextPayDateResult, debitCardsData, allBills, allCreditCards, allCategories] = await Promise.all([
          getNextPaycheckDate(),
          getDebitCards(),
          getBills(),
          getCreditCards(),
          getCategories()
        ]);
        
        if (!nextPayDateResult) {
          throw new Error('Next pay date is not available. Please check your profile settings.');
        }

        setNextPayDate(nextPayDateResult);

        // Get all monthly bills first
        const monthlyBills = getMonthlyBills(allBills, allCreditCards, allCategories, startOfMonth(today));

        // Filter bills between today and next pay date
        const nextPayDateObj = parseISO(nextPayDateResult);
        const filteredBills = monthlyBills
          .filter(bill => {
            const billDate = parseISO(bill.due_date);
            return billDate >= today && billDate <= nextPayDateObj;
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
          // Sort by due date
          .sort((a, b) => {
            const dateA = parseISO(a.due_date);
            const dateB = parseISO(b.due_date);
            return dateA.getTime() - dateB.getTime();
          });

        setDebitCards(debitCardsData);
        setBills(filteredBills);
        setCategories(allCategories);
        setCreditCards(allCreditCards);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add effect to notify parent of projected balance changes
  useEffect(() => {
    if (!isLoading && !error) {
      const totalAvailableFunds = debitCards.reduce(
        (sum, card) => sum + card.available_balance,
        0
      );

      const upcomingBillsTotal = bills
        .filter(bill => !bill.is_paid)
        .reduce((sum, bill) => sum + bill.amount, 0);

      onProjectedBalanceChange(totalAvailableFunds - upcomingBillsTotal);
    }
  }, [debitCards, bills, isLoading, error, onProjectedBalanceChange]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  const totalAvailableFunds = debitCards.reduce(
    (sum, card) => sum + card.available_balance,
    0
  );

  const upcomingBillsTotal = bills
    .filter(bill => !bill.is_paid)
    .reduce((sum, bill) => sum + bill.amount, 0);
  const totalExpectedFunds = totalAvailableFunds;
  const remainingAfterBills = totalExpectedFunds - upcomingBillsTotal;

  // Group bills by category
  const categoryData = categories
    .map(category => {
      const categoryBills = bills.filter(bill => bill.category_id === category.id);
      const total = categoryBills
        .filter(bill => !bill.is_paid)
        .reduce((sum, bill) => sum + bill.amount, 0);
      return {
        ...category,
        total,
        bills: categoryBills
      };
    })
    .filter(category => category.bills.length > 0);

  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-bold text-[#1e293b]">Next Paycheck Overview</h2>
          <div className="flex items-center space-x-2">
            <span className="text-base text-gray-600">Next Paycheck:</span>
            <span className="text-xl font-semibold text-[#f97316]">
              {nextPayDate ? format(parseISO(nextPayDate), 'MMM d, yyyy') : 'Not scheduled'}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Available Funds Card */}
          <Card className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
            <div className="space-y-4">
              <div 
                className="flex justify-between items-center border-b pb-2 cursor-pointer"
                onClick={() => toggleSection('funds')}
              >
                <div>
                  <h3 className="text-lg font-bold text-[#1e293b]">Available Funds</h3>
                  <p className="text-base text-gray-600">Current balance across all debit cards</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#1e293b]">
                      {formatCurrency(totalAvailableFunds)}
                    </p>
                  </div>
                  {expandedSection === 'funds' ? (
                    <ChevronUp className="h-6 w-6 text-[#f97316]" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-[#f97316]" />
                  )}
                </div>
              </div>

              {/* Always show total available funds */}
              <div className="flex justify-between items-center text-base">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Total Available:</span>
                  <span className="text-[#1e293b] font-semibold">
                    {formatCurrency(totalAvailableFunds)}
                  </span>
                </div>
              </div>

              {/* Show detailed card balances when expanded */}
              {expandedSection === 'funds' && (
                <div className="space-y-2 mt-2">
                  <h4 className="font-semibold text-[#1e293b]">Card Balances:</h4>
                  {debitCards.map(card => (
                    <div key={card.id} className="flex justify-between items-center pl-4">
                      <div className="flex items-center space-x-2">
                        <Wallet className="h-4 w-4 text-[#1e293b]" />
                        <span className="text-[#1e293b]">{card.name}</span>
                      </div>
                      <span className="text-[#1e293b] font-medium">{formatCurrency(card.available_balance)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Upcoming Bills Card */}
          <Card className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
            <div className="space-y-4">
              <div 
                className="flex justify-between items-center border-b pb-2 cursor-pointer"
                onClick={() => toggleSection('bills')}
              >
                <div>
                  <h3 className="text-lg font-bold text-[#1e293b]">Upcoming Bills</h3>
                  <p className="text-base text-gray-600">Due before next pay date</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#f97316]">
                      {formatCurrency(upcomingBillsTotal)}
                    </p>
                  </div>
                  {expandedSection === 'bills' ? (
                    <ChevronUp className="h-6 w-6 text-[#f97316]" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-[#f97316]" />
                  )}
                </div>
              </div>

              {/* Always show total bills and remaining balance */}
              <div className="flex justify-between items-center text-base">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Total Bills:</span>
                  <span className="text-[#f97316] font-semibold">
                    {formatCurrency(upcomingBillsTotal)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className={`font-semibold ${
                    remainingAfterBills >= 0 ? 'text-[#1e293b]' : 'text-[#f97316]'
                  }`}>
                    {formatCurrency(remainingAfterBills)}
                  </span>
                </div>
              </div>

              {/* Show detailed bills when expanded */}
              {expandedSection === 'bills' && (
                <div className="mt-4 space-y-4">
                  {categoryData.map(category => (
                    <div key={category.id}>
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-base font-semibold text-[#1e293b]">{category.name}</span>
                          <span className="text-xs text-gray-500">
                            ({category.bills.length} bills)
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-[#1e293b]">{formatCurrency(category.total)}</span>
                          {expandedCategories.includes(category.id) ? (
                            <ChevronUp className="h-5 w-5 text-[#f97316]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-[#f97316]" />
                          )}
                        </div>
                      </div>
                      {expandedCategories.includes(category.id) && (
                        <div className="mt-2 space-y-2 pl-4">
                          {category.bills.map(bill => {
                            const status = getBillStatus(bill.due_date);
                            return (
                              <div key={bill.id + bill.due_date} className="flex justify-between items-center text-base">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[#1e293b] font-medium">{bill.name}</span>
                                  {bill.is_paid ? (
                                    <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle2 size={12} />
                                      Paid
                                    </span>
                                  ) : (
                                    <span className={`text-xs px-2 py-1 rounded-full ${status.className}`}>
                                      {status.label}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[#1e293b] font-semibold">{formatCurrency(bill.amount)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Projection Card */}
          <Card className="p-6 bg-white rounded-2xl shadow-md border border-gray-200">
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-lg font-bold text-[#1e293b]">Projection</h3>
                <p className="text-base text-gray-600">Financial outlook until next pay date</p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base text-gray-600">Available Funds</span>
                    <span className="font-bold text-[#1e293b]">{formatCurrency(totalAvailableFunds)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-600">Upcoming Bills</span>
                    <span className="font-bold text-[#f97316]">{formatCurrency(upcomingBillsTotal)}</span>
                  </div>
                </div>
                <div className="px-6 border-l border-r border-gray-200">
                  <Equal className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-right">
                  <span className="block text-base text-gray-600">Projected Balance</span>
                  <span className={`text-2xl font-bold ${
                    remainingAfterBills >= 0 ? 'text-[#1e293b]' : 'text-[#f97316]'
                  }`}>
                    {formatCurrency(remainingAfterBills)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NextPaycheckOverview;