import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

export async function getUserProfile(): Promise<UserProfile | null> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile;
}