import type { UserProfile } from '../types';

/**
 * Calculates the total monthly income based on income amount and frequency
 * @param incomeAmount The base income amount
 * @param incomeFrequency The frequency of income (weekly, bi-weekly, bi-monthly, monthly, specific-date)
 * @returns The calculated monthly income
 */
export const calculateMonthlyIncome = (incomeAmount: number, incomeFrequency: UserProfile['income_frequency']): number => {
  let monthlyIncome = incomeAmount;

  switch (incomeFrequency) {
    case 'weekly':
      monthlyIncome *= 4.33; // Average weeks per month
      break;
    case 'bi-weekly':
      monthlyIncome *= 2.17; // Average bi-weekly periods per month
      break;
    case 'bi-monthly':
      monthlyIncome *= 2; // 2 payments per month
      break;
    case 'monthly':
      // Monthly is already correct, no multiplication needed
      break;
    case 'specific-date':
      // For specific date, treat it as monthly
      break;
  }

  return monthlyIncome;
};
