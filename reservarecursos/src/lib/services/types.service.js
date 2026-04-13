import { supabase } from '../supabaseClient';

export const typesService = {
  async getTypes() {
    const { data, error } = await supabase
      .from('resource_types')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data;
  },

  async createType(typeData) {
    const { data, error } = await supabase
      .from('resource_types')
      .insert([typeData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async deleteType(id) {
    const { error } = await supabase
      .from('resource_types')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};
