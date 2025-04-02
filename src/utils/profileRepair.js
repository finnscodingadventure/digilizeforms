import { supabase } from './supabase';

/**
 * Checks if a user profile exists and creates one if it doesn't
 * This can be run from the browser console to fix profile issues
 * 
 * @param {Object} userData - User data from Supabase auth
 * @returns {Promise<Object>} - The profile data
 */
export const repairUserProfile = async (userData = null) => {
  try {
    // If no userData provided, get current user
    if (!userData) {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) throw new Error('No active session found. Please login first.');
      userData = session.user;
    }

    console.log('Attempting profile repair for user:', userData.id);

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
      console.log('Profile found, no repair needed:', existingProfile);
      return existingProfile;
    }
    
    // Profile doesn't exist, create one
    console.log('No profile found, creating new profile...');
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
    
    console.log('Profile created successfully:', newProfile);
    return newProfile;
  } catch (err) {
    console.error('Profile repair failed:', err);
    throw err;
  }
};

/**
 * Verify your database setup is correct
 * This can be run from the browser console to check database status
 */
export const verifyDatabaseSetup = async () => {
  try {
    console.log('Checking database tables...');
    
    // Try to select from the forms table to see if it exists
    const { error: formsError } = await supabase
      .from('forms')
      .select('count')
      .limit(1);
      
    // Check profiles table
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    // Check form_responses table
    const { error: responsesError } = await supabase
      .from('form_responses')
      .select('count')
      .limit(1);
    
    const hasErrors = !!formsError || !!profilesError || !!responsesError;
    
    console.log('Database status:', hasErrors ? '❌ Issues found' : '✓ All tables verified');
    
    if (formsError) console.error('- Forms table issue:', formsError);
    if (profilesError) console.error('- Profiles table issue:', profilesError);
    if (responsesError) console.error('- Form responses table issue:', responsesError);
    
    if (!hasErrors) {
      console.log('All database tables are properly set up!');
    } else {
      console.error('Database setup issues found. Please run the SQL setup script in your Supabase SQL Editor.');
    }
    
    return !hasErrors;
  } catch (err) {
    console.error('Error verifying database:', err);
    return false;
  }
};

// Export a helper function to be called from console
window.fixMyProfile = async () => {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      console.error('You must be logged in to repair your profile');
      return;
    }
    
    await repairUserProfile(data.user);
    console.log('Profile repair attempt completed. Try saving your form again.');
  } catch (err) {
    console.error('Profile repair failed:', err);
  }
};

window.checkDatabase = verifyDatabaseSetup; 