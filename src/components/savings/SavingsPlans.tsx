import React, { useState, useEffect } from 'react';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';
import { Plus, Target, ChevronDown, ChevronUp, Trash2, Check, X, Pencil } from 'lucide-react';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import type { SavingsPlan, SavingsPayment } from '../../types';
import { getSavingsPayments } from '../../services/savings-payment-service';
import { deleteSavingsPayment, updatePaymentPaidStatus } from '../../services/savings-payment-service';

interface SavingsPlansProps {
  plans: SavingsPlan[];
  onAddPlan: () => void;
  onAddPayment: (planId: string) => void;
  onEditPlan: (plan: SavingsPlan) => void;
  onDeletePlan: (planId: string) => void;
  onDeletePayment: (paymentId: string) => void;
}

const SavingsPlans: React.FC<SavingsPlansProps> = ({
  plans,
  onAddPlan,
  onAddPayment,
  onEditPlan,
  onDeletePlan,
  onDeletePayment,
}) => {
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [payments, setPayments] = useState<Record<string, SavingsPayment[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [showActions, setShowActions] = useState<boolean>(false);

  useEffect(() => {
    const fetchPayments = async () => {
      const paymentsData: Record<string, SavingsPayment[]> = {};
      for (const plan of plans) {
        try {
          const planPayments = await getSavingsPayments(plan.savings_id);
          console.log('Fetched payments for plan', plan.id, ':', planPayments);
          paymentsData[plan.savings_id] = planPayments;
        } catch (error) {
          console.error(`Failed to fetch payments for plan ${plan.id}:`, error);
          paymentsData[plan.savings_id] = [];
        }
      }
      setPayments(paymentsData);
    };

    fetchPayments();
  }, [plans]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const togglePlanExpansion = (planId: string) => {
    setExpandedPlans(prev => {
      const next = new Set(prev);
      if (next.has(planId)) {
        next.delete(planId);
      } else {
        next.add(planId);
      }
      return next;
    });
  };

  const getUpcomingPayments = (plan: SavingsPlan) => {
    const today = startOfDay(new Date());
    return payments[plan.savings_id]?.filter(payment => 
      isAfter(parseISO(payment.payment_date), today)
    ).sort((a, b) => 
      parseISO(a.payment_date).getTime() - parseISO(b.payment_date).getTime()
    ) || [];
  };

  const getPastPayments = (plan: SavingsPlan) => {
    const today = startOfDay(new Date());
    const pastPayments = payments[plan.savings_id]?.filter(payment => 
      !isAfter(parseISO(payment.payment_date), today)
    ).sort((a, b) => 
      parseISO(b.payment_date).getTime() - parseISO(a.payment_date).getTime()
    ) || [];
    console.log('Past payments for plan', plan.id, ':', pastPayments);
    return pastPayments;
  };

  const handleDeletePayment = (paymentId: string) => {
    const confirmDelete = prompt('Type "DELETE" to confirm deletion:');
    if (confirmDelete === 'DELETE') {
      onDeletePayment(paymentId);
    }
  };

  const handlePaidStatusToggle = async (paymentId: string, currentStatus: boolean | null) => {
    try {
      let newStatus: boolean | null = null;
      if (currentStatus === null) newStatus = true;
      else if (currentStatus === true) newStatus = false;

      await updatePaymentPaidStatus(paymentId, newStatus);
      
      setPayments(prev => {
        const newPayments = { ...prev };
        Object.keys(newPayments).forEach(planId => {
          newPayments[planId] = newPayments[planId].map(payment => 
            payment.id === paymentId 
              ? { ...payment, paid_status: newStatus }
              : payment
          );
        });
        return newPayments;
      });
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  if (plans.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No savings plans yet</h3>
        <p className="text-gray-500 mb-4">Create a plan to reach your savings goals</p>
        <Button
          variant="primary"
          onClick={onAddPlan}
          leftIcon={<Plus size={20} />}
        >
          Create Savings Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {plans.map(plan => {
        const isExpanded = expandedPlans.has(plan.id);
        const upcomingPayments = getUpcomingPayments(plan);
        const pastPayments = getPastPayments(plan);
        console.log('Rendering plan', plan.id, 'with', pastPayments.length, 'past payments');

        return (
          <Card 
            key={plan.id}
            className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#1e293b]">{plan.name}</h3>
                  <p className="text-sm text-gray-600">
                    Target Date: {plan.target_date ? format(parseISO(plan.target_date), 'MMM d, yyyy') : 'No target date'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {plan.is_active && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditPlan(plan)}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeletePlan(plan.id)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {plan.goal_amount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Goal Amount</span>
                    <span className="font-bold text-[#1e293b]">
                      {formatCurrency(plan.goal_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Progress</span>
                  <span className="font-bold text-[#1e293b]">
                    {formatCurrency(plan.current_amount)}
                  </span>
                </div>
                {plan.goal_amount > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-[#f97316] h-2.5 rounded-full"
                      style={{ 
                        width: `${Math.min((plan.current_amount / plan.goal_amount) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Payment Schedule</p>
                    <p className="font-medium text-[#1e293b]">
                      {formatCurrency(plan.payment_amount)} {plan.payment_frequency || 'monthly'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {plan.schedule_type || 'Custom Schedule'} • {plan.payment_type || 'Monthly'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAddPayment(plan.id)}
                    >
                      Add Payment
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePlanExpansion(plan.id)}
                      className="p-1"
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4">
                    {upcomingPayments.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-700">Upcoming Payments</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowActions(!showActions)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {showActions ? 'Hide Actions' : 'Show Actions'}
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {upcomingPayments.map(payment => (
                            <div key={payment.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                {format(parseISO(payment.payment_date), 'MMM d, yyyy')}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-[#1e293b]">
                                  {formatCurrency(payment.amount)}
                                </span>
                                {showActions && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePaidStatusToggle(payment.id, payment.paid_status)}
                                      className="p-1"
                                    >
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        payment.paid_status === true 
                                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                          : payment.paid_status === false 
                                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                      }`}>
                                        {payment.paid_status === true ? (
                                          <Check size={14} />
                                        ) : payment.paid_status === false ? (
                                          <X size={14} />
                                        ) : (
                                          <Check size={14} />
                                        )}
                                      </div>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeletePayment(payment.id)}
                                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Past Payments</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowActions(!showActions)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {showActions ? 'Hide Actions' : 'Show Actions'}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {pastPayments.length > 0 ? (
                          pastPayments.map(payment => (
                            <div key={payment.id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                {format(parseISO(payment.payment_date), 'MMM d, yyyy')}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-[#1e293b]">
                                  {formatCurrency(payment.amount)}
                                </span>
                                {showActions && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handlePaidStatusToggle(payment.id, payment.paid_status)}
                                      className="p-1"
                                    >
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                        payment.paid_status === true 
                                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                          : payment.paid_status === false 
                                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                      }`}>
                                        {payment.paid_status === true ? (
                                          <Check size={14} />
                                        ) : payment.paid_status === false ? (
                                          <X size={14} />
                                        ) : (
                                          <Check size={14} />
                                        )}
                                      </div>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeletePayment(payment.id)}
                                      className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 size={16} />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-2">
                            No past payments
                          </p>
                        )}
                      </div>
                    </div>

                    {upcomingPayments.length === 0 && pastPayments.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        No payments recorded yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default SavingsPlans;