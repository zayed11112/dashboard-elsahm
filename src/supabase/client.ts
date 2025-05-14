import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cxntsoxkldjoblehmdpo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bnRzb3hrbGRqb2JsZWhtZHBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDA1MDMsImV4cCI6MjA2MTI3NjUwM30.XEuVHmJrWNX1XYphBZKpwyZqRf_HMsNg6IMJLiIu-ks';

// Create a proper singleton class for Supabase client
class SupabaseClientSingleton {
  private static instance: SupabaseClient | null = null;
  
  private constructor() {
    // Private constructor to prevent direct construction calls with 'new'
  }
  
  public static getInstance(): SupabaseClient {
    if (!SupabaseClientSingleton.instance) {
      // Create a new instance only if one doesn't exist
      SupabaseClientSingleton.instance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // Add storage key to ensure unique instance identification
          storageKey: 'elsahm-supabase-auth',
        },
      });
      console.log('Supabase client instance created');
    }
    
    return SupabaseClientSingleton.instance;
  }
}

// Export the singleton instance
export const supabase = SupabaseClientSingleton.getInstance();

// No need for additional functions to get the client
// Use direct import: import { supabase } from '../supabase/client';
