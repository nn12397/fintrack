import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types';

export async function getUserProfile() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as UserProfile;
}

export async function updateUserProfile(profile: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at'>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...profile,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as UserProfile;
}