import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { saveFormResponseToSheet } from '../utils/googleSheets';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

const FormsContext = createContext();

export function FormsProvider({ children }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchForms = useCallback(async () => {
    if (!user) return;
    
    let timeoutId;
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Fetching forms timed out'));
      }, 15000);
    });
    
    try {
      setLoading(true);
      setError(null);
      
      const fetchPromise = supabase
        .from('forms')
        .select('id, title, updated_at, is_published')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
        
      const result = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);
      
      clearTimeout(timeoutId);
      
      const { data, error: fetchError } = result;
      
      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }
      
      setForms(data || []);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError(err.message || 'Failed to fetch forms');
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (user && isMounted) {
        console.log("FormsContext: User found, attempting initial fetch.");
        try {
          await fetchForms();
          console.log("FormsContext: Initial fetch completed.");
        } catch (err) {
          console.error('FormsContext: Error during initial form fetch invocation:', err);
          if (isMounted) {
            setLoading(false);
          }
        }
      } else if (!user && isMounted) {
        console.log("FormsContext: No user, clearing forms and setting loading to false.");
        setForms([]);
        setLoading(false);
      }
    };
    
    init();
    
    return () => {
      console.log("FormsContext: Unmounting or user changed, cleanup initiated.");
      isMounted = false;
    };
  }, [user, fetchForms]);

  const createForm = async (formData) => {
    if (!user) {
      console.error('No user found when creating form');
      return null;
    }
    
    try {
      console.log('Creating form for user:', user);
      console.log('User ID:', user.id);
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
      throw err;
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
        .eq('user_id', user.id)
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
      throw err;
    }
  };

  const deleteForm = async (formId) => {
    if (!user) return false;
    
    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)
        .eq('user_id', user.id);
      
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

  const getForm = useCallback(async (formId) => {
    if (!formId) {
      console.error("getForm called with no formId");
      return null;
    }

    console.log('FormsContext: Getting form:', formId);
    
    // 1. Check cache for FULL form data
    const cachedForm = forms.find(form => form.id === formId && form.form_structure && form.settings);
    
    if (cachedForm) {
      console.log('FormsContext: Found full form data in local cache:', cachedForm);
      return cachedForm;
    }
    
    console.log(`FormsContext: Full form data for ${formId} not in cache, fetching from Supabase...`);
    
    // 2. Fetch full form data from Supabase if not in cache or incomplete
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*, form_structure, settings') // Explicitly select all columns needed by builder
        .eq('id', formId)
        .maybeSingle(); // Use maybeSingle to handle null case gracefully
      
      if (error) {
        console.error('FormsContext: Error fetching form from Supabase:', error);
        // Don't throw here, let the calling component handle null
        setError(prevError => prevError ? `${prevError}; Failed to fetch form ${formId}: ${error.message}` : `Failed to fetch form ${formId}: ${error.message}`);
        return null; 
      }
      
      if (!data) {
        console.warn('FormsContext: Form not found in Supabase with ID:', formId);
        // Don't set a global error, let the component decide how to handle not found
        return null;
      }
      
      console.log('FormsContext: Full form fetched from Supabase:', data);

      // 3. Optional: Update the cache with the full form data
      // This replaces the potentially incomplete cached version
      setForms(prevForms => {
          const existingIndex = prevForms.findIndex(f => f.id === formId);
          if (existingIndex !== -1) {
              // Replace existing entry
              const updatedForms = [...prevForms];
              updatedForms[existingIndex] = data;
              return updatedForms;
          } else {
              // Add new entry (shouldn't happen often if fetchForms ran first)
              return [...prevForms, data];
          }
      });

      return data;
    } catch (err) {
      // Catch unexpected errors during fetch or cache update
      console.error('FormsContext: Unexpected error in getForm:', err);
      setError(prevError => prevError ? `${prevError}; Unexpected error fetching form ${formId}: ${err.message}` : `Unexpected error fetching form ${formId}: ${err.message}`);
      return null; // Return null on unexpected errors
    }
  }, [forms, user]); // Depend on forms cache and user 

  const getFormWithResponses = async (formId) => {
    if (!user) return null;
    
    try {
      const { data: form, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('user_id', user.id)
        .single();
      
      if (formError) {
        throw formError;
      }
      
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

  const getResponseCounts = useCallback(async () => {
    if (!user) {
      console.warn("getResponseCounts called without a user.");
      return {};
    }
    
    console.log("getResponseCounts: Fetching counts for user:", user.id);
    
    try {
      const { data, error: rpcError } = await supabase.rpc('get_form_response_counts', {
        user_uuid: user.id
      });

      if (rpcError) {
        console.error('Error fetching response counts via RPC:', rpcError);
        throw rpcError;
      }
      
      console.log('Raw response counts data from RPC:', data);

      if (Array.isArray(data)) {
        const countsMap = data.reduce((acc, item) => {
          if (item && item.form_id && typeof item.response_count === 'number') {
             acc[item.form_id] = item.response_count;
          } else {
             console.warn('getResponseCounts: Skipping invalid item in response counts:', item);
          }
          return acc;
        }, {});
        console.log('getResponseCounts: Processed counts map:', countsMap);
        return countsMap;
      } else {
         console.warn('getResponseCounts: Unexpected format received for response counts:', data);
         return {};
      }

    } catch (err) {
      console.error('Error in getResponseCounts:', err);
      setError(prevError => prevError ? `${prevError}; Failed to get response counts: ${err.message}` : `Failed to get response counts: ${err.message}`);
      return {};
    }
  }, [user]);

  const publishForm = async (formId) => {
    return updateForm(formId, { isPublished: true });
  };

  const unpublishForm = async (formId) => {
    return updateForm(formId, { isPublished: false });
  };

  const saveFormResponse = async (formId, responseData) => {
    try {
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
      
      try {
        await saveFormResponseToSheet(formId, data);
      } catch (err) {
        console.error('Error saving to Google Sheets:', err);
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
    fetchForms,
    createForm,
    updateForm,
    deleteForm,
    getForm,
    getFormWithResponses,
    getResponseCounts,
    publishForm,
    unpublishForm,
    saveFormResponse,
  };

  return (
    <FormsContext.Provider value={value}>
      {children}
    </FormsContext.Provider>
  );
}

export function useForms() {
  return useContext(FormsContext);
} 