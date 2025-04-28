import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://cxntsoxkldjoblehmdpo.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bnRzb3hrbGRqb2JsZWhtZHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDA1MDMsImV4cCI6MjA2MTI3NjUwM30.XEuVHmJrWNX1XYphBZKpwyZqRf_HMsNg6IMJLiIu-ks';

// Crear el cliente de Supabase con opciones adicionales para persistir la sesión
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
