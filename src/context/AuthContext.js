import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ensure user has a profile record
  const ensureProfile = async (userData) => {
    if (!userData || !userData.id) return null;
    
    try {
      // Add a timeout for the profile check
      const profileCheckPromise = new Promise(async (resolve, reject) => {
        try {
          // Check if profile exists
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userData.id)
            .single();
          
          if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            // PGRST116 is the error for no rows returned
            console.error('Error checking profile:', profileCheckError);
            throw profileCheckError;
          }
          
          // If profile exists, return it
          if (existingProfile) {
            resolve({ ...userData, ...existingProfile });
            return;
          }
          
          // Otherwise create a profile
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: userData.id,
              name: userData.user_metadata?.name || userData.email?.split('@')[0] || 'User',
              email: userData.email,
              is_admin: false
            }])
            .select()
            .single();
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
          
          resolve({ ...userData, ...newProfile });
        } catch (err) {
          reject(err);
        }
      });
      
      // Set a timeout for the profile check
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile operation timed out')), 10000);
      });
      
      // Race the profile check against the timeout
      return Promise.race([profileCheckPromise, timeoutPromise]);
    } catch (err) {
      console.error('Profile creation error:', err);
      // On error, just return the original user data so the app still works
      return userData;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Get current session and set up auth state change listener
    const fetchSession = async () => {
      let timeoutId;
      
      try {
        // Set a longer timeout for session fetch
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Auth session fetch timeout');
            setLoading(false);
            setUser(null);
          }
        }, 8000); // 8 seconds is enough for session fetch
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        if (sessionError) {
          throw sessionError;
        }

        // Only handle session data if component is still mounted
        if (isMounted) {
          if (session) {
            // Set the user immediately with basic data
            setUser(session.user);
            
            // Then try to get profile data in the background
            try {
              const profileData = await ensureProfile(session.user);
              if (isMounted) {
                setUser(profileData || session.user);
              }
            } catch (profileErr) {
              console.error('Profile setup error:', profileErr);
              // User is already set with basic data, so we can continue
            }
          } else {
            // Explicitly set user to null if no session
            setUser(null);
          }
          
          // Signal that initial loading is complete
          setLoading(false);
        }
      } catch (err) {
        // Clear timeout if there was an error
        clearTimeout(timeoutId);
        console.error('Error fetching session:', err);
        
        if (isMounted) {
          setError(err.message);
          // Ensure user is set to null to prevent authentication issues
          setUser(null);
          setLoading(false);
        }
      }
    };

    // Start session fetch
    fetchSession();
    
    // Set up auth state change listener (simplified - we don't need to duplicate profile logic here)
    const { data: { subscription }} = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only update user state if it's a sign in or sign out event
      if (event === 'SIGNED_IN' && session) {
        // For sign in, we don't need to do anything as the login function already handles this
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) setUser(null);
      }
    });

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      // Set loading state to true while login is processing
      setLoading(true);
      setError(null);
      
      // First sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Supabase login error:', error);
        throw error;
      }
      
      if (data && data.user) {
        try {
          // Now ensure the profile exists
          const profileData = await ensureProfile(data.user);
          setUser(profileData || data.user);
        } catch (profileErr) {
          console.error('Profile setup error on login:', profileErr);
          // Still set the user so they can use the app
          setUser(data.user);
        }
      } else {
        console.warn('No user data returned from Supabase login');
      }
      
      // Login succeeded
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to log in');
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) {
        throw error;
      }

      // Don't set the user after signup - we want them to explicitly log in
      // This ensures they go through the login flow

      return true;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    }
  };

  const value = {
    user,
    login,
    logout,
    signup,
    error,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 