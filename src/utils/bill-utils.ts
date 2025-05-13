import { parseISO, startOfMonth, endOfMonth, format, addDays, addMonths } from 'date-fns';
import type { Bill, CreditCard as CreditCardType, Category } from '../../types';

export const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const generateRecurringBillDates = (bill: Bill, monthStart: Date, monthEnd: Date): Date[] => {
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
            const monthlyDate = normalizeDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth(), bill.recurrence_day)
            );

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
            const quarterlyDate = normalizeDate(
              new Date(currentDate.getFullYear(), currentDate.getMonth(), bill.recurrence_day)
            );

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

export const getMonthlyBills = (
  bills: Bill[],
  creditCards: CreditCardType[],
  categories: Category[],
  selectedMonth: Date
): Bill[] => {
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const expandedBills: Bill[] = [];

  // Add regular bills
  bills.forEach(bill => {
    if (bill.bill_type === 'one-time') {
      const billDate = normalizeDate(parseISO(bill.due_date));
      if (billDate >= monthStart && billDate <= monthEnd) {
        expandedBills.push(bill);
      }
    } else {
      const dates = generateRecurringBillDates(bill, monthStart, monthEnd);
      dates.forEach(date => {
        expandedBills.push({
          ...bill,
          due_date: format(date, 'yyyy-MM-dd')
        });
      });
    }
  });

  // Add credit card payments as bills
  creditCards.forEach(card => {
    if (card.payment_frequency && card.payment_amount > 0) {
      const paymentBill: Bill = {
        id: `cc-payment-${card.id}`,
        user_id: card.user_id,
        name: `${card.name} Payment`,
        amount: card.payment_amount,
        due_date: card.due_date,
        category_id: categories.find(c => c.name === 'Credit Card')?.id || '',
        bill_type: 'recurring',
        frequency: card.payment_frequency,
        is_autopay: card.is_autopay,
        card_id: card.id,
        notes: `Automatic payment for ${card.bank_name} credit card`,
        recurrence_interval: card.payment_frequency,
        start_date: card.payment_start_date || undefined,
        end_date: card.payment_end_date || undefined,
        recurrence_day: card.payment_day || undefined,
        recurrence_week_day: card.payment_week_day || undefined,
        created_at: card.created_at,
        updated_at: card.updated_at,
        category: categories.find(c => c.name === 'Credit Card'),
        card: { ...card, type: 'credit' }
      };

      const dates = generateRecurringBillDates(paymentBill, monthStart, monthEnd);
      dates.forEach(date => {
        expandedBills.push({
          ...paymentBill,
          due_date: format(date, 'yyyy-MM-dd')
        });
      });
    }
  });

  return expandedBills;
};