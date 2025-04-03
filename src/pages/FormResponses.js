import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForms } from '../context/FormsContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { DocumentDuplicateIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { toast } from 'react-toastify';

const FormResponses = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { getFormWithResponses } = useForms();
  
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFormWithResponses = async () => {
      try {
        setLoading(true);
        
        const formData = await getFormWithResponses(formId);
        
        if (!formData) {
          navigate('/');
          return;
        }
        
        setForm(formData);
        setResponses(formData.responses || []);
        
        if (formData.responses && formData.responses.length > 0) {
          setSelectedResponse(formData.responses[0]);
        }
      } catch (err) {
        console.error('Error fetching form responses:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormWithResponses();
  }, [formId, getFormWithResponses, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const viewResponse = (response) => {
    setSelectedResponse(response);
  };

  // Format JSON data for display
  const renderAnswerValue = (value, blockType) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">No answer</span>;
    }
    
    // Handle different block types
    switch (blockType) {
      case 'multiple-choice':
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value;
      case 'date':
        return value;
      default:
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value;
    }
  };

  // Find block information by ID
  const getBlockInfo = (blockId) => {
    if (!form || !form.form_structure || !form.form_structure.blocks) return null;
    return form.form_structure.blocks.find(block => block.id === blockId);
  };

  const exportResponsesToCSV = () => {
    if (!responses.length) return;
    
    // Get all block IDs for headers
    const blockIds = form.form_structure.blocks
      .filter(block => block.name !== 'welcome-screen' && block.name !== 'statement')
      .map(block => ({
        id: block.id,
        label: block.attributes.label || block.id,
        name: block.name
      }));
    
    // Create CSV header row
    const headers = ['Response ID', 'Timestamp', ...blockIds.map(block => block.label)];
    const csvRows = [headers.join(',')];
    
    // Add data rows
    responses.forEach(response => {
      const answers = response.response_data?.answers || {};
      const row = [
        response.id,
        formatDate(response.created_at),
        ...blockIds.map(block => {
          const answer = answers[block.id];
          if (!answer) return '';
          
          const value = renderAnswerValue(answer.value, block.name);
          // Escape commas and quotes for CSV
          return `"${String(value).replace(/"/g, '""')}"`;
        })
      ];
      csvRows.push(row.join(','));
    });
    
    // Create and download the CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.title || 'form'}-responses.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    return <div className="text-center py-8">Error loading responses. Please try again.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{form.title || 'Untitled Form'} - Responses</h1>
        <div className="flex space-x-3">
          <button onClick={exportResponsesToCSV} className="btn">
            Export to CSV
          </button>
          <button 
            onClick={() => navigate(`/forms/${formId}/preview`)} 
            className="btn-secondary"
          >
            Preview Form
          </button>
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="card text-center py-12">
          <h2 className="text-xl mb-4">No responses yet</h2>
          <p className="text-gray-400 mb-6">Share your form to collect responses</p>
          <button 
            onClick={handleCopyPublicLink} 
            className="btn"
          >
            Copy Form Link
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Response list */}
          <div className="lg:col-span-1 overflow-auto max-h-[calc(100vh-14rem)]">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Responses ({responses.length})</h2>
              <div className="space-y-3">
                {responses.map((response) => (
                  <div 
                    key={response.id} 
                    className={`p-3 rounded cursor-pointer transition-colors ${selectedResponse?.id === response.id ? 'bg-primary' : 'bg-dark-lighter hover:bg-dark-light'}`}
                    onClick={() => viewResponse(response)}
                  >
                    <div className="text-sm mb-1">
                      Response #{typeof response.id === 'string' ? response.id.slice(-4) : response.id}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(response.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Response details */}
          <div className="lg:col-span-2">
            <div className="card">
              {selectedResponse ? (
                <>
                  <h2 className="text-xl font-semibold mb-4">Response Details</h2>
                  <div className="text-sm text-gray-400 mb-6">
                    Submitted: {formatDate(selectedResponse.created_at)}
                  </div>
                  
                  <div className="space-y-6">
                    {Object.entries(selectedResponse.response_data?.answers || {}).map(([blockId, answer]) => {
                      const block = getBlockInfo(blockId);
                      if (!block) return null;
                      
                      // Skip welcome screen and statement blocks 
                      if (block.name === 'welcome-screen' || block.name === 'statement') {
                        return null;
                      }
                      
                      return (
                        <div key={blockId} className="border-b border-gray-700 pb-4">
                          <div className="font-medium mb-1">{block.attributes.label || block.id}</div>
                          <div className="text-gray-300">
                            {renderAnswerValue(answer.value, block.name)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  Select a response to view details
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormResponses; 