import { supabase } from '../lib/supabase';
import type { Category } from '../types';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) {
    throw error;
  }
  
  return data as Category[];
}

export async function createCategory(category: Omit<Category, 'id' | 'user_id' | 'created_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('categories')
    .insert({
      ...category,
      user_id: userData.user.id,
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as Category;
}

export async function updateCategory(id: string, category: Partial<Omit<Category, 'id' | 'user_id' | 'created_at'>>) {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as Category;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
  
  return true;
}