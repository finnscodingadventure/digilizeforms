import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form } from '@quillforms/renderer-core';
import '@quillforms/renderer-core/build-style/style.css';
import { useForms } from '../context/FormsContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

const FormPreview = ({ publicMode = false }) => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { getForm, saveFormResponse, getPublicForm } = useForms();
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        console.log('Fetching form for preview, formId:', formId);
        
        if (publicMode) {
          // Fetch directly from Supabase for public forms
          console.log('Fetching public form directly from Supabase');
          const { data, error } = await supabase
            .from('forms')
            .select('*')
            .eq('id', formId)
            .eq('is_published', true)
            .single();
            
          if (error) {
            console.error('Error fetching public form:', error);
            throw error;
          }
          
          console.log('Public form fetched:', data ? 'yes' : 'no');
          setForm(data);
        } else {
          // Try getting from context first
          console.log('Getting form from context');
          let formData = getForm(formId);
          
          // If not found in context, try fetching directly
          if (!formData && isAuthenticated) {
            console.log('Form not found in context, fetching directly');
            const { data, error } = await supabase
              .from('forms')
              .select('*')
              .eq('id', formId)
              .single();
              
            if (error) {
              console.error('Error fetching form directly:', error);
              throw error;
            }
            
            formData = data;
          }
          
          if (!formData && isAuthenticated) {
            console.log('Form not found, redirecting to dashboard');
            navigate('/');
            return;
          }
          
          console.log('Form retrieved for preview:', formData ? 'yes' : 'no');
          setForm(formData);
        }
      } catch (err) {
        console.error('Error fetching form:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchForm();
  }, [formId, getForm, navigate, publicMode, isAuthenticated, getPublicForm]);

  const handleSubmit = async (data, { completeForm, setIsSubmitting }) => {
    try {
      console.log('Saving form response for form:', formId);
      // Save the response
      const response = await saveFormResponse(formId, data);
      console.log('Response saved:', response ? 'yes' : 'no');
      
      // Complete the form after a short delay
      setTimeout(() => {
        setIsSubmitting(false);
        completeForm();
      }, 500);
    } catch (err) {
      console.error('Error submitting form:', err);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error || !form) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Form not found</h1>
          {!publicMode && isAuthenticated && (
            <button onClick={() => navigate('/')} className="btn">
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // Convert from database format to form renderer format
  const formObj = {
    blocks: form.form_structure?.blocks || [],
    theme: form.form_structure?.theme || {},
    settings: form.form_structure?.settings || {},
  };

  return (
    <div className={`${publicMode ? 'h-screen' : 'h-[calc(100vh-8rem)]'}`}>
      {!publicMode && (
        <div className="mb-4 px-6">
          <h1 className="text-xl font-bold mb-2">{form.title || 'Untitled Form'}</h1>
          <div className="flex space-x-3">
            <button 
              onClick={() => navigate(`/forms/${formId}/edit`)} 
              className="btn-secondary text-sm"
            >
              Edit Form
            </button>
            <button 
              onClick={() => navigate(`/forms/${formId}/responses`)} 
              className="btn-secondary text-sm"
            >
              View Responses
            </button>
            <button 
              onClick={() => {
                const url = `${window.location.origin}/form/${formId}`;
                navigator.clipboard.writeText(url);
                alert('Public form link copied to clipboard!');
              }} 
              className="btn-secondary text-sm"
            >
              Copy Public Link
            </button>
          </div>
        </div>
      )}
      
      <div className={`${publicMode ? 'h-full' : 'h-[calc(100vh-10rem)]'}`}>
        <Form
          formId={formId}
          formObj={formObj}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default FormPreview; 