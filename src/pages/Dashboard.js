import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForms } from '../context/FormsContext';
import { supabase } from '../utils/supabase';

const Dashboard = () => {
  const { forms, deleteForm, loading: formsLoading } = useForms();
  const [responseCounts, setResponseCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch response counts for each form
  useEffect(() => {
    const fetchResponseCounts = async () => {
      if (!forms.length) {
        setLoading(false);
        return;
      }

      try {
        // Get all form IDs
        const formIds = forms.map(form => form.id);
        
        // Query response counts from Supabase
        const { data, error } = await supabase
          .from('form_responses')
          .select('form_id, count')
          .in('form_id', formIds)
          .group('form_id');
          
        if (error) {
          throw error;
        }
        
        // Convert to object with form_id as key
        const counts = {};
        if (data) {
          data.forEach(item => {
            counts[item.form_id] = parseInt(item.count, 10);
          });
        }
        
        setResponseCounts(counts);
      } catch (err) {
        console.error('Error fetching response counts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (!formsLoading) {
      fetchResponseCounts();
    }
  }, [forms, formsLoading]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      const success = await deleteForm(formId);
      if (success) {
        // Remove from response counts
        const newResponseCounts = { ...responseCounts };
        delete newResponseCounts[formId];
        setResponseCounts(newResponseCounts);
      }
    }
  };

  if (formsLoading || loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Forms</h1>
        <Link to="/forms/new" className="btn">
          Create New Form
        </Link>
      </div>

      {forms.length === 0 ? (
        <div className="card text-center py-12">
          <h2 className="text-xl mb-4">No forms yet</h2>
          <p className="text-gray-400 mb-6">Create your first form to get started</p>
          <Link to="/forms/new" className="btn">
            Create Form
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="card">
              <h2 className="text-xl font-semibold mb-2">{form.title || "Untitled Form"}</h2>
              
              <div className="flex justify-between text-sm text-gray-400 mb-4">
                <span>Created: {formatDate(form.created_at)}</span>
                <span>{responseCounts[form.id] || 0} responses</span>
              </div>
              
              <div className="text-xs text-gray-400 mb-4">
                <span className={`px-2 py-1 rounded ${form.is_published ? 'bg-green-900' : 'bg-gray-700'}`}>
                  {form.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Link to={`/forms/${form.id}/edit`} className="btn-secondary text-sm">
                  Edit
                </Link>
                <Link to={`/forms/${form.id}/preview`} className="btn-secondary text-sm">
                  Preview
                </Link>
                <Link to={`/forms/${form.id}/responses`} className="btn-secondary text-sm">
                  Responses
                </Link>
                <button 
                  onClick={() => handleDeleteForm(form.id)} 
                  className="btn-secondary text-sm bg-red-900 hover:bg-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 