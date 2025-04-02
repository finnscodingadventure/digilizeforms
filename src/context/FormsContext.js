import React, { createContext, useState, useContext, useEffect } from 'react';
import { saveFormResponseToSheet } from '../utils/googleSheets';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

const FormsContext = createContext();

export const useForms = () => useContext(FormsContext);

export const FormsProvider = ({ children }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [databaseReady, setDatabaseReady] = useState(false);
  const { user } = useAuth();

  // Check if database tables exist on mount
  useEffect(() => {
    const checkDatabase = async () => {
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
          
        if (formsError || profilesError || responsesError) {
          console.error('Error checking database tables:');
          if (formsError) console.error('- Forms table:', formsError);
          if (profilesError) console.error('- Profiles table:', profilesError);
          if (responsesError) console.error('- Form responses table:', responsesError);
          
          alert('Database error: Please make sure your database tables are set up correctly. Check the console for details.');
          setDatabaseReady(false);
        } else {
          console.log('Database tables validated successfully');
          setDatabaseReady(true);
        }
      } catch (err) {
        console.error('Error during database check:', err);
        setDatabaseReady(false);
      }
    };
    
    checkDatabase();
  }, []);

  // Log when user changes to help debug
  useEffect(() => {
    if (user) {
      console.log('User in FormsContext:', user);
      console.log('User ID:', user.id);
    } else {
      console.log('No user in FormsContext');
    }
  }, [user]);

  useEffect(() => {
    if (!user || !databaseReady) {
      setForms([]);
      setLoading(false);
      return;
    }

    // Load forms from Supabase
    const fetchForms = async () => {
      try {
        setLoading(true);
        
        console.log('Fetching forms for user:', user.id);
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        console.log('Forms fetched:', data?.length || 0);
        setForms(data || []);
      } catch (err) {
        console.error('Error fetching forms:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [user, databaseReady]);

  const createForm = async (formData) => {
    if (!user) {
      console.error('No user found when creating form');
      return null;
    }
    
    try {
      console.log('Creating form for user:', user);
      console.log('User ID:', user.id);
      console.log('User object type:', typeof user);
      console.log('Form data:', formData);
      
      const form = {
        user_id: user.id,
        title: formData.title || 'Untitled Form',
        description: formData.description || '',
        form_structure: formData.formObj || {},
        settings: formData.settings || {},
        is_published: formData.isPublished || false,
      };
      
      console.log('Submitting form to Supabase:', form);
      
      const { data, error } = await supabase
        .from('forms')
        .insert([form])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned after form creation');
      }
      
      const newForm = data[0];
      console.log('Form created successfully:', newForm);
      
      setForms(prevForms => [newForm, ...prevForms]);
      return newForm.id;
    } catch (err) {
      console.error('Error creating form:', err);
      setError(err.message);
      throw err; // Re-throw to let the component handle it
    }
  };

  const updateForm = async (formId, formData) => {
    if (!user) {
      console.error('No user found when updating form');
      return false;
    }
    
    try {
      console.log('Updating form:', formId);
      console.log('Update data:', formData);
      
      const updates = {};
      
      if (formData.title !== undefined) updates.title = formData.title;
      if (formData.description !== undefined) updates.description = formData.description;
      if (formData.formObj !== undefined) updates.form_structure = formData.formObj;
      if (formData.settings !== undefined) updates.settings = formData.settings;
      if (formData.isPublished !== undefined) updates.is_published = formData.isPublished;
      
      updates.updated_at = new Date().toISOString();
      
      console.log('Submitting updates to Supabase:', updates);
      
      const { data, error } = await supabase
        .from('forms')
        .update(updates)
        .eq('id', formId)
        .eq('user_id', user.id) // Ensure user owns the form
        .select();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('No data returned after form update');
      }
      
      const updatedForm = data[0];
      console.log('Form updated successfully:', updatedForm);
      
      setForms(prevForms => 
        prevForms.map(form => 
          form.id === formId ? updatedForm : form
        )
      );
      
      return true;
    } catch (err) {
      console.error('Error updating form:', err);
      setError(err.message);
      throw err; // Re-throw to let the component handle it
    }
  };

  const deleteForm = async (formId) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)
        .eq('user_id', user.id); // Ensure user owns the form
      
      if (error) {
        throw error;
      }
      
      setForms(prevForms => 
        prevForms.filter(form => form.id !== formId)
      );
      
      return true;
    } catch (err) {
      console.error('Error deleting form:', err);
      setError(err.message);
      return false;
    }
  };

  const getForm = (formId) => {
    console.log('Getting form:', formId);
    console.log('Available forms:', forms.length);
    const form = forms.find(form => form.id === formId);
    console.log('Found form:', form ? 'yes' : 'no');
    return form;
  };

  const getFormWithResponses = async (formId) => {
    if (!user) return null;
    
    try {
      // Get the form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('user_id', user.id) // Ensure user owns the form
        .single();
      
      if (formError) {
        throw formError;
      }
      
      // Get the responses
      const { data: responses, error: responsesError } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .order('created_at', { ascending: false });
      
      if (responsesError) {
        throw responsesError;
      }
      
      return {
        ...form,
        responses: responses || []
      };
    } catch (err) {
      console.error('Error fetching form with responses:', err);
      setError(err.message);
      return null;
    }
  };

  const getPublicForm = async (formId) => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('is_published', true) // Only fetch published forms
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching public form:', err);
      setError(err.message);
      return null;
    }
  };

  const saveFormResponse = async (formId, responseData) => {
    try {
      // Add the response to Supabase
      const { data, error } = await supabase
        .from('form_responses')
        .insert([
          {
            form_id: formId,
            response_data: responseData,
            metadata: {}
          }
        ])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Try to save to Google Sheets (will fail gracefully if not configured)
      try {
        await saveFormResponseToSheet(formId, data);
      } catch (err) {
        console.error('Error saving to Google Sheets:', err);
        // Continue without Google Sheets integration if there's an error
      }
      
      return data;
    } catch (err) {
      console.error('Error saving form response:', err);
      setError(err.message);
      return null;
    }
  };

  const value = {
    forms,
    loading,
    error,
    createForm,
    updateForm,
    deleteForm,
    getForm,
    getFormWithResponses,
    getPublicForm,
    saveFormResponse,
  };

  return (
    <FormsContext.Provider value={value}>
      {children}
    </FormsContext.Provider>
  );
}; 