import React, { useEffect, useState } from 'react';
import { getUserProfile, updateUserProfile } from '../services/profile-service';
import { getPaychecks } from '../services/paycheck-service';
import type { UserProfile, Paycheck } from '../types';
import { AlertTriangle, User, DollarSign, Pencil, Calendar } from 'lucide-react';
import Button from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isBefore, isAfter, isToday } from 'date-fns';
import ProfileForm from '../components/profile/ProfileForm';

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [paychecks, setPaychecks] = useState<Paycheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [profileData, paychecksData] = await Promise.all([
          getUserProfile(),
          getPaychecks()
        ]);
        
        if (profileData === null) {
          navigate('/login');
          return;
        }
        
        setProfile(profileData);
        setPaychecks(paychecksData);
      } catch (err: any) {
        if (err.message === 'User not authenticated') {
          navigate('/login');
          return;
        }
        setError(err.message || 'Failed to load profile');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSubmit = async (formData: Partial<UserProfile>) => {
    try {
      setIsSubmitting(true);
      const updatedProfile = await updateUserProfile(formData);
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatFrequency = (frequency: string) => {
    switch (frequency) {
      case 'weekly':
        return 'Weekly';
      case 'bi-weekly':
        return 'Bi-weekly';
      case 'bi-monthly':
        return 'Bi-monthly (15th & Last Day)';
      case 'monthly':
        return 'Monthly';
      case 'specific-date':
        return 'Specific Date';
      default:
        return frequency;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const getDaysBadge = (date: Date | null, isNext: boolean) => {
    if (!date) return null;
    
    const today = new Date();
    const days = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const absDays = Math.abs(days);
    
    if (isNext) {
      return (
        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {days === 0 ? 'Today' : `in ${absDays} day${absDays === 1 ? '' : 's'}`}
        </span>
      );
    } else {
      return (
        <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          {days === 0 ? 'Today' : `${absDays} day${absDays === 1 ? '' : 's'} ago`}
        </span>
      );
    }
  };

  // Calculate last and next paychecks
  const getLastAndNextPaychecks = () => {
    const today = new Date();
    let lastPaycheck: Date | null = null;
    let nextPaycheck: Date | null = null;

    // Sort paychecks by date
    const sortedPaychecks = [...paychecks].sort((a, b) => 
      parseISO(a.payment_date).getTime() - parseISO(b.payment_date).getTime()
    );

    // Find last and next paychecks
    for (const paycheck of sortedPaychecks) {
      const payDate = parseISO(paycheck.payment_date);
      
      if (isBefore(payDate, today) || isToday(payDate)) {
        lastPaycheck = payDate;
      } else if (isAfter(payDate, today)) {
        nextPaycheck = payDate;
        break;
      }
    }

    return { lastPaycheck, nextPaycheck };
  };

  const { lastPaycheck, nextPaycheck } = getLastAndNextPaychecks();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-48 bg-gray-200 rounded-lg"></div>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Financial Profile</h2>
              <p className="text-sm text-gray-500">Manage your financial information</p>
            </div>
          </div>

          <div className="space-y-6">
            {isEditing ? (
              <ProfileForm
                profile={profile}
                onSubmit={handleSubmit}
                onCancel={() => setIsEditing(false)}
                isLoading={isSubmitting}
              />
            ) : (
              <>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-500">Income Details</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      leftIcon={<Pencil size={16} />}
                    >
                      Edit
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-gray-500">Monthly Income</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900">
                        {formatCurrency(profile?.income_amount || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        <span className="text-sm text-gray-500">Frequency</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900">
                        {formatFrequency(profile?.income_frequency || 'monthly')}
                        {profile?.income_day && profile.income_frequency === 'specific-date' && 
                          ` (Day ${profile.income_day})`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <span className="text-sm text-gray-500">Start Date</span>
                      </div>
                      <span className="text-lg font-medium text-gray-900">
                        {profile?.income_start_date ? format(parseISO(profile.income_start_date), 'MMM d, yyyy') : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Last Pay Date</p>
                    <div className="flex items-center">
                      <p className="text-lg font-medium text-gray-900">
                        {formatDate(lastPaycheck)}
                      </p>
                      {getDaysBadge(lastPaycheck, false)}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Next Pay Date</p>
                    <div className="flex items-center">
                      <p className="text-lg font-medium text-gray-900">
                        {formatDate(nextPaycheck)}
                      </p>
                      {getDaysBadge(nextPaycheck, true)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Profile Created</p>
                    <p className="text-lg font-medium text-gray-900">
                      {format(parseISO(profile?.created_at || new Date().toISOString()), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="text-lg font-medium text-gray-900">
                      {format(parseISO(profile?.updated_at || new Date().toISOString()), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;