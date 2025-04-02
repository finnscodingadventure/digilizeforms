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
        console.log('Profile found:', existingProfile);
        return { ...userData, ...existingProfile };
      }
      
      // Otherwise create a profile
      console.log('Creating profile for user:', userData.id);
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
      
      console.log('Profile created:', newProfile);
      return { ...userData, ...newProfile };
    } catch (err) {
      console.error('Profile creation error:', err);
      throw err;
    }
  };

  useEffect(() => {
    // Get current session and set up auth state change listener
    const fetchSession = async () => {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          try {
            // Ensure profile exists and set user data
            const profileData = await ensureProfile(session.user);
            setUser(profileData || session.user);
          } catch (profileErr) {
            console.error('Profile setup error:', profileErr);
            // Still set the base user so they can use the app
            setUser(session.user);
          }
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Set up auth state change listener
    const { data: { subscription }} = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session) {
        try {
          // Ensure profile exists and set user data
          const profileData = await ensureProfile(session.user);
          setUser(profileData || session.user);
        } catch (profileErr) {
          console.error('Profile setup error on auth change:', profileErr);
          // Still set the base user so they can use the app
          setUser(session.user);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return false;
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

      // Profile will be created by the auth state change handler
      // or during the next login session fetch

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
      {!loading && children}
    </AuthContext.Provider>
  );
}; 