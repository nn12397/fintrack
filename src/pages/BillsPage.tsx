import React, { useEffect, useState } from 'react';
import { getBills, createBill, updateBill, deleteBill } from '../services/bill-service';
import { getCategories } from '../services/category-service';
import { getCreditCards } from '../services/credit-card-service';
import { getDebitCards } from '../services/debit-card-service';
import type { Bill, Category, CreditCard, DebitCard } from '../types';
import { format, addMonths, startOfMonth, endOfMonth, isToday, isFuture, differenceInDays, isSameDay } from 'date-fns';
import { 
  AlertTriangle, 
  Plus, 
  Pencil, 
  Trash2, 
  Clock, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Palette,
  CreditCard as CreditCardIcon,
  Wallet,
  Zap,
  CheckCircle2
} from 'lucide-react';
import Button from '../components/ui/Button';
import BillsDashboard from '../components/bills/BillsDashboard';
import Modal from '../components/ui/Modal';
import BillForm from '../components/bills/BillForm';
import CategoryManager from '../components/bills/CategoryManager';
import { supabase } from '../lib/supabase';

const BillsPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [debitCards, setDebitCards] = useState<DebitCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRecurringExpanded, setIsRecurringExpanded] = useState(true);
  const [isOneTimeExpanded, setIsOneTimeExpanded] = useState(true);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [billsData, categoriesData, creditCardsData, debitCardsData] = await Promise.all([
        getBills(),
        getCategories(),
        getCreditCards(),
        getDebitCards()
      ]);
      setBills(billsData);
      setCategories(categoriesData);
      setCreditCards(creditCardsData);
      setDebitCards(debitCardsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load bills');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddBill = () => {
    setSelectedBill(undefined);
    setIsModalOpen(true);
  };

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const handleDeleteBill = async (bill: Bill) => {
    if (!confirm('Are you sure you want to delete this bill?')) {
      return;
    }

    try {
      await deleteBill(bill.id);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to delete bill:', err);
      alert('Failed to delete bill. Please try again.');
    }
  };

  const handleSubmit = async (formData: Partial<Bill>) => {
    try {
      setIsSubmitting(true);
      if (selectedBill) {
        await updateBill(selectedBill.id, formData);
      } else {
        // Ensure required fields are present for new bills
        if (!formData.name || !formData.amount || !formData.due_date || !formData.category_id || !formData.bill_type) {
          throw new Error('Missing required fields');
        }
        await createBill({
          ...formData,
          name: formData.name,
          amount: formData.amount,
          due_date: formData.due_date,
          category_id: formData.category_id,
          bill_type: formData.bill_type,
          frequency: formData.frequency || 'monthly',
          is_autopay: formData.is_autopay || false,
          card_id: formData.card_id || null,
          notes: formData.notes || null,
          is_paid: formData.is_paid || false
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to save bill:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsPaid = async (bill: Bill) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ is_paid: !bill.is_paid })
        .eq('id', bill.id);

      if (error) throw error;

      // Update local state
      setBills((prevBills: Bill[]) => 
        prevBills.map((b: Bill) => b.id === bill.id ? { ...b, is_paid: !bill.is_paid } : b)
      );
    } catch (err: any) {
      console.error('Failed to update bill paid status:', err);
      alert('Failed to update bill status. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded"></div>
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

  const getWeekDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const formatRecurrenceDay = (bill: Bill): string => {
    if (bill.recurrence_interval === 'yearly' && bill.start_date) {
      return format(new Date(bill.start_date), 'MMM dd');
    }
    
    if (bill.recurrence_week_day !== null && bill.recurrence_week_day !== undefined) {
      return getWeekDayName(bill.recurrence_week_day);
    }
    if (bill.recurrence_day !== null && bill.recurrence_day !== undefined) {
      return `${bill.recurrence_day}${getOrdinalSuffix(bill.recurrence_day)}`;
    }
    return '';
  };

  const calculateMonthlyAmount = (bill: Bill): number => {
    if (bill.bill_type === 'one-time') return 0;

    switch (bill.recurrence_interval) {
      case 'weekly':
        return bill.amount * 52 / 12;
      case 'bi-weekly':
        return bill.amount * 26 / 12;
      case 'quarterly':
        return bill.amount / 3;
      case 'yearly':
        return bill.amount / 12;
      case 'monthly':
        return bill.amount;
      default:
        return 0;
    }
  };

  const getPaymentMethod = (bill: Bill): JSX.Element => {
    if (!bill.card_id) {
      return <span className="text-gray-500">Direct Payment</span>;
    }

    if (bill.card?.type === 'credit') {
      return (
        <div className="flex items-center space-x-2">
          <CreditCardIcon size={16} className="text-purple-500" />
          <span>{bill.card.name} (•••• {bill.card.last_four_digits})</span>
        </div>
      );
    }

    if (bill.card?.type === 'debit') {
      return (
        <div className="flex items-center space-x-2">
          <Wallet size={16} className="text-blue-500" />
          <span>{bill.card.bank_name} (•••• {bill.card.last_four_digits})</span>
        </div>
      );
    }

    return <span className="text-gray-500">Unknown Payment Method</span>;
  };

  const recurringBills = bills.filter(bill => bill.bill_type === 'recurring');
  const oneTimeBills = bills.filter(bill => bill.bill_type === 'one-time');

  const totalMonthlyAmount = recurringBills.reduce((total, bill) => 
    total + calculateMonthlyAmount(bill), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsCategoryModalOpen(true)}
            leftIcon={<Palette size={20} />}
          >
            Customize Categories
          </Button>
          <Button
            variant="primary"
            onClick={handleAddBill}
            leftIcon={<Plus size={20} />}
          >
            Add Bill
          </Button>
        </div>
      </div>

      <BillsDashboard
        bills={bills}
        categories={categories}
        isExpanded={isDashboardExpanded}
        onToggleExpand={() => setIsDashboardExpanded(!isDashboardExpanded)}
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div 
          className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
          onClick={() => setIsRecurringExpanded(!isRecurringExpanded)}
        >
          <div className="flex items-center space-x-2">
            <RefreshCw size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recurring Bills</h2>
            <span className="text-sm text-gray-500">({recurringBills.length})</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-700">
              <DollarSign size={18} className="text-green-600" />
              <span className="font-medium">Monthly Total:</span>
              <span className="text-green-600 font-semibold">{formatCurrency(totalMonthlyAmount)}</span>
            </div>
            {isRecurringExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
        
        {isRecurringExpanded && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recurringBills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{bill.name}</span>
                        {bill.is_autopay && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Zap size={12} className="mr-1" />
                            Auto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <span className="text-gray-900">{formatCurrency(bill.amount)}</span>
                        {bill.recurrence_interval !== 'monthly' && (
                          <span className="text-xs text-gray-500 block">
                            ({formatCurrency(calculateMonthlyAmount(bill))}/mo)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bill.recurrence_interval?.charAt(0).toUpperCase() + bill.recurrence_interval?.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatRecurrenceDay(bill)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: bill.category?.color || '#9CA3AF' }}
                        ></div>
                        {bill.category?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getPaymentMethod(bill)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!bill.is_paid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsPaid(bill)}
                            leftIcon={<CheckCircle2 size={16} />}
                            className="text-green-600 hover:text-green-700"
                          >
                            Mark as Paid
                          </Button>
                        )}
                        {bill.is_paid && (
                          <span 
                            className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:bg-green-200"
                            onClick={() => handleMarkAsPaid(bill)}
                          >
                            <CheckCircle2 size={12} />
                            Paid
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBill(bill)}
                          leftIcon={<Pencil size={16} />}
                          className="mr-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBill(bill)}
                          leftIcon={<Trash2 size={16} />}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div 
          className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
          onClick={() => setIsOneTimeExpanded(!isOneTimeExpanded)}
        >
          <div className="flex items-center space-x-2">
            <Clock size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">One-time Bills</h2>
            <span className="text-sm text-gray-500">({oneTimeBills.length})</span>
          </div>
          {isOneTimeExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        
        {isOneTimeExpanded && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {oneTimeBills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{bill.name}</span>
                        {bill.is_autopay && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Zap size={12} className="mr-1" />
                            Auto
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(bill.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-1 text-gray-400" />
                        {format(new Date(bill.due_date), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: bill.category?.color || '#9CA3AF' }}
                        ></div>
                        {bill.category?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getPaymentMethod(bill)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {!bill.is_paid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsPaid(bill)}
                            leftIcon={<CheckCircle2 size={16} />}
                            className="text-green-600 hover:text-green-700"
                          >
                            Mark as Paid
                          </Button>
                        )}
                        {bill.is_paid && (
                          <span 
                            className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer hover:bg-green-200"
                            onClick={() => handleMarkAsPaid(bill)}
                          >
                            <CheckCircle2 size={12} />
                            Paid
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBill(bill)}
                          leftIcon={<Pencil size={16} />}
                          className="mr-2"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBill(bill)}
                          leftIcon={<Trash2 size={16} />}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBill ? 'Edit Bill' : 'Add New Bill'}
        size="lg"
      >
        <BillForm
          bill={selectedBill}
          categories={categories}
          creditCards={creditCards}
          debitCards={debitCards}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <CategoryManager
        categories={categories}
        onCategoriesChange={fetchData}
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};

export default BillsPage;