import { supabase } from '../supabaseClient';

export const departmentsService = {
  async getDepartments() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  }
};
