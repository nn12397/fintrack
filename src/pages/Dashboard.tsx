import React, { useEffect, useState } from 'react';
import FinancialSummary from '../components/dashboard/FinancialSummary';
import CreditCardSummary from '../components/dashboard/CreditCardSummaryDash';
import UpcomingBills from '../components/dashboard/UpcomingBills';
import PayoffProgress from '../components/dashboard/PayoffProgress';
import TotalOverview from '../components/dashboard/TotalOverview';
import NextPaycheckOverview from '../components/dashboard/NextPaycheckOverview';
import { getNextPaycheckDate } from '../services/paycheck-service';
import { format, parseISO } from 'date-fns';
import IncomeBook from '../components/dashboard/Incomebook';

const NextPayDateDisplay = () => {
  const [nextPayDate, setNextPayDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNextPayDate() {
      try {
        setLoading(true);
        setError(null);
        const date = await getNextPaycheckDate();
        console.log('Raw next pay date:', date); // Debug log
        setNextPayDate(date);
      } catch (err) {
        console.error('Error fetching next pay date:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch next pay date');
      } finally {
        setLoading(false);
      }
    }

    fetchNextPayDate();
  }, []);

  if (loading) {
    return <div className="p-4 bg-gray-50 rounded-lg">Loading next pay date...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-lg font-semibold text-gray-900">Next Payday</h2>
      {nextPayDate ? (
        <p className="mt-2 text-2xl font-bold text-green-600">
          {format(parseISO(nextPayDate), 'MMMM d, yyyy')}
        </p>
      ) : (
        <p className="mt-2 text-gray-600">No upcoming pay date found</p>
      )}
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [isTotalOverviewExpanded, setIsTotalOverviewExpanded] = useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 lg:hidden">Dashboard</h1>
      
      <NextPayDateDisplay />
      <TotalOverview 
        isExpanded={isTotalOverviewExpanded}
        onToggle={() => setIsTotalOverviewExpanded(!isTotalOverviewExpanded)}
      />
      <NextPaycheckOverview />
      <IncomeBook />
      <FinancialSummary />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditCardSummary />
        <UpcomingBills />
      </div>
      
      <PayoffProgress />
    </div>
  );
};

export default Dashboard;