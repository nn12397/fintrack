import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  PiggyBank, 
  Plus, 
  Target,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SavingsAccounts from '../components/savings/SavingsAccounts';
import SavingsPlans from '../components/savings/SavingsPlans';
import SavingsOverview from '../components/savings/SavingsOverview';
import SavingsAccountForm from '../components/savings/SavingsAccountForm';
import SavingsPlanForm from '../components/savings/SavingsPlanForm';
import SavingsPaymentForm from '../components/savings/SavingsPaymentForm';
import type { SavingsAccount, SavingsPlan, SavingsPayment } from '../types';
import { getSavingsAccounts, createSavingsAccount, updateSavingsAccount } from '../services/savings-service';
import { getSavingsPlans, createSavingsPlan, deleteSavingsPlan, updateSavingsPlan } from '../services/savings-plan-service';
import { getRecentSavingsPayments, createSavingsPayment, deleteSavingsPayment } from '../services/savings-payment-service';

const SavingsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [plans, setPlans] = useState<SavingsPlan[]>([]);
  const [recentPayments, setRecentPayments] = useState<SavingsPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isAddPlanFormVisible, setIsAddPlanFormVisible] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SavingsPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [accountsData, plansData, paymentsData] = await Promise.all([
        getSavingsAccounts(),
        getSavingsPlans(),
        getRecentSavingsPayments(5)
      ]);
      setAccounts(accountsData);
      setPlans(plansData);
      setRecentPayments(paymentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load savings data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAccount = async (account: Partial<SavingsAccount>) => {
    try {
      setIsSubmitting(true);
      await createSavingsAccount(account);
      await fetchData();
      setIsAddAccountModalOpen(false);
      setSelectedAccount(null);
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAccount = async (account: Partial<SavingsAccount>) => {
    try {
      setIsSubmitting(true);
      if (!selectedAccount?.id) {
        throw new Error('No account selected for update');
      }
      await updateSavingsAccount(selectedAccount.id, account);
      await fetchData();
      setIsAddAccountModalOpen(false);
      setSelectedAccount(null);
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPlan = async (plan: Partial<SavingsPlan>) => {
    try {
      setIsSubmitting(true);
      await createSavingsPlan(plan);
      await fetchData();
      setIsAddPlanFormVisible(false);
      setSelectedAccount(null);
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePlan = async (plan: Partial<SavingsPlan>) => {
    try {
      setIsSubmitting(true);
      if (!plan.id) {
        throw new Error('No plan selected for update');
      }
      const { id, ...planData } = plan;
      await updateSavingsPlan(id, planData);
      await fetchData();
      setIsAddPlanFormVisible(false);
      setSelectedAccount(null);
      setSelectedPlan(null);
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAccount = (account: SavingsAccount) => {
    setSelectedAccount(account);
    setIsAddAccountModalOpen(true);
  };

  const handleAddPayment = async (planId: string) => {
    try {
      setIsSubmitting(true);
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Savings plan not found');
      }
      setSelectedPlanId(planId);
      setIsAddPaymentModalOpen(true);
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (payment: Omit<SavingsPayment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsSubmitting(true);
      const plan = plans.find(p => p.id === selectedPlanId);
      if (!plan) {
        throw new Error('Savings plan not found');
      }
      await createSavingsPayment({
        ...payment,
        savings_id: plan.savings_id,
      });
      await fetchData();
      setIsAddPaymentModalOpen(false);
      setSelectedPlanId(null);
    } catch (err) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPlan = (plan: SavingsPlan) => {
    setSelectedAccount(accounts.find(acc => acc.id === plan.savings_id) || null);
    setSelectedPlan(plan);
    setIsAddPlanFormVisible(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this savings plan?')) {
      return;
    }

    try {
      await deleteSavingsPlan(planId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete savings plan');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      await deleteSavingsPayment(paymentId);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg flex items-center">
        <span>{error}</span>
      </div>
    );
  }

  if (isAddPlanFormVisible && selectedAccount) {
    return (
      <SavingsPlanForm
        account={selectedAccount}
        plan={selectedPlan}
        onSubmit={selectedPlan ? handleUpdatePlan : handleAddPlan}
        onCancel={() => {
          setIsAddPlanFormVisible(false);
          setSelectedAccount(null);
          setSelectedPlan(null);
        }}
        isLoading={isSubmitting}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#1e293b]">Savings</h1>
        <div className="flex space-x-4">
          {accounts.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsAddPlanFormVisible(true)}
              leftIcon={<Target size={20} />}
            >
              Create Savings Plan
            </Button>
          )}
          <Button
            variant="primary"
            onClick={() => {
              setSelectedAccount(null);
              setIsAddAccountModalOpen(true);
            }}
            leftIcon={<Plus size={20} />}
          >
            Add Savings Account
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <SavingsOverview 
        accounts={accounts}
        plans={plans}
        recentPayments={recentPayments}
      />

      {/* Savings Accounts */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-[#1e293b]">Savings Accounts</h2>
        <SavingsAccounts
          accounts={accounts}
          onAddAccount={() => {
            setSelectedAccount(null);
            setIsAddAccountModalOpen(true);
          }}
          onEditAccount={handleEditAccount}
        />
      </div>

      {/* Savings Plans */}
      {accounts.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#1e293b]">Savings Plans</h2>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAccount(accounts[0]);
                setIsAddPlanFormVisible(true);
              }}
              leftIcon={<Plus size={20} />}
            >
              Create Plan
            </Button>
          </div>

          <SavingsPlans
            plans={plans}
            onAddPlan={() => {
              setSelectedAccount(accounts[0]);
              setIsAddPlanFormVisible(true);
            }}
            onAddPayment={handleAddPayment}
            onEditPlan={handleEditPlan}
            onDeletePlan={handleDeletePlan}
            onDeletePayment={handleDeletePayment}
          />
        </div>
      )}

      {/* Add/Edit Account Modal */}
      <Modal
        isOpen={isAddAccountModalOpen}
        onClose={() => {
          setIsAddAccountModalOpen(false);
          setSelectedAccount(null);
        }}
        title={selectedAccount ? 'Edit Savings Account' : 'Add Savings Account'}
        size="lg"
      >
        <SavingsAccountForm
          account={selectedAccount || undefined}
          onSubmit={selectedAccount ? handleUpdateAccount : handleAddAccount}
          onCancel={() => {
            setIsAddAccountModalOpen(false);
            setSelectedAccount(null);
          }}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => {
          setIsAddPaymentModalOpen(false);
          setSelectedPlanId(null);
        }}
        title="Add Payment"
        size="lg"
      >
        <SavingsPaymentForm
          accounts={accounts}
          payment={null}
          onSubmit={handlePaymentSubmit}
          onCancel={() => {
            setIsAddPaymentModalOpen(false);
            setSelectedPlanId(null);
          }}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default SavingsPage;