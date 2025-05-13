import React, { useState } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, isToday, isFuture, differenceInDays, isSameDay, parseISO, addDays, addWeeks } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import type { Bill, Category, CreditCard as CreditCardType } from '../../types';
import { getMonthlyBills } from '../../utils/bill-utils';

interface BillsDashboardProps {
  bills: Bill[];
  categories: Category[];
  creditCards?: CreditCardType[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const BillsDashboard: React.FC<BillsDashboardProps> = ({
  bills,
  categories,
  creditCards = [],
  isExpanded,
  onToggleExpand,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
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

  const generateRecurringBillDates = (bill: Bill, monthStart: Date, monthEnd: Date): Date[] => {
    if (!bill.start_date) return [];
    
    const startDate = normalizeDate(parseISO(bill.start_date));
    const endDate = bill.end_date ? normalizeDate(parseISO(bill.end_date)) : null;
    
    const normalizedMonthStart = normalizeDate(monthStart);
    const normalizedMonthEnd = normalizeDate(monthEnd);
    
    if (endDate && endDate < normalizedMonthStart) {
      return [];
    }

    const dates: Date[] = [];
    const intervalEnd = endDate && endDate < normalizedMonthEnd ? endDate : normalizedMonthEnd;

    switch (bill.recurrence_interval) {
      case 'weekly': {
        let currentDate = new Date(startDate);
        while (currentDate <= intervalEnd) {
          if (currentDate >= normalizedMonthStart && currentDate <= intervalEnd) {
            dates.push(new Date(currentDate));
          }
          currentDate = addDays(currentDate, 7);
        }
        break;
      }

      case 'bi-weekly': {
        let currentDate = new Date(startDate);
        while (currentDate <= intervalEnd) {
          if (currentDate >= normalizedMonthStart && currentDate <= intervalEnd) {
            dates.push(new Date(currentDate));
          }
          currentDate = addDays(currentDate, 14);
        }
        break;
      }

      case 'monthly': {
        if (bill.recurrence_day) {
          let currentDate = new Date(startDate);
          while (currentDate <= intervalEnd) {
            if (currentDate >= normalizedMonthStart) {
              const monthlyDate = normalizeDate(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                bill.recurrence_day
              ));
              
              if (monthlyDate >= normalizedMonthStart && monthlyDate <= intervalEnd) {
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
          let currentDate = new Date(startDate);
          while (currentDate <= intervalEnd) {
            if (currentDate >= normalizedMonthStart) {
              const quarterlyDate = normalizeDate(new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                bill.recurrence_day
              ));
              
              if (quarterlyDate >= normalizedMonthStart && quarterlyDate <= intervalEnd) {
                dates.push(new Date(quarterlyDate));
              }
            }
            currentDate = addMonths(currentDate, 3);
          }
        }
        break;
      }

      case 'yearly': {
        let currentDate = new Date(startDate);
        while (currentDate <= intervalEnd) {
          if (currentDate >= normalizedMonthStart && currentDate <= intervalEnd) {
            dates.push(normalizeDate(new Date(currentDate)));
          }
          currentDate = addMonths(currentDate, 12);
        }
        break;
      }
    }

    return dates;
  };

  const filteredBills = getMonthlyBills(bills, creditCards, categories, selectedMonth);
  const monthlyTotal = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);

  const categoryData = categories
    .map(category => {
      const categoryBills = filteredBills.filter(bill => bill.category_id === category.id);
      const total = categoryBills.reduce((sum, bill) => sum + bill.amount, 0);
      return {
        ...category,
        total,
        bills: categoryBills
      };
    })
    .filter(category => category.bills.length > 0);

  const calendarDays = Array.from({ length: endOfMonth(selectedMonth).getDate() }, (_, i) => {
    const date = normalizeDate(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), i + 1));
    const dayBills = filteredBills.filter(bill => {
      const billDate = normalizeDate(parseISO(bill.due_date));
      return format(billDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
    return { date, bills: dayBills };
  });

  const getRecurrenceLabel = (bill: Bill) => {
    if (bill.bill_type === 'one-time') return 'One-time';
    
    let base = bill.recurrence_interval?.charAt(0).toUpperCase() + bill.recurrence_interval?.slice(1);
    
    if (bill.recurrence_interval === 'monthly' || bill.recurrence_interval === 'yearly') {
      return `${base} (${bill.recurrence_day}${getDayOrdinal(bill.recurrence_day || 0)})`;
    }
    
    if (bill.recurrence_interval === 'weekly' || bill.recurrence_interval === 'bi-weekly') {
      return `${base} (${getWeekDayName(bill.recurrence_week_day || 0)})`;
    }
    
    return base || '';
  };

  const getDayOrdinal = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getWeekDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-3 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Bills Dashboard</h2>
        <button
          onClick={onToggleExpand}
          className="text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedMonth(prev => addMonths(prev, -1))}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-medium">
                  {format(selectedMonth, 'MMMM yyyy')}
                </h3>
                <span className="text-sm font-medium text-green-600">
                  {formatCurrency(monthlyTotal)}
                </span>
              </div>
              <button
                onClick={() => setSelectedMonth(prev => addMonths(prev, 1))}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setView('list')}
                className={`px-2 py-1 text-sm rounded ${
                  view === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-2 py-1 text-sm rounded ${
                  view === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>

          {view === 'list' ? (
            <div className="space-y-2">
              {categoryData.map(category => (
                <div key={category.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-3 py-2 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="text-xs text-gray-500">
                        ({category.bills.length} bills)
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium">
                        {formatCurrency(category.total)}
                      </span>
                      {expandedCategories.includes(category.id) ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </div>
                  </button>
                  
                  {expandedCategories.includes(category.id) && (
                    <div className="divide-y">
                      {category.bills.map(bill => {
                        const status = getBillStatus(bill.due_date);
                        const isCreditCardPayment = bill.id.startsWith('cc-payment-');
                        
                        return (
                          <div
                            key={bill.id + bill.due_date}
                            className={`px-3 py-2 flex justify-between items-center hover:bg-gray-50 ${
                              isCreditCardPayment ? 'bg-purple-50/50' : ''
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                {isCreditCardPayment && (
                                  <CreditCard size={16} className="text-purple-500" />
                                )}
                                <span className="text-sm">{bill.name}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${status.className}`}>
                                  {status.label}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {getRecurrenceLabel(bill)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm">{formatCurrency(bill.amount)}</span>
                              {(bill.is_autopay || bill.card_id) && (
                                <div className="flex gap-1 mt-1">
                                  {bill.is_autopay && (
                                    <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                                      Auto
                                    </span>
                                  )}
                                  {bill.card_id && !isCreditCardPayment && (
                                    <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">
                                      CC
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
              {Array.from({ length: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 bg-gray-50 rounded"></div>
              ))}
              {calendarDays.map(({ date, bills }) => {
                const isTodays = isToday(date);
                return (
                  <div
                    key={date.toISOString()}
                    className={`h-20 border rounded p-1 overflow-y-auto ${
                      isTodays ? 'border-blue-500 border-2' : ''
                    }`}
                  >
                    <div className="text-xs font-medium mb-1">{format(date, 'd')}</div>
                    {bills.map(bill => {
                      const isCreditCardPayment = bill.id.startsWith('cc-payment-');
                      return (
                        <div
                          key={bill.id + bill.due_date}
                          className={`text-xs p-1 mb-0.5 rounded flex items-center justify-between ${
                            isCreditCardPayment ? 'bg-purple-100' : ''
                          }`}
                          style={!isCreditCardPayment ? { backgroundColor: bill.category?.color + '20' } : undefined}
                        >
                          <span className="truncate flex items-center gap-1">
                            {isCreditCardPayment && <CreditCard size={12} />}
                            {bill.name}
                          </span>
                          <span className="ml-1">{formatCurrency(bill.amount)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillsDashboard;