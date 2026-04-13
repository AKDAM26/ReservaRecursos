import { supabase } from '../supabaseClient';

export const reservationsService = {
  async getReservations(filters = {}) {
    let query = supabase.from('reservations').select('*, profiles!created_by(display_name, email), resources(name)');
    
    if (filters.resource_id) {
      query = query.eq('resource_id', filters.resource_id);
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.startAfter) {
      query = query.gte('end_at', filters.startAfter);
    }
    if (filters.endBefore) {
      query = query.lte('start_at', filters.endBefore);
    }
    
    query = query.order('start_at', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createReservation(reservationData) {
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservationData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async cancelReservation(id, cancelledByUserId) {
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledByUserId
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
