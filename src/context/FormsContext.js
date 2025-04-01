import React, { createContext, useState, useContext, useEffect } from 'react';
import { saveFormResponseToSheet } from '../utils/googleSheets';

const FormsContext = createContext();

export const useForms = () => useContext(FormsContext);

export const FormsProvider = ({ children }) => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load forms from local storage
    const storedForms = localStorage.getItem('forms');
    if (storedForms) {
      setForms(JSON.parse(storedForms));
    }
    setLoading(false);
  }, []);

  const saveFormsToStorage = (updatedForms) => {
    localStorage.setItem('forms', JSON.stringify(updatedForms));
    setForms(updatedForms);
  };

  const createForm = (formData) => {
    const newForm = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [],
      ...formData,
    };
    
    const updatedForms = [...forms, newForm];
    saveFormsToStorage(updatedForms);
    return newForm.id;
  };

  const updateForm = (formId, formData) => {
    const updatedForms = forms.map(form => 
      form.id === formId 
        ? { 
            ...form, 
            ...formData,
            updatedAt: new Date().toISOString() 
          } 
        : form
    );
    
    saveFormsToStorage(updatedForms);
  };

  const deleteForm = (formId) => {
    const updatedForms = forms.filter(form => form.id !== formId);
    saveFormsToStorage(updatedForms);
  };

  const getForm = (formId) => {
    return forms.find(form => form.id === formId);
  };

  const saveFormResponse = async (formId, responseData) => {
    // Add timestamp and ID to the response
    const responseWithId = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...responseData
    };
    
    // Update local storage
    const updatedForms = forms.map(form => {
      if (form.id === formId) {
        return {
          ...form,
          responses: [...(form.responses || []), responseWithId]
        };
      }
      return form;
    });
    
    saveFormsToStorage(updatedForms);
    
    // Try to save to Google Sheets (will fail gracefully if not configured)
    try {
      await saveFormResponseToSheet(formId, responseWithId);
    } catch (error) {
      console.error('Error saving to Google Sheets:', error);
      // Continue without Google Sheets integration if there's an error
    }
  };

  const value = {
    forms,
    loading,
    createForm,
    updateForm,
    deleteForm,
    getForm,
    saveFormResponse,
  };

  return (
    <FormsContext.Provider value={value}>
      {children}
    </FormsContext.Provider>
  );
}; 