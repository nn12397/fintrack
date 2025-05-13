import { supabase } from '../lib/supabase';
import type { Bill, Category, CreditCard } from '../types';

export async function getBills() {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Get all bills with their categories
  const { data: bills, error: billsError } = await supabase
    .from('bills')
    .select(`
      *,
      category:categories(id, name, color)
    `)
    .order('due_date');

  if (billsError) {
    throw billsError;
  }

  // Get credit cards that have a balance above minimum payment
  const { data: creditCards, error: cardsError } = await supabase
    .from('credit_cards')
    .select('*')
    .gt('current_balance', 0)
    .order('name');

  if (cardsError) {
    throw cardsError;
  }

  // Get the "Credit Card" category
  const { data: creditCardCategory } = await supabase
    .from('categories')
    .select('*')
    .eq('name', 'Credit Card')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  // Convert credit cards to bills format
  const creditCardBills = (creditCards as CreditCard[])
    .filter(card => card.current_balance >= card.minimum_payment)
    .map(card => ({
      id: `cc-${card.id}`,
      user_id: card.user_id,
      name: card.name,
      amount: card.minimum_payment,
      due_date: card.due_date,
      category_id: creditCardCategory?.id,
      bill_type: 'recurring' as const,
      frequency: card.payment_frequency,
      is_autopay: card.is_autopay,
      card_id: card.id,
      notes: `Minimum payment for ${card.name}`,
      recurrence_interval: card.payment_frequency,
      start_date: card.payment_start_date,
      end_date: card.payment_end_date,
      recurrence_day: card.payment_day,
      recurrence_week_day: card.payment_week_day,
      created_at: card.created_at,
      updated_at: card.updated_at,
      category: creditCardCategory,
      card: { ...card, type: 'credit' as const }
    }));

  // For bills with card_id, fetch the corresponding card details
  const billsWithCards = await Promise.all(bills.map(async (bill) => {
    if (!bill.card_id) {
      return bill;
    }

    // Try to get credit card first
    const { data: creditCard } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', bill.card_id)
      .maybeSingle();

    if (creditCard) {
      return { ...bill, card: { ...creditCard, type: 'credit' }};
    }

    // If not a credit card, try debit card
    const { data: debitCard } = await supabase
      .from('debit_cards')
      .select('*')
      .eq('id', bill.card_id)
      .maybeSingle();

    if (debitCard) {
      return { ...bill, card: { ...debitCard, type: 'debit' }};
    }

    return bill;
  }));

  // Combine regular bills and credit card bills
  return [...billsWithCards, ...creditCardBills] as Bill[];
}

export async function getBill(id: string) {
  // Get the bill with its category
  const { data: bill, error } = await supabase
    .from('bills')
    .select(`
      *,
      category:categories(id, name, color)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  // If the bill has a card_id, fetch the card details
  if (bill.card_id) {
    // Try credit card first
    const { data: creditCard } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', bill.card_id)
      .maybeSingle();

    if (creditCard) {
      return { ...bill, card: { ...creditCard, type: 'credit' }} as Bill;
    }

    // If not a credit card, try debit card
    const { data: debitCard } = await supabase
      .from('debit_cards')
      .select('*')
      .eq('id', bill.card_id)
      .maybeSingle();

    if (debitCard) {
      return { ...bill, card: { ...debitCard, type: 'debit' }} as Bill;
    }
  }

  return bill as Bill;
}

export async function createBill(bill: Omit<Bill, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  // Validate and prepare bill data
  const billData = {
    ...bill,
    user_id: userData.user.id,
  };

  // For recurring bills, ensure required fields are set
  if (bill.bill_type === 'recurring') {
    if (!bill.recurrence_interval || !bill.start_date) {
      throw new Error('Recurring bills must have an interval and start date');
    }

    // Set due_date to start_date initially for recurring bills
    billData.due_date = bill.start_date;
  }
  
  const { data, error } = await supabase
    .from('bills')
    .insert(billData)
    .select(`
      *,
      category:categories(id, name, color)
    `)
    .single();
  
  if (error) {
    throw error;
  }

  // If the bill has a card_id, fetch the card details
  if (data.card_id) {
    // Try credit card first
    const { data: creditCard } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', data.card_id)
      .maybeSingle();

    if (creditCard) {
      return { ...data, card: { ...creditCard, type: 'credit' }} as Bill;
    }

    // If not a credit card, try debit card
    const { data: debitCard } = await supabase
      .from('debit_cards')
      .select('*')
      .eq('id', data.card_id)
      .maybeSingle();

    if (debitCard) {
      return { ...data, card: { ...debitCard, type: 'debit' }} as Bill;
    }
  }
  
  return data as Bill;
}

export async function updateBill(id: string, bill: Partial<Omit<Bill, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) {
  // Validate recurring bill data
  if (bill.bill_type === 'recurring') {
    if (!bill.recurrence_interval || !bill.start_date) {
      throw new Error('Recurring bills must have an interval and start date');
    }
  }

  // If card_id is provided, verify it exists in either credit_cards or debit_cards
  if (bill.card_id) {
    const { data: creditCard } = await supabase
      .from('credit_cards')
      .select('id')
      .eq('id', bill.card_id)
      .maybeSingle();

    const { data: debitCard } = await supabase
      .from('debit_cards')
      .select('id')
      .eq('id', bill.card_id)
      .maybeSingle();

    if (!creditCard && !debitCard) {
      throw new Error('Invalid card ID');
    }
  }

  const { data, error } = await supabase
    .from('bills')
    .update({
      ...bill,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      category:categories(id, name, color)
    `)
    .single();
  
  if (error) {
    throw error;
  }

  // If the bill has a card_id, fetch the card details
  if (data.card_id) {
    // Try credit card first
    const { data: creditCard } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', data.card_id)
      .maybeSingle();

    if (creditCard) {
      return { ...data, card: { ...creditCard, type: 'credit' }} as Bill;
    }

    // If not a credit card, try debit card
    const { data: debitCard } = await supabase
      .from('debit_cards')
      .select('*')
      .eq('id', data.card_id)
      .maybeSingle();

    if (debitCard) {
      return { ...data, card: { ...debitCard, type: 'debit' }} as Bill;
    }
  }
  
  return data as Bill;
}

export async function deleteBill(id: string) {
  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
  
  return true;
}

export async function getBillsByDateRange(startDate: string, endDate: string) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  console.log('getBillsByDateRange Debug:', {
    startDate,
    endDate,
    query: `and(bill_type.eq.one-time,due_date.gte.${startDate},due_date.lte.${endDate}),and(bill_type.eq.recurring,or(end_date.is.null,end_date.gte.${startDate}),start_date.lte.${endDate})`
  });

  // Get all bills with their categories
  const { data: bills, error } = await supabase
    .from('bills')
    .select(`
      *,
      category:categories(id, name, color)
    `)
    .or(
      `and(bill_type.eq.one-time,due_date.gte.${startDate},due_date.lte.${endDate}),` +
      `and(bill_type.eq.recurring,` +
        `start_date.lte.${endDate},` +  // Bill starts before or on end date
        `or(end_date.is.null,end_date.gte.${startDate})` + // Bill either has no end date or ends after start date
      `)`
    )
    .order('due_date');

  if (error) {
    throw error;
  }

  console.log('Initial bills found:', bills?.length || 0);

  // For bills with card_id, fetch the corresponding card details
  const billsWithCards = await Promise.all(bills.map(async (bill) => {
    if (!bill.card_id) {
      return bill;
    }

    // Try credit card first
    const { data: creditCard } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', bill.card_id)
      .maybeSingle();

    if (creditCard) {
      return { ...bill, card: { ...creditCard, type: 'credit' }};
    }

    // If not a credit card, try debit card
    const { data: debitCard } = await supabase
      .from('debit_cards')
      .select('*')
      .eq('id', bill.card_id)
      .maybeSingle();

    if (debitCard) {
      return { ...bill, card: { ...debitCard, type: 'debit' }};
    }

    return bill;
  }));

  // For recurring bills, generate all occurrences within the date range
  const expandedBills: Bill[] = [];
  
  billsWithCards.forEach(bill => {
    if (bill.bill_type === 'one-time') {
      expandedBills.push(bill);
      return;
    }

    // Generate recurring bill instances
    let currentDate = new Date(bill.start_date!);
    const endDateToUse = bill.end_date ? new Date(bill.end_date) : new Date(endDate);
    const rangeEndDate = new Date(endDate);
    
    while (currentDate <= rangeEndDate && currentDate <= endDateToUse) {
      if (currentDate >= new Date(startDate)) {
        expandedBills.push({
          ...bill,
          due_date: currentDate.toISOString().split('T')[0]
        });
      }

      // Calculate next occurrence
      switch (bill.recurrence_interval) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'bi-weekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }
  });
  
  return expandedBills;
}