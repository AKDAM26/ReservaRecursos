import { createClient } from '@supabase/supabase-js';

// Usamos import.meta.env en lugar de process.env porque estamos en Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY). Revisa tu archivo .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
