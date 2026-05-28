import { supabase } from '../supabaseClient';

export const incidentsService = {
  async reportIncident(incidentData) {
    const { data, error } = await supabase
      .from('incidents')
      .insert([incidentData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async getIncidentByReservation(reservationId) {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('reservation_id', reservationId)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  async updateIncident(id, updateData) {
    const { data, error } = await supabase
      .from('incidents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  async getIncidents() {
    const { data, error } = await supabase
      .from('incidents')
      .select('*, resources(name), profiles!reported_by(display_name, email), reservations(reservation_date, period_start, period_end)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }
};
