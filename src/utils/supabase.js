import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if the environment variables are set correctly
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anonymous Key. Please check your environment variables.');
  
  // In development, provide a hint about using .env file
  if (process.env.NODE_ENV === 'development') {
    console.log('Hint: Make sure you have a .env or .env.local file with the required Supabase credentials.');
  }
}

// Enhanced client options for better reliability
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable URL detection to avoid potential conflicts
    storageKey: 'digilize-forms-auth', // Use a custom storage key
    storage: window.localStorage, // Explicitly use localStorage
  },
  global: {
    headers: { 'x-application-name': 'digilize-forms' },
    fetch: (...args) => fetch(...args),
  },
  realtime: {
    timeout: 30000, // Increased timeout for slow connections
  }
};

// Create client with enhanced options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// Export a method to check connection health
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return { success: false, error: error.message };
  }
}; 