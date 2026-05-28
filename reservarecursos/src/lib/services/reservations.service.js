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
    if (filters.startDate) {
      query = query.gte('reservation_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('reservation_date', filters.endDate);
    }
    if (filters.reservation_date) {
      query = query.eq('reservation_date', filters.reservation_date);
    }
    
    query = query.order('reservation_date', { ascending: true }).order('period_start', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getReservationById(id) {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, profiles!created_by(display_name, email), resources(name)')
      .eq('id', id)
      .single();
      
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

  async updateReservation(id, updateData) {
    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', id)
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
  },

  async cancelRecurring(recurrence_id, cancelledByUserId) {
    const { data, error } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledByUserId
      })
      .eq('recurrence_id', recurrence_id)
      .select();
      
    if (error) throw error;
    return data;
  },

  async createRecurringReservations({
    resource_id,
    created_by,
    start_date,
    end_date,
    days_of_week,
    period_start,
    period_end,
    notes
  }) {
    const { data, error } = await supabase.rpc('create_recurring_reservations', {
      p_resource_id: resource_id,
      p_created_by: created_by,
      p_start_date: start_date,
      p_end_date: end_date,
      p_days_of_week: days_of_week,
      p_period_start: period_start,
      p_period_end: period_end,
      p_notes: notes
    });

    if (error) throw error;
    return data;
  }
};
