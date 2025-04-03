import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form } from '@quillforms/renderer-core';
import '@quillforms/renderer-core/build-style/style.css';
import { useForms } from '../context/FormsContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { QuillFormsRenderer } from '@quillforms/renderer-core';
import { DocumentDuplicateIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const FormPreview = ({ publicMode = false }) => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { getForm, saveFormResponse, getPublicForm } = useForms();
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    
    const fetchForm = async () => {
      try {
        setLoading(true);
        console.log('Fetching form for preview, formId:', formId);
        
        // Set a timeout to prevent hanging
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('Form fetch timeout');
            setError('Form fetch timed out. Please try refreshing the page.');
            setLoading(false);
          }
        }, 10000);
        
        if (publicMode) {
          // Fetch directly from Supabase for public forms
          console.log('Fetching public form directly from Supabase');
          try {
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
            
            if (!data) {
              console.error('Public form not found or not published');
              throw new Error('Form not found or not published');
            }
            
            console.log('Public form fetched:', data ? 'yes' : 'no');
            if (isMounted) setForm(data);
          } catch (err) {
            console.error('Error fetching public form:', err);
            if (isMounted) setError('Form not found or not published');
            return;
          }
        } else {
          // Try getting from context (now async)
          console.log('Getting form from context');
          try {
            const formData = await getForm(formId);
            
            if (!formData && isAuthenticated) {
              console.log('Form not found, redirecting to dashboard');
              navigate('/');
              return;
            }
            
            console.log('Form retrieved for preview:', formData ? 'yes' : 'no');
            if (isMounted) setForm(formData);
          } catch (err) {
            console.error('Error getting form:', err);
            if (isAuthenticated && isMounted) {
              setError('Could not retrieve form data');
            }
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching form:', err);
        if (isMounted) setError(err.message || 'An error occurred loading the form');
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      }
    };
    
    fetchForm();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
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

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(publicUrl).then(() => {
      toast.success('Public form link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      toast.error('Failed to copy link.');
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (error || !form) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Form not found</h1>
          <p className="text-gray-400 mb-4">
            {publicMode ? 
              "This form doesn't exist or isn't published." : 
              "You don't have access to this form."}
          </p>
          {!publicMode && isAuthenticated && (
            <button onClick={() => navigate('/')} className="btn">
              Go to Dashboard
            </button>
          )}
          {publicMode && (
            <p className="text-sm text-gray-500 mt-4">
              If you're looking for a form, please check the URL or contact the form creator.
            </p>
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
              onClick={handleCopyPublicLink} 
              className="btn-secondary text-sm"
            >
              Copy Public Link
            </button>
          </div>
        </div>
      )}
      
      {/* Container for Logo and Form */}
      <div className={`relative ${publicMode ? 'h-full' : 'h-[calc(100vh-10rem)]'}`}> 
        {/* Company Logo */}
        <img
          src="/form_logo.png" 
          alt="Company Logo" 
          className="absolute top-4 left-4 h-10 z-10" // Position top-left, adjust height as needed
        />
        
        {/* QuillForms Form Component */}
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