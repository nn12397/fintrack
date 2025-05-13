import { addDays, addWeeks, addMonths, startOfMonth, endOfMonth, isBefore, isAfter } from 'date-fns';
import type { UserProfile } from '../types';

interface PayDates {
  lastPayDate: Date | null;
  nextPayDate: Date | null;
}

export function calculatePayDates(profile: UserProfile): PayDates {
  const today = new Date();
  let lastPayDate: Date | null = null;
  let nextPayDate: Date | null = null;

  switch (profile.income_frequency) {
    case 'weekly': {
      // Get last 7 days and next 7 days
      const lastWeek = addDays(today, -7);
      nextPayDate = addDays(today, 7);
      lastPayDate = lastWeek;
      break;
    }

    case 'bi-weekly': {
      // Get last 14 days and next 14 days
      const lastTwoWeeks = addWeeks(today, -2);
      nextPayDate = addWeeks(today, 2);
      lastPayDate = lastTwoWeeks;
      break;
    }

    case 'bi-monthly': {
      // 15th and last day of the month
      const fifteenthOfMonth = new Date(today.getFullYear(), today.getMonth(), 15);
      const lastDayOfMonth = endOfMonth(today);
      const fifteenthOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
      const lastDayOfLastMonth = endOfMonth(addMonths(today, -1));

      if (today.getDate() < 15) {
        // Before the 15th: last = last day of last month, next = 15th
        lastPayDate = lastDayOfLastMonth;
        nextPayDate = fifteenthOfMonth;
      } else if (today.getDate() === 15) {
        // On the 15th: last = 15th, next = last day of month
        lastPayDate = fifteenthOfMonth;
        nextPayDate = lastDayOfMonth;
      } else if (today.getDate() > 15 && today.getDate() < lastDayOfMonth.getDate()) {
        // After 15th but before end of month: last = 15th, next = last day of month
        lastPayDate = fifteenthOfMonth;
        nextPayDate = lastDayOfMonth;
      } else {
        // On last day of month: last = last day of month, next = 15th of next month
        lastPayDate = lastDayOfMonth;
        nextPayDate = fifteenthOfNextMonth;
      }
      break;
    }

    case 'monthly': {
      const lastMonth = addMonths(today, -1);
      nextPayDate = addMonths(today, 1);
      lastPayDate = lastMonth;
      break;
    }

    case 'specific-date': {
      if (profile.income_day) {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Create dates for last month, current month, and next month
        const lastMonth = new Date(currentYear, currentMonth - 1, profile.income_day);
        const thisMonth = new Date(currentYear, currentMonth, profile.income_day);
        const nextMonth = new Date(currentYear, currentMonth + 1, profile.income_day);

        // Determine last and next pay dates
        if (isBefore(today, thisMonth)) {
          lastPayDate = lastMonth;
          nextPayDate = thisMonth;
        } else {
          lastPayDate = thisMonth;
          nextPayDate = nextMonth;
        }
      }
      break;
    }
  }

  return { lastPayDate, nextPayDate };
}