import React, { useEffect, useState } from 'react';
import { getCreditCards, createCreditCard, updateCreditCard, deleteCreditCard } from '../services/credit-card-service';
import { createCreditCardPayment } from '../services/credit-card-payment-service';
import type { CreditCard, CreditCardPayment } from '../types';
import { AlertTriangle, CreditCard as CreditCardIcon, Plus, Pencil, Trash2, Clock, DollarSign } from 'lucide-react';
import { format, addMonths, parseISO } from 'date-fns';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import CreditCardForm from '../components/credit-cards/CreditCardForm';
import CreditCardPaymentForm from '../components/credit-cards/CreditCardPaymentForm';
import CreditCardSummary from '../components/credit-cards/creditcardsummary';
import { supabase } from '../lib/supabase';

const CreditCardsPage: React.FC = () => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledPayments, setScheduledPayments] = useState<Record<string, CreditCardPayment[]>>({});

  const fetchCreditCards = async () => {
    try {
      setIsLoading(true);
      const data = await getCreditCards();
      setCreditCards(data);

      // Fetch scheduled payments for each card
      const payments: Record<string, CreditCardPayment[]> = {};
      for (const card of data) {
        payments[card.id] = await getScheduledPayments(card);
      }
      setScheduledPayments(payments);
    } catch (err: any) {
      setError(err.message || 'Failed to load credit cards');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditCards();
  }, []);

  const handleSubmit = async (formData: Partial<CreditCard>) => {
    try {
      setIsSubmitting(true);
      if (selectedCard) {
        await updateCreditCard(selectedCard.id, formData);
      } else {
        await createCreditCard(formData);
      }
      setIsModalOpen(false);
      await fetchCreditCards();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (formData: Partial<CreditCardPayment>) => {
    try {
      setIsSubmitting(true);
      await createCreditCardPayment(formData as Omit<CreditCardPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
      setIsPaymentModalOpen(false);
      await fetchCreditCards();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (card: CreditCard) => {
    if (!confirm('Are you sure you want to delete this credit card?')) {
      return;
    }

    try {
      await deleteCreditCard(card.id);
      await fetchCreditCards();
    } catch (err: any) {
      setError(err.message || 'Failed to delete credit card');
      console.error(err);
    }
  };

  const getScheduledPayments = async (card: CreditCard): Promise<CreditCardPayment[]> => {
    const threeMonthsFromNow = addMonths(new Date(), 3);
    
    const { data: payments, error } = await supabase
      .from('credit_card_payments')
      .select('*')
      .eq('credit_card_id', card.id)
      .gt('payment_date', new Date().toISOString())
      .lte('payment_date', threeMonthsFromNow.toISOString())
      .order('payment_date', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled payments:', error);
      return [];
    }

    return payments as CreditCardPayment[];
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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

  const getUtilizationColor = (utilization: number) => {
    if (utilization <= 30) return 'bg-green-500';
    if (utilization <= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatPaymentSchedule = (card: CreditCard) => {
    const amount = card.payment_amount;
    
    switch (card.payment_frequency) {
      case 'weekly':
        return `${formatCurrency(amount)} every ${getWeekDayName(card.payment_week_day || 0)}`;
      case 'bi-weekly':
        return `${formatCurrency(amount)} every other ${getWeekDayName(card.payment_week_day || 0)}`;
      case 'bi-monthly':
        return `${formatCurrency(amount)} on the 15th and last day`;
      case 'monthly':
        return `${formatCurrency(amount)} on day ${card.payment_day}`;
      default:
        return 'No payment schedule set';
    }
  };

  const getWeekDayName = (day: number) => {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
  };

  const calculateUtilization = (card: CreditCard) => {
    return card.credit_limit > 0 ? (card.current_balance / card.credit_limit) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Credit Cards</h1>
        <Button
          variant="primary"
          onClick={() => {
            setSelectedCard(undefined);
            setIsModalOpen(true);
          }}
          leftIcon={<Plus size={20} />}
        >
          Add Credit Card
        </Button>
      </div>

      <CreditCardSummary creditCards={creditCards} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {creditCards.map((card) => (
          <div key={card.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {card.bank_name} •••• {card.last_four_digits}
                  </h2>
                  <p className="text-sm text-gray-500">{card.name}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCard(card);
                      setIsModalOpen(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(card)}
                    className="p-1 hover:bg-red-100 rounded-full text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(card.current_balance)}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Credit Utilization</span>
                    <span>{calculateUtilization(card).toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getUtilizationColor(calculateUtilization(card))}`}
                      style={{ width: `${Math.min(calculateUtilization(card), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Credit Limit</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(card.credit_limit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Interest Rate</p>
                    <p className="font-medium text-gray-900">
                      {card.interest_rate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Minimum Payment</p>
                    <p className="font-medium text-gray-900">
                      {formatCurrency(card.minimum_payment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment Schedule</p>
                    <p className="font-medium text-gray-900">
                      {formatPaymentSchedule(card)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Recent Payments</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCard(card);
                        setIsPaymentModalOpen(true);
                      }}
                      leftIcon={<DollarSign size={16} />}
                    >
                      Add Payment
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {card.recent_payments && card.recent_payments.length > 0 ? (
                      card.recent_payments.map(payment => (
                        <div key={payment.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-gray-500">
                              {format(parseISO(payment.payment_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500">Balance after:</p>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(payment.new_balance)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded">No recent payments</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Upcoming Payments</h3>
                  <div className="space-y-2">
                    {scheduledPayments[card.id]?.length > 0 ? (
                      scheduledPayments[card.id].map(payment => (
                        <div key={payment.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(payment.amount)}
                            </p>
                            <p className="text-gray-500">
                              {format(parseISO(payment.payment_date), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              payment.payment_type === 'recurring' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {payment.payment_type === 'recurring' ? 'Scheduled' : 'One-time'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded">No upcoming payments</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCard ? 'Edit Credit Card' : 'Add Credit Card'}
        size="lg"
      >
        <CreditCardForm
          card={selectedCard}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Add Payment"
        size="lg"
      >
        {selectedCard && (
          <CreditCardPaymentForm
            card={selectedCard}
            onSubmit={handlePaymentSubmit}
            onCancel={() => setIsPaymentModalOpen(false)}
            isLoading={isSubmitting}
          />
        )}
      </Modal>
    </div>
  );
};

export default CreditCardsPage;