import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form } from '@quillforms/renderer-core';
import '@quillforms/renderer-core/build-style/style.css';
import { useForms } from '../context/FormsContext';

const FormPreview = ({ publicMode = false }) => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { getForm, saveFormResponse } = useForms();
  const form = getForm(formId);

  useEffect(() => {
    if (!form && !publicMode) {
      navigate('/');
    }
  }, [form, navigate, publicMode]);

  if (!form) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Form not found</h1>
          {!publicMode && (
            <button onClick={() => navigate('/')} className="btn">
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const formObj = form.formObj;

  const handleSubmit = (data, { completeForm, setIsSubmitting }) => {
    // Save the response
    saveFormResponse(formId, data);
    
    // Complete the form after a short delay
    setTimeout(() => {
      setIsSubmitting(false);
      completeForm();
    }, 500);
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