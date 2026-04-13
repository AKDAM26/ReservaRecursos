import { supabase } from '../supabaseClient';

export const resourcesService = {
  async getResources(filters = {}) {
    // we can do a join to get the type name if needed, but for now select *
    let query = supabase.from('resources').select(`
      *,
      resource_types (
        name
      )
    `);
    
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.type_id) query = query.eq('type_id', filters.type_id);
    
    query = query.order('name');
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getResourceById(id) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createResource(resourceData) {
    const { data, error } = await supabase
      .from('resources')
      .insert([resourceData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async updateResource(id, updates) {
    const { data, error } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async deleteResource(id) {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return true;
  }
};
