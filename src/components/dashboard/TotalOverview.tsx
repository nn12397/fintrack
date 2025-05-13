import React, { useEffect, useState } from 'react';
import { format, addDays, parseISO, addMonths, addWeeks, isBefore, isAfter, isToday } from 'date-fns';
import { getDebitCards } from '../../services/debit-card-service';
import { getCreditCards } from '../../services/credit-card-service';
import { getUserProfile } from '../../services/profile-service';
import { getBillsByDateRange } from '../../services/bill-service';
import { getPaychecks } from '../../services/paycheck-service';
import { calculatePayDates } from '../../utils/date-utils';
import { Wallet, Calendar, DollarSign, Receipt, ChevronDown, ChevronUp, Plus, Equal, Minus, CreditCard } from 'lucide-react';
import type { DebitCard, UserProfile, Bill, CreditCardPayment, CreditCard as CreditCardType, Paycheck } from '../../types';
import { supabase } from '../../lib/supabase';
import { getMonthlyBills, generateRecurringBillDates } from '../../utils/bill-utils';

// Add isExpanded to the props
interface TotalOverviewProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const TotalOverview: React.FC<TotalOverviewProps> = ({ isExpanded, onToggle }) => {
  const [debitCards, setDebitCards] = useState<DebitCard[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [creditCardPayments, setCreditCardPayments] = useState<CreditCardPayment[]>([]);
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedSubsections, setExpandedSubsections] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const today = new Date();
        const thirtyDaysFromNow = addDays(today, 30);

        // Fetch credit card payments for the next 30 days
        const { data: payments, error: paymentsError } = await supabase
          .from('credit_card_payments')
          .select('*, credit_card:credit_cards(name)')
          .gt('payment_date', format(today, 'yyyy-MM-dd'))
          .lte('payment_date', format(thirtyDaysFromNow, 'yyyy-MM-dd'))
          .order('payment_date', { ascending: true });

        if (paymentsError) {
          throw paymentsError;
        }

        const [cardsData, creditCardsData, profileData, billsData, paychecksData] = await Promise.all([
          getDebitCards(),
          getCreditCards(),
          getUserProfile(),
          getBillsByDateRange(
            format(today, 'yyyy-MM-dd'),
            format(thirtyDaysFromNow, 'yyyy-MM-dd')
          ),
          getPaychecks()
        ]);

        setDebitCards(cardsData);
        setCreditCards(creditCardsData);
        setProfile(profileData);
        setBills(billsData);
        setCreditCardPayments(payments || []);
        setPaychecks(paychecksData);
      } catch (err: any) {
        setError(err.message || 'Failed to load overview data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalAvailableFunds = debitCards.reduce(
    (sum, card) => sum + card.available_balance,
    0
  );

  const { nextPayDate } = profile ? calculatePayDates(profile) : { nextPayDate: null };

  // Sort bills by due date
  const sortedBills = [...bills].sort((a, b) => {
    const dateA = parseISO(a.due_date);
    const dateB = parseISO(b.due_date);
    return dateA.getTime() - dateB.getTime();
  });

  // Sort credit card payments by date
  const sortedPayments = [...creditCardPayments].sort((a, b) => {
    const dateA = parseISO(a.payment_date);
    const dateB = parseISO(b.payment_date);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate upcoming bills using generateRecurringBillDates
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);
  const upcomingBills: Bill[] = [];

  bills.forEach(bill => {
    if (bill.bill_type === 'one-time') {
      const dueDate = parseISO(bill.due_date);
      if (dueDate >= today && dueDate <= thirtyDaysFromNow) {
        upcomingBills.push(bill);
      }
    } else if (bill.bill_type === 'recurring') {
      const dates = generateRecurringBillDates(bill, today, thirtyDaysFromNow);
      dates.forEach(date => {
        upcomingBills.push({
          ...bill,
          due_date: format(date, 'yyyy-MM-dd')
        });
      });
    }
  });

  // Sort upcoming bills by due date
  const sortedUpcomingBills = upcomingBills.sort((a, b) => {
    const dateA = parseISO(a.due_date);
    const dateB = parseISO(b.due_date);
    return dateA.getTime() - dateB.getTime();
  });

  // Get upcoming paychecks for the next 30 days
  const upcomingPaychecks = paychecks
    .filter(p => {
      const paymentDate = parseISO(p.payment_date);
      return (isAfter(paymentDate, today) || isToday(paymentDate)) && isBefore(paymentDate, thirtyDaysFromNow);
    })
    .sort((a, b) => parseISO(a.payment_date).getTime() - parseISO(b.payment_date).getTime());

  const upcomingBillsTotal = sortedUpcomingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const upcomingPaymentsTotal = sortedPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const upcomingPaychecksTotal = upcomingPaychecks.reduce((sum, paycheck) => sum + paycheck.amount, 0);
  const totalUpcoming = upcomingBillsTotal + upcomingPaymentsTotal;

  const totalExpectedFunds = totalAvailableFunds + upcomingPaychecksTotal;
  const remainingAfterBills = totalExpectedFunds - totalUpcoming;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleSubsection = (section: string) => {
    setExpandedSubsections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="space-y-8">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <h2 className="text-3xl font-bold text-[#1e293b] mb-2">30-Day Financial Projection</h2>
        {isExpanded ? (
          <ChevronUp className="h-6 w-6 text-[#f97316]" />
        ) : (
          <ChevronDown className="h-6 w-6 text-[#f97316]" />
        )}
      </div>
      
      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Financial Status */}
          <div className="space-y-6">
            {/* Available Funds */}
            <div 
              className="bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              onClick={() => toggleSection('funds')}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#1e293b] p-2 rounded-xl">
                      <Wallet className="text-[#f97316] h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#1e293b]">Available Funds</h3>
                      <p className="text-2xl font-bold text-[#1e293b]">
                        {formatCurrency(totalAvailableFunds)}
                      </p>
                    </div>
                  </div>
                  {expandedSection === 'funds' ? (
                    <ChevronUp className="h-6 w-6 text-[#f97316]" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-[#f97316]" />
                  )}
                </div>
              </div>
              {expandedSection === 'funds' && (
                <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-2">
                  {debitCards.map(card => (
                    <div key={card.id} className="flex justify-between items-center">
                      <span className="text-sm text-[#1e293b]">{card.name}</span>
                      <span className="font-medium text-[#1e293b]">{formatCurrency(card.available_balance)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expected Income */}
            <div 
              className="bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              onClick={() => toggleSection('income')}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#1e293b] p-2 rounded-xl">
                      <DollarSign className="text-[#f97316] h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#1e293b]">Expected Income</h3>
                      <p className="text-2xl font-bold text-[#1e293b]">
                        {formatCurrency(upcomingPaychecksTotal)}
                      </p>
                    </div>
                  </div>
                  {expandedSection === 'income' ? (
                    <ChevronUp className="h-6 w-6 text-[#f97316]" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-[#f97316]" />
                  )}
                </div>
              </div>
              {expandedSection === 'income' && (
                <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-2">
                  {upcomingPaychecks.map(paycheck => (
                    <div key={paycheck.id} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-[#1e293b] font-medium">
                          {format(parseISO(paycheck.payment_date), 'MMM d')}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({paycheck.frequency})
                        </span>
                      </div>
                      <span className="font-medium text-[#1e293b]">{formatCurrency(paycheck.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Bills & Payments */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-lg transition-all overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-[#1e293b] p-2 rounded-xl">
                      <Receipt className="text-[#f97316] h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#1e293b]">Upcoming Bills & Payments</h3>
                      <p className="text-2xl font-bold text-[#1e293b]">
                        {formatCurrency(totalUpcoming)}
                      </p>
                    </div>
                  </div>
                  {expandedSection === 'bills' ? (
                    <ChevronUp className="h-6 w-6 text-[#f97316]" />
                  ) : (
                    <ChevronDown className="h-6 w-6 text-[#f97316]" />
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-6">
                {/* Bills Section */}
                <div>
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSubsection('regular-bills')}
                  >
                    <span className="text-base font-semibold text-[#1e293b]">Regular Bills</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#f97316]">{formatCurrency(upcomingBillsTotal)}</span>
                      {expandedSubsections.includes('regular-bills') ? (
                        <ChevronUp className="h-5 w-5 text-[#f97316]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#f97316]" />
                      )}
                    </div>
                  </div>
                  {expandedSubsections.includes('regular-bills') && (
                    <div className="mt-2 space-y-2 pl-4">
                      {sortedUpcomingBills.map(bill => (
                        <div key={bill.id + bill.due_date} className="flex justify-between items-center text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-[#1e293b] font-medium">{bill.name}</span>
                            <span className="text-xs bg-[#f97316] text-white px-2 py-0.5 rounded-full">
                              {format(parseISO(bill.due_date), 'MMM d')}
                            </span>
                          </div>
                          <span className="text-[#1e293b] font-semibold">{formatCurrency(bill.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Credit Card Payments Section */}
                <div>
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleSubsection('credit-payments')}
                  >
                    <span className="text-base font-semibold text-[#1e293b]">Credit Card Payments</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#f97316]">{formatCurrency(upcomingPaymentsTotal)}</span>
                      {expandedSubsections.includes('credit-payments') ? (
                        <ChevronUp className="h-5 w-5 text-[#f97316]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#f97316]" />
                      )}
                    </div>
                  </div>
                  {expandedSubsections.includes('credit-payments') && (
                    <div className="mt-2 space-y-2 pl-4">
                      {sortedPayments.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4 text-[#f97316]" />
                            <span className="text-[#1e293b] font-medium">
                              {(payment.credit_card as any)?.name || 'Credit Card Payment'}
                            </span>
                            <span className="text-xs bg-[#1e293b] text-white px-2 py-0.5 rounded-full">
                              {format(parseISO(payment.payment_date), 'MMM d')}
                            </span>
                          </div>
                          <span className="text-[#1e293b] font-semibold">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Calculations */}
          <div className="space-y-6">
            {/* Expected Funds Calculation */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-[#1e293b] mb-4">Expected Funds</h3>
              <div className="flex items-center space-x-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base text-gray-600">Available</span>
                    <span className="font-bold text-[#1e293b]">{formatCurrency(totalAvailableFunds)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-600">Income</span>
                    <span className="font-bold text-[#1e293b]">{formatCurrency(upcomingPaychecksTotal)}</span>
                  </div>
                </div>
                <div className="px-6 border-l border-r border-gray-200">
                  <Equal className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-right">
                  <span className="block text-base text-gray-600">Total</span>
                  <span className="text-2xl font-bold text-[#1e293b]">{formatCurrency(totalExpectedFunds)}</span>
                </div>
              </div>
            </div>

            {/* 30-Day Projection */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-[#1e293b] mb-4">30-Day Projection</h3>
              <div className="flex items-center space-x-6">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base text-gray-600">Expected</span>
                    <span className="font-bold text-[#1e293b]">{formatCurrency(totalExpectedFunds)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-600">Bills & Payments</span>
                    <span className="font-bold text-[#1e293b]">{formatCurrency(totalUpcoming)}</span>
                  </div>
                </div>
                <div className="px-6 border-l border-r border-gray-200">
                  <Equal className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-right">
                  <span className="block text-base text-gray-600">Balance</span>
                  <span className={`text-2xl font-bold ${remainingAfterBills >= 0 ? 'text-[#1e293b]' : 'text-[#f97316]'}`}>{formatCurrency(remainingAfterBills)}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  Through <span className="font-semibold text-[#1e293b]">{format(addDays(new Date(), 30), 'MMM d, yyyy')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TotalOverview;