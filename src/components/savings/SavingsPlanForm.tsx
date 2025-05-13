import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, addWeeks, differenceInMonths, parseISO } from 'date-fns';
import { Calculator, Calendar, DollarSign, Target, TrendingUp, ArrowRight, PiggyBank } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Card } from '../ui/Card';
import type { SavingsPlan, SavingsAccount, UserProfile } from '../../types';
import { calculateFinancialSummary } from '../../services/budget-service';
import { getUserProfile } from '../../services/profile-service';
import { getUpcomingPaychecks } from '../../services/paycheck-service';

interface SavingsPlanFormProps {
  account: SavingsAccount;
  plan?: SavingsPlan | null;
  onSubmit: (plan: Partial<SavingsPlan>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type Step = 'initial' | 'details' | 'payment_frequency' | 'scenarios' | 'review';
type PlanType = 'goal_amount' | 'running_savings';

const SavingsPlanForm: React.FC<SavingsPlanFormProps> = ({
  account,
  plan,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(plan ? 'initial' : 'initial');
  const [planType, setPlanType] = useState<PlanType | null>(plan ? (plan.goal_amount > 0 ? 'goal_amount' : 'running_savings') : null);
  const [formData, setFormData] = useState<Partial<SavingsPlan>>({
    id: plan?.id,
    savings_id: account.id,
    name: plan?.name || '',
    goal_amount: plan?.goal_amount || 0,
    target_date: plan?.target_date || null,
    current_amount: account.current_balance,
    payment_amount: plan?.payment_amount || 0,
    payment_day: plan?.payment_day || 1,
    payment_week_day: plan?.payment_week_day || null,
    start_date: plan?.start_date || format(new Date(), 'yyyy-MM-dd'),
    is_active: plan?.is_active ?? true,
    plan_type: plan?.plan_type || 'goal_amount',
    schedule_type: plan?.schedule_type || 'Custom Schedule',
    payment_type: plan?.payment_type || 'Monthly',
  });

  const [financialSummary, setFinancialSummary] = useState<{
    income: number;
    total_bills: number;
    available_income: number;
  } | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [scenarios, setScenarios] = useState<{
    monthly: number;
    biweekly: number;
    weekly: number;
  }>({
    monthly: 0,
    biweekly: 0,
    weekly: 0,
  });

  const [selectedScenario, setSelectedScenario] = useState<{
    monthlyPayment: number;
    paycheckPayment: number;
    monthsToTarget: number;
    totalPayments: number;
    targetDate: Date;
  } | null>(plan ? {
    monthlyPayment: plan.payment_amount,
    paycheckPayment: plan.payment_frequency === 'paycheck' ? plan.payment_amount / 2 : plan.payment_amount,
    monthsToTarget: plan.target_date ? differenceInMonths(parseISO(plan.target_date), new Date()) : 12,
    totalPayments: plan.target_date ? differenceInMonths(parseISO(plan.target_date), new Date()) : 12,
    targetDate: plan.target_date ? parseISO(plan.target_date) : addMonths(new Date(), 12)
  } : null);

  const [upcomingPaychecks, setUpcomingPaychecks] = useState<{ payment_date: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summary, profile, paychecks] = await Promise.all([
          calculateFinancialSummary(),
          getUserProfile(),
          getUpcomingPaychecks()
        ]);

        // Calculate monthly income based on frequency
        let monthlyIncome = profile?.income_amount || 0;
        switch (profile?.income_frequency) {
          case 'weekly':
            monthlyIncome *= 4.33; // Average weeks per month
            break;
          case 'bi-weekly':
            monthlyIncome *= 2.17; // Average bi-weekly periods per month
            break;
          case 'bi-monthly':
            monthlyIncome *= 2; // 2 payments per month
            break;
          // monthly is already correct, no multiplication needed
        }

        setFinancialSummary({
          ...summary,
          income: monthlyIncome
        });
        setUserProfile(profile);
        setUpcomingPaychecks(paychecks);
      } catch (err) {
        console.error('Failed to load financial data:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (formData.goal_amount && formData.target_date) {
      const targetDate = parseISO(formData.target_date);
      const startDate = parseISO(formData.start_date || format(new Date(), 'yyyy-MM-dd'));
      const monthsToTarget = differenceInMonths(targetDate, startDate);
      
      if (monthsToTarget > 0) {
        const remainingAmount = formData.goal_amount - (formData.current_amount || 0);
        const monthlyAmount = remainingAmount / monthsToTarget;

        // Calculate paycheck amounts based on user's income frequency
        let biweeklyAmount = 0;
        let weeklyAmount = 0;

        if (userProfile) {
          switch (userProfile.income_frequency) {
            case 'weekly':
              weeklyAmount = monthlyAmount / 4.33; // Average weeks per month
              biweeklyAmount = weeklyAmount * 2;
              break;
            case 'bi-weekly':
              biweeklyAmount = monthlyAmount / 2.17; // Average bi-weekly periods per month
              weeklyAmount = biweeklyAmount / 2;
              break;
            case 'bi-monthly':
              biweeklyAmount = monthlyAmount / 2; // 2 payments per month
              weeklyAmount = biweeklyAmount / 2;
              break;
            case 'monthly':
              biweeklyAmount = monthlyAmount / 2; // Split monthly amount into two payments
              weeklyAmount = monthlyAmount / 4.33; // Average weeks per month
              break;
            case 'specific-date':
              // For specific date, treat it as monthly but split into two payments
              biweeklyAmount = monthlyAmount / 2;
              weeklyAmount = monthlyAmount / 4.33;
              break;
          }
        }

        setScenarios({
          monthly: monthlyAmount,
          biweekly: biweeklyAmount,
          weekly: weeklyAmount,
        });
      }
    }
  }, [formData.goal_amount, formData.target_date, formData.current_amount, formData.start_date, userProfile]);

  const handleNext = () => {
    if (currentStep === 'initial') {
      if (!formData.name?.trim()) {
        setError('Plan name is required');
        return;
      }
      if (!planType) {
        setError('Please select a plan type');
        return;
      }
      // Skip details step for running savings
      setCurrentStep(planType === 'running_savings' ? 'payment_frequency' : 'details');
    } else if (currentStep === 'details') {
      if (planType === 'goal_amount' && !formData.goal_amount) {
        setError('Goal amount is required');
        return;
      }
      setCurrentStep('payment_frequency');
    } else if (currentStep === 'payment_frequency') {
      setCurrentStep('scenarios');
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('initial');
    } else if (currentStep === 'payment_frequency') {
      // Go back to initial step for running savings, details step for goal amount
      setCurrentStep(planType === 'running_savings' ? 'initial' : 'details');
    } else if (currentStep === 'scenarios') {
      setCurrentStep('payment_frequency');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Prepare payment schedule based on frequency
      let paymentDay = null;
      let paymentWeekDay = null;
      let scheduleType = 'Custom Schedule';
      let paymentType = 'Monthly';

      if (formData.schedule_type === 'Per Paycheck' && userProfile) {
        // Use profile data for paycheck-based payments
        paymentDay = userProfile.payment_day;
        paymentWeekDay = userProfile.payment_week_day;
        scheduleType = 'Per Paycheck';
        paymentType = userProfile.income_frequency === 'weekly' ? 'Weekly' :
                     userProfile.income_frequency === 'bi-weekly' ? 'Bi-Weekly' :
                     userProfile.income_frequency === 'bi-monthly' ? 'Bi-Monthly' : 'Monthly';
      } else {
        paymentDay = formData.payment_day || 1;
        paymentWeekDay = null;
        paymentType = 'Monthly';
      }

      const formDataToSubmit = {
        ...formData,
        savings_id: account.id,
        payment_amount: formData.schedule_type === 'Per Paycheck' 
          ? selectedScenario.paycheckPayment 
          : selectedScenario.monthlyPayment,
        payment_day: paymentDay,
        payment_week_day: paymentWeekDay,
        is_active: true,
        plan_type: planType,
        target_date: planType === 'goal_amount' ? formData.target_date : null,
        goal_amount: planType === 'goal_amount' ? formData.goal_amount : 0,
        schedule_type: scheduleType,
        payment_type: paymentType,
      };

      if (plan) {
        // Update existing plan - include id and created_at
        await onSubmit({
          ...formDataToSubmit,
          id: plan.id,
          created_at: plan.created_at,
        });
      } else {
        // Create new plan - exclude id and created_at
        const { id, created_at, ...newPlanData } = formDataToSubmit;
        await onSubmit(newPlanData);
      }

      navigate('/savings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save savings plan');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleFrequencySelect = (frequency: string) => {
    if (frequency === 'paycheck' && userProfile) {
      setFormData((prev: Partial<SavingsPlan>) => ({
        ...prev,
        schedule_type: 'Per Paycheck',
        payment_type: userProfile.income_frequency === 'weekly' ? 'Weekly' :
                     userProfile.income_frequency === 'bi-weekly' ? 'Bi-Weekly' :
                     userProfile.income_frequency === 'bi-monthly' ? 'Bi-Monthly' : 'Monthly',
        payment_day: userProfile.payment_day,
        payment_week_day: userProfile.payment_week_day,
        payment_amount: scenarios[frequency as keyof typeof scenarios] || 0
      }));
    } else {
      setFormData((prev: Partial<SavingsPlan>) => ({
        ...prev,
        schedule_type: 'Custom Schedule',
        payment_type: 'Monthly',
        payment_amount: scenarios[frequency as keyof typeof scenarios] || 0,
        payment_day: frequency === 'monthly' ? 1 : null,
        payment_week_day: ['weekly', 'bi-weekly'].includes(frequency) ? 1 : null,
      }));
    }
  };

  const handleScenarioSelect = (scenario: {
    monthlyPayment: number;
    paycheckPayment: number;
    monthsToTarget: number;
    totalPayments: number;
    targetDate: Date;
  }) => {
    setSelectedScenario(scenario);
    setFormData(prev => ({
      ...prev,
      payment_amount: formData.schedule_type === 'Per Paycheck' ? scenario.paycheckPayment : scenario.monthlyPayment,
      target_date: format(scenario.targetDate, 'yyyy-MM-dd')
    }));
    setCurrentStep('review');
  };

  const calculateMonthlyPayment = (percentage: number) => {
    const availableSavings = financialSummary?.available_income || 0;
    const monthlyPayment = availableSavings * (percentage / 100);
    let paycheckPayment = monthlyPayment;

    // Calculate paycheck payment based on user's income frequency
    if (userProfile && formData.schedule_type === 'Per Paycheck') {
      switch (userProfile.income_frequency) {
        case 'weekly':
          paycheckPayment = monthlyPayment / 4.33; // Average weeks per month
          break;
        case 'bi-weekly':
          paycheckPayment = monthlyPayment / 2.17; // Average bi-weekly periods per month
          break;
        case 'bi-monthly':
          paycheckPayment = monthlyPayment / 2; // 2 payments per month
          break;
        case 'monthly':
          paycheckPayment = monthlyPayment / 2; // Split monthly amount into two payments
          break;
        case 'specific-date':
          paycheckPayment = monthlyPayment / 2; // Split monthly amount into two payments
          break;
      }
    }

    const monthsToTarget = formData.target_date 
      ? differenceInMonths(new Date(formData.target_date), new Date())
      : 12;

    const totalPayments = formData.schedule_type === 'Per Paycheck' 
      ? Math.ceil(monthsToTarget * (userProfile?.income_frequency === 'weekly' ? 4.33 : 2.17))
      : monthsToTarget;

    return {
      monthlyPayment,
      paycheckPayment,
      monthsToTarget,
      totalPayments,
      isFeasible: monthlyPayment <= availableSavings
    };
  };

  const renderInitialStep = () => (
    <Card className="p-8 bg-gradient-to-br from-white to-blue-50 border border-blue-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Create Your Savings Plan</h2>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <div className="space-y-8">
        <Input
          label="Plan Name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          startAdornment={<Target size={18} className="text-blue-500" />}
          required
          className="bg-white/80 backdrop-blur-sm"
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Select Plan Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                planType === 'goal_amount' 
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
              onClick={() => setPlanType('goal_amount')}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${planType === 'goal_amount' ? 'bg-blue-500' : 'bg-gray-100'}`}>
                  <Target size={24} className={planType === 'goal_amount' ? 'text-white' : 'text-gray-500'} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Savings Goal Amount</h4>
                  <p className="text-sm text-gray-500 mt-1">Set a specific amount to save</p>
                </div>
              </div>
            </div>

            <div 
              className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                planType === 'running_savings' 
                  ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
              onClick={() => setPlanType('running_savings')}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${planType === 'running_savings' ? 'bg-blue-500' : 'bg-gray-100'}`}>
                  <TrendingUp size={24} className={planType === 'running_savings' ? 'text-white' : 'text-gray-500'} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Running Savings</h4>
                  <p className="text-sm text-gray-500 mt-1">Save a consistent amount regularly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderDetailsStep = () => (
    <Card className="p-8 bg-gradient-to-br from-white to-indigo-50 border border-indigo-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Plan Details</h2>
        <Button variant="outline" onClick={() => setCurrentStep('initial')}>
          Back
        </Button>
      </div>
      <div className="space-y-8">
        {planType === 'goal_amount' && (
          <>
            <Input
              type="number"
              label="Goal Amount"
              name="goal_amount"
              value={formData.goal_amount}
              onChange={(e) => setFormData(prev => ({ ...prev, goal_amount: parseFloat(e.target.value) || 0 }))}
              startAdornment={<DollarSign size={18} className="text-indigo-500" />}
              step="0.01"
              min="0"
              required
              className="bg-white/80 backdrop-blur-sm"
            />
            <Input
              type="date"
              label="Target Date (Optional)"
              name="target_date"
              value={formData.target_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value || null }))}
              startAdornment={<Calendar size={18} className="text-indigo-500" />}
              className="bg-white/80 backdrop-blur-sm"
            />
          </>
        )}
      </div>
    </Card>
  );

  const renderPaymentFrequencyStep = () => (
    <Card className="p-8 bg-gradient-to-br from-white to-purple-50 border border-purple-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-900">Payment Schedule</h2>
        <Button variant="outline" onClick={() => setCurrentStep(planType === 'running_savings' ? 'initial' : 'details')}>
          Back
        </Button>
      </div>
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
              formData.schedule_type === 'Custom Schedule' 
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-lg' 
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
            }`}
            onClick={() => handleFrequencySelect('monthly')}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${formData.schedule_type === 'Custom Schedule' ? 'bg-purple-500' : 'bg-gray-100'}`}>
                <Calendar size={24} className={formData.schedule_type === 'Custom Schedule' ? 'text-white' : 'text-gray-500'} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Monthly Payments</h4>
                <p className="text-sm text-gray-500 mt-1">Pay on the same day each month</p>
              </div>
            </div>
          </div>

          <div 
            className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
              formData.schedule_type === 'Per Paycheck' 
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-lg' 
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
            }`}
            onClick={() => handleFrequencySelect('paycheck')}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${formData.schedule_type === 'Per Paycheck' ? 'bg-purple-500' : 'bg-gray-100'}`}>
                <DollarSign size={24} className={formData.schedule_type === 'Per Paycheck' ? 'text-white' : 'text-gray-500'} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Paycheck-Based</h4>
                <p className="text-sm text-gray-500 mt-1">Pay when you receive your paycheck</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderFinancialSummary = () => (
    <Card className="p-8 mb-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-8">Your Financial Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-blue-100">
          <p className="text-sm text-gray-600 mb-2">Monthly Income</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary?.income || 0)}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-blue-100">
          <p className="text-sm text-gray-600 mb-2">Monthly Bills</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary?.total_bills || 0)}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-blue-100">
          <p className="text-sm text-gray-600 mb-2">Available for Savings</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency((financialSummary?.income || 0) - (financialSummary?.total_bills || 0))}
          </p>
        </div>
      </div>
    </Card>
  );

  const renderScenariosStep = () => {
    if (planType === 'goal_amount') {
      return renderGoalAmountScenarios();
    } else {
      return renderRunningSavingsScenarios();
    }
  };

  const renderGoalAmountScenarios = () => {
    const availableSavings = (financialSummary?.income || 0) - (financialSummary?.total_bills || 0);
    const remainingAmount = formData.goal_amount - (formData.current_amount || 0);
    const hasTargetDate = !!formData.target_date;
    const isPaycheckBased = formData.schedule_type === 'Per Paycheck';
    
    const calculateMonthlyPayment = (percentage: number) => {
      const monthlyPayment = availableSavings * (percentage / 100);
      const paycheckPayment = isPaycheckBased ? monthlyPayment / 2 : monthlyPayment; // Assuming bi-weekly paychecks
      
      if (hasTargetDate) {
        const targetDate = parseISO(formData.target_date!);
        const startDate = parseISO(formData.start_date || format(new Date(), 'yyyy-MM-dd'));
        const monthsToTarget = differenceInMonths(targetDate, startDate);
        return {
          monthlyPayment,
          paycheckPayment,
          monthsToTarget,
          isFeasible: monthlyPayment >= (remainingAmount / monthsToTarget),
          totalPayments: Math.ceil(remainingAmount / monthlyPayment)
        };
      }
      return {
        monthlyPayment,
        paycheckPayment,
        monthsToTarget: Math.ceil(remainingAmount / monthlyPayment),
        isFeasible: true,
        totalPayments: Math.ceil(remainingAmount / monthlyPayment)
      };
    };

    const scenarios = [
      { percentage: 100, label: 'Aggressive Savings', description: 'Use 100% of available savings' },
      { percentage: 50, label: 'Balanced Approach', description: 'Use 50% of available savings' },
      { percentage: 25, label: 'Conservative Savings', description: 'Use 25% of available savings' }
    ];

    return (
      <>
        {renderFinancialSummary()}
        <Card className="p-8 bg-gradient-to-br from-white to-blue-50 border border-blue-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Savings Scenarios</h2>
            <Button variant="outline" onClick={() => setCurrentStep('payment_frequency')}>
              Back
            </Button>
          </div>
          <div className="space-y-8">
            {scenarios.map((scenario, index) => {
              const { monthlyPayment, paycheckPayment, monthsToTarget, isFeasible, totalPayments } = calculateMonthlyPayment(scenario.percentage);
              const targetDate = addMonths(new Date(), monthsToTarget);
              
              return (
                <div key={index} className="bg-white/80 backdrop-blur-sm border-2 border-blue-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">{scenario.label}</h3>
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {scenario.description}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {isPaycheckBased ? (
                      <>
                        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                          <p className="text-sm text-gray-600 mb-2">Per Paycheck</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(paycheckPayment)}</p>
                        </div>
                        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                          <p className="text-sm text-gray-600 mb-2">Monthly Total</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyPayment)}</p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                        <p className="text-sm text-gray-600 mb-2">Monthly Payment</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyPayment)}</p>
                      </div>
                    )}
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                      <p className="text-sm text-gray-600 mb-2">Total Payments</p>
                      <p className="text-2xl font-bold text-gray-900">{totalPayments}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-3">Estimated Completion</p>
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(12, monthsToTarget) }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full ${
                              i < monthsToTarget ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {format(targetDate, 'MMM yyyy')}
                      </span>
                    </div>
                  </div>

                  {!isFeasible && hasTargetDate && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <p className="text-sm text-yellow-700">
                        This scenario would require more than your available savings to meet the target date.
                        Consider adjusting your target date or choosing a different scenario.
                      </p>
                    </div>
                  )}

                  <div className="mt-6">
                    <Button
                      variant="primary"
                      onClick={() => handleScenarioSelect({
                        monthlyPayment,
                        paycheckPayment,
                        monthsToTarget,
                        totalPayments,
                        targetDate
                      })}
                      disabled={!isFeasible && hasTargetDate}
                    >
                      Select Scenario
                    </Button>
                  </div>
                </div>
              );
            })}

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-100 rounded-xl p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Custom Scenario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isPaycheckBased ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per Paycheck Amount
                      </label>
                      <Input
                        type="number"
                        value={formData.payment_amount / 2}
                        onChange={(e) => {
                          const paycheckAmount = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ 
                            ...prev, 
                            payment_amount: paycheckAmount * 2
                          }));
                        }}
                        step="0.01"
                        min="0"
                        className="bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Total
                      </label>
                      <Input
                        type="number"
                        value={formData.payment_amount}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          payment_amount: parseFloat(e.target.value) || 0 
                        }))}
                        step="0.01"
                        min="0"
                        disabled
                        className="bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Payment
                    </label>
                    <Input
                      type="number"
                      value={formData.payment_amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        payment_amount: parseFloat(e.target.value) || 0 
                      }))}
                      step="0.01"
                      min="0"
                      className="bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Percentage of Available Savings
                  </label>
                  <Input
                    type="number"
                    value={(formData.payment_amount / availableSavings * 100) || 0}
                    onChange={(e) => {
                      const percentage = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ 
                        ...prev, 
                        payment_amount: availableSavings * (percentage / 100)
                      }));
                    }}
                    step="1"
                    min="0"
                    max="100"
                    className="bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() => {
                    const monthsToTarget = Math.ceil(remainingAmount / formData.payment_amount);
                    const targetDate = addMonths(new Date(), monthsToTarget);
                    setFormData(prev => ({ ...prev, target_date: format(targetDate, 'yyyy-MM-dd') }));
                  }}
                >
                  See Scenario
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </>
    );
  };

  const renderRunningSavingsScenarios = () => {
    const availableSavings = (financialSummary?.income || 0) - (financialSummary?.total_bills || 0);
    const isPaycheckBased = formData.schedule_type === 'Per Paycheck';
    
    const calculateProjections = (percentage: number) => {
      const monthlyPayment = availableSavings * (percentage / 100);
      const paycheckPayment = isPaycheckBased ? monthlyPayment / 2 : monthlyPayment; // Assuming bi-weekly paychecks
      
      return {
        threeMonths: monthlyPayment * 3,
        sixMonths: monthlyPayment * 6,
        twelveMonths: monthlyPayment * 12,
        monthlyPayment,
        paycheckPayment
      };
    };

    const scenarios = [
      { percentage: 25, label: 'Conservative Savings', description: 'Use 25% of available savings' },
      { percentage: 50, label: 'Balanced Approach', description: 'Use 50% of available savings' },
      { percentage: 75, label: 'Aggressive Savings', description: 'Use 75% of available savings' }
    ];

    return (
      <>
        {renderFinancialSummary()}
        <Card className="p-8 bg-gradient-to-br from-white to-blue-50 border border-blue-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900">Savings Projections</h2>
            <Button variant="outline" onClick={() => setCurrentStep('payment_frequency')}>
              Back
            </Button>
          </div>
          <div className="space-y-8">
            {scenarios.map((scenario, index) => {
              const { threeMonths, sixMonths, twelveMonths, monthlyPayment, paycheckPayment } = calculateProjections(scenario.percentage);
              
              return (
                <div key={index} className="bg-white/80 backdrop-blur-sm border-2 border-blue-100 rounded-xl p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">{scenario.label}</h3>
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {scenario.description}
                    </span>
                  </div>

                  {isPaycheckBased ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                        <p className="text-sm text-gray-600 mb-2">Per Paycheck</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(paycheckPayment)}</p>
                      </div>
                      <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                        <p className="text-sm text-gray-600 mb-2">Monthly Total</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyPayment)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 mb-8">
                      <p className="text-sm text-gray-600 mb-2">Monthly Payment</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyPayment)}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-blue-100">
                      <p className="text-sm text-gray-600 mb-2">3 Months</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(threeMonths)}</p>
                      <div className="mt-4 flex space-x-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-blue-100">
                      <p className="text-sm text-gray-600 mb-2">6 Months</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(sixMonths)}</p>
                      <div className="mt-4 flex space-x-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />
                        ))}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-blue-100">
                      <p className="text-sm text-gray-600 mb-2">12 Months</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(twelveMonths)}</p>
                      <div className="mt-4 flex space-x-1">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      variant="primary"
                      onClick={() => handleScenarioSelect({
                        monthlyPayment,
                        paycheckPayment,
                        monthsToTarget: 12,
                        totalPayments: 12,
                        targetDate: addMonths(new Date(), 12)
                      })}
                    >
                      Select Scenario
                    </Button>
                  </div>
                </div>
              );
            })}

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-100 rounded-xl p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Custom Scenario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isPaycheckBased ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Per Paycheck Amount
                      </label>
                      <Input
                        type="number"
                        value={formData.payment_amount / 2}
                        onChange={(e) => {
                          const paycheckAmount = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ 
                            ...prev, 
                            payment_amount: paycheckAmount * 2
                          }));
                        }}
                        step="0.01"
                        min="0"
                        className="bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Total
                      </label>
                      <Input
                        type="number"
                        value={formData.payment_amount}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          payment_amount: parseFloat(e.target.value) || 0 
                        }))}
                        step="0.01"
                        min="0"
                        disabled
                        className="bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Payment
                    </label>
                    <Input
                      type="number"
                      value={formData.payment_amount}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        payment_amount: parseFloat(e.target.value) || 0 
                      }))}
                      step="0.01"
                      min="0"
                      className="bg-white/80 backdrop-blur-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Percentage of Available Savings
                  </label>
                  <Input
                    type="number"
                    value={(formData.payment_amount / availableSavings * 100) || 0}
                    onChange={(e) => {
                      const percentage = parseFloat(e.target.value) || 0;
                      setFormData(prev => ({ 
                        ...prev, 
                        payment_amount: availableSavings * (percentage / 100)
                      }));
                    }}
                    step="1"
                    min="0"
                    max="100"
                    className="bg-white/80 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div className="mt-6">
                <Button
                  variant="primary"
                  onClick={() => {
                    const { threeMonths, sixMonths, twelveMonths } = calculateProjections(
                      (formData.payment_amount / availableSavings * 100)
                    );
                    setFormData(prev => ({
                      ...prev,
                      custom_scenario: {
                        threeMonths,
                        sixMonths,
                        twelveMonths
                      }
                    }));
                  }}
                >
                  Run Scenario
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </>
    );
  };

  const renderReviewStep = () => {
    if (!selectedScenario) return null;

    const formatPaymentFrequency = (frequency: string) => {
      if (frequency === 'Per Paycheck') {
        switch (userProfile?.income_frequency) {
          case 'weekly':
            return 'Weekly';
          case 'bi-weekly':
            return 'Bi-Weekly';
          case 'bi-monthly':
            return 'Bi-Monthly';
          case 'monthly':
            return 'Monthly';
          default:
            return 'Paycheck-Based';
        }
      }
      return 'Monthly';
    };

    const renderPaymentScheduleInput = () => {
      if (formData.schedule_type === 'Custom Schedule') {
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Day of Month
            </label>
            <Input
              type="number"
              value={formData.payment_day || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                payment_day: parseInt(e.target.value) || null 
              }))}
              min="1"
              max="31"
              className="bg-white/80 backdrop-blur-sm"
            />
          </div>
        );
      }
      return null;
    };

    const generateMonthlyBreakdown = () => {
      const breakdown = [];
      const startDate = new Date();
      const isPaycheckBased = formData.schedule_type === 'Per Paycheck';
      const paymentAmount = isPaycheckBased ? selectedScenario.paycheckPayment : selectedScenario.monthlyPayment;
      let runningTotal = formData.current_amount || 0;

      if (isPaycheckBased && upcomingPaychecks.length > 0) {
        // Use actual paycheck dates for the breakdown
        const relevantPaychecks = upcomingPaychecks.slice(0, 24); // Get next 24 paychecks (12 months worth)
        
        let currentMonth = '';
        let monthTotal = 0;
        let monthPayments: { date: string; amount: number }[] = [];

        relevantPaychecks.forEach((paycheck, index) => {
          const paymentDate = parseISO(paycheck.payment_date);
          const monthYear = format(paymentDate, 'MMMM yyyy');
          
          if (monthYear !== currentMonth) {
            // Save previous month's data if it exists
            if (currentMonth) {
              breakdown.push({
                month: currentMonth,
                payments: monthPayments,
                monthTotal,
                runningTotal
              });
            }
            
            // Start new month
            currentMonth = monthYear;
            monthTotal = 0;
            monthPayments = [];
          }

          monthPayments.push({
            date: format(paymentDate, 'MMM d, yyyy'),
            amount: paymentAmount
          });
          monthTotal += paymentAmount;
          runningTotal += paymentAmount;
        });

        // Add the last month
        if (currentMonth) {
          breakdown.push({
            month: currentMonth,
            payments: monthPayments,
            monthTotal,
            runningTotal
          });
        }
      } else {
        // Monthly payment breakdown
        for (let i = 0; i < 12; i++) {
          const currentDate = addMonths(startDate, i);
          const monthTotal = paymentAmount;
          runningTotal += monthTotal;

          breakdown.push({
            month: format(currentDate, 'MMMM yyyy'),
            payments: [{
              date: format(currentDate, 'MMM d, yyyy'),
              amount: paymentAmount
            }],
            monthTotal,
            runningTotal
          });
        }
      }

      return breakdown;
    };

    const monthlyBreakdown = generateMonthlyBreakdown();

    return (
      <Card className="p-8 bg-gradient-to-br from-white to-green-50 border border-green-100">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900">Review Your Savings Plan</h2>
          <Button variant="outline" onClick={() => setCurrentStep('scenarios')}>
            Back
          </Button>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-green-100 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Plan Name</p>
              <p className="text-lg font-medium text-gray-900">{formData.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Payment Frequency</p>
              <p className="text-lg font-medium text-gray-900">{formatPaymentFrequency(formData.schedule_type || '')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Payment Amount</p>
              <p className="text-lg font-medium text-gray-900">
                {formatCurrency(formData.payment_amount)}
              </p>
            </div>
            {planType === 'goal_amount' && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Target Date</p>
                <p className="text-lg font-medium text-gray-900">
                  {format(selectedScenario.targetDate, 'MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {renderPaymentScheduleInput()}
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">12-Month Breakdown</h3>
          {monthlyBreakdown.map((month, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-green-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">{month.month}</h4>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Month Total</p>
                  <p className="text-lg font-medium text-gray-900">{formatCurrency(month.monthTotal)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {month.payments.map((payment, pIndex) => (
                  <div key={pIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <p className="text-sm text-gray-600">{payment.date}</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">Running Total</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(month.runningTotal)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Create Savings Plan</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {currentStep === 'initial' && renderInitialStep()}
      {currentStep === 'details' && renderDetailsStep()}
      {currentStep === 'payment_frequency' && renderPaymentFrequencyStep()}
      {currentStep === 'scenarios' && renderScenariosStep()}
      {currentStep === 'review' && renderReviewStep()}

      <div className="flex justify-end space-x-4">
        {currentStep === 'review' ? (
          <Button
            type="submit"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {plan ? 'Update Savings Plan' : 'Confirm Savings Plan'}
          </Button>
        ) : currentStep !== 'scenarios' ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNext}
            disabled={isLoading}
          >
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default SavingsPlanForm;