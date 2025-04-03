import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForms } from '../context/FormsContext';
import { useAuth } from '../context/AuthContext';
import { ArrowUpIcon, ArrowDownIcon, DocumentDuplicateIcon, PencilIcon, TrashIcon, EyeIcon, PlayIcon, StopIcon, PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { forms, loading, fetchForms, deleteForm, publishForm, unpublishForm, getResponseCounts } = useForms();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [responseCounts, setResponseCounts] = useState({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [countError, setCountError] = useState(null);
  const [sortField, setSortField] = useState('updated_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterPublished, setFilterPublished] = useState('all');
  
  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [user, fetchForms]);
  
  useEffect(() => {
    const loadResponseCounts = async () => {
      if (!user || forms.length === 0) {
        setResponseCounts({});
        return;
      }
      
      try {
        setLoadingCounts(true);
        setCountError(null);
        const counts = await getResponseCounts();
        console.log('Response counts loaded:', counts);
        
        if (counts && typeof counts === 'object') {
          setResponseCounts(counts);
        } else {
          console.warn('Invalid response counts format:', counts);
          setResponseCounts({});
        }
      } catch (err) {
        console.error('Error loading response counts:', err);
        setCountError(`Error loading counts`);
        setResponseCounts({});
      } finally {
        setLoadingCounts(false);
      }
    };
    
    loadResponseCounts();
  }, [user, forms.length, getResponseCounts]);
  
  const sortForms = (a, b) => {
    if (!a || !b) return 0;
    let comparison = 0;
    
    if (sortField === 'title') {
      const titleA = a.title || '';
      const titleB = b.title || '';
      comparison = titleA.localeCompare(titleB);
    } else if (sortField === 'responses') {
      const countA = responseCounts && typeof responseCounts === 'object' && a.id in responseCounts ? responseCounts[a.id] : 0;
      const countB = responseCounts && typeof responseCounts === 'object' && b.id in responseCounts ? responseCounts[b.id] : 0;
      comparison = countA - countB;
    } else {
      const dateA = new Date(a[sortField] || 0);
      const dateB = new Date(b[sortField] || 0);
      comparison = dateA - dateB;
    }
    
    return sortDirection === 'asc' ? comparison : comparison * -1;
  };
  
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const getFilteredAndSortedForms = () => {
    if (!Array.isArray(forms)) return [];
    return forms
      .filter(form => {
        if (!form) return false;
        if (filterPublished === 'all') return true;
        return filterPublished === 'published' ? form.is_published : !form.is_published;
      })
      .sort(sortForms);
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm('Are you sure you want to permanently delete this form and all its responses?')) {
      try {
        const success = await deleteForm(formId);
        if (success) {
          toast.success(`Form deleted successfully.`);
        } else {
           toast.error("Failed to delete the form. It might have already been deleted or there was a server error.");
        }
      } catch (error) {
        console.error("Error deleting form:", error);
        toast.error(`Failed to delete the form: ${error.message}. Please try again.`);
      }
    }
  };
  
  const handleTogglePublish = async (formId, currentStatus) => {
    try {
      let message = '';
      if (currentStatus) {
        await unpublishForm(formId);
        message = 'Form unpublished successfully.';
      } else {
        await publishForm(formId);
        message = 'Form published successfully.';
      }
      toast.success(message);
    } catch (error) {
       console.error("Error toggling publish status:", error);
       toast.error(`Failed to update publish status: ${error.message}`);
    }
  };
  
  const renderSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ArrowUpIcon className="w-4 h-4 ml-1 inline-block" /> 
      : <ArrowDownIcon className="w-4 h-4 ml-1 inline-block" />;
  };
  
  const filteredAndSortedForms = getFilteredAndSortedForms();
  
  const renderSkeletonCard = (key) => (
    <div key={key} className="bg-gray-800 rounded-lg shadow-lg p-5 animate-pulse">
      <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
        <div className="h-6 bg-gray-700 rounded w-1/4"></div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700 flex flex-wrap justify-end gap-2">
        <div className="h-8 w-16 bg-gray-700 rounded"></div>
        <div className="h-8 w-16 bg-gray-700 rounded"></div>
        <div className="h-8 w-16 bg-gray-700 rounded"></div>
        <div className="h-8 w-16 bg-gray-700 rounded"></div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-100">Your Forms</h1>
        <div className="flex flex-wrap justify-center md:justify-end gap-4 items-center">
          <div className="flex items-center">
            <label htmlFor="filterPublished" className="mr-2 text-sm font-medium text-gray-400">Show:</label>
            <select
              id="filterPublished"
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={filterPublished}
              onChange={(e) => setFilterPublished(e.target.value)}
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
          <Link 
            to="/forms/new" 
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out"
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            Create Form
          </Link>
        </div>
      </div>

      <div className="mt-4"> 
        {loading && forms?.length === 0 ? ( 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => renderSkeletonCard(n))}
          </div>
        ) : !loading && forms?.length === 0 ? ( 
          <div className="bg-gray-800 rounded-lg text-center py-16 px-6 shadow-lg">
            <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-200">No forms created yet</h2>
            <p className="text-gray-400 mb-6">Get started by creating your first form.</p>
            <Link to="/forms/new" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow transition duration-150 ease-in-out">
              <PlusIcon className="w-5 h-5 mr-1" />
              Create Your First Form
            </Link>
          </div>
        ) : ( 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedForms.map(form => (
              <div 
                key={form.id} 
                className="bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-blue-500/30 hover:ring-1 hover:ring-blue-600"
              >
                <div className="flex-grow">
                  <Link 
                    to={`/forms/${form.id}/edit`} 
                    className="block mb-2 text-lg font-semibold text-gray-100 hover:text-blue-400 truncate" 
                    title={form.title || 'Untitled Form'}
                  >
                    {form.title || 'Untitled Form'}
                  </Link>
                  <p className="text-sm text-gray-400 mb-3">
                    Last updated: {new Date(form.updated_at).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <p className="text-gray-400">Responses:</p>
                    <p className="font-medium text-gray-200">
                      {loadingCounts ? (
                        <span className="text-xs italic text-gray-500">Loading...</span>
                      ) : countError ? (
                        <span className="text-xs text-red-400" title={countError}>Error</span>
                      ) : (
                        responseCounts[form.id] ?? 0
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                     <p className="text-gray-400 text-sm">Status:</p>
                    {form.is_published ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-700 text-green-100">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-200">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-gray-700 flex flex-wrap justify-end gap-2">
                  <button
                    className="flex items-center p-1.5 bg-sky-700 text-sky-100 rounded-md hover:bg-sky-600 transition duration-150 text-xs"
                    onClick={() => navigate(`/forms/${form.id}/edit`)}
                    title="Edit Form"
                  >
                    <PencilIcon className="w-4 h-4"/>
                    <span className="ml-1 hidden sm:inline">Edit</span>
                  </button>
                  <button
                    className="flex items-center p-1.5 bg-violet-700 text-violet-100 rounded-md hover:bg-violet-600 transition duration-150 text-xs"
                    onClick={() => navigate(`/forms/${form.id}/responses`)}
                    title="View Responses"
                  >
                    <EyeIcon className="w-4 h-4"/>
                     <span className="ml-1 hidden sm:inline">Responses</span>
                  </button>
                  <button
                    className={`flex items-center p-1.5 ${form.is_published ? 'bg-amber-700 hover:bg-amber-600 text-amber-100' : 'bg-emerald-700 hover:bg-emerald-600 text-emerald-100'} rounded-md transition duration-150 text-xs`}
                    onClick={() => handleTogglePublish(form.id, form.is_published)}
                    title={form.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {form.is_published ? <StopIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
                    <span className="ml-1 hidden sm:inline">{form.is_published ? 'Unpublish' : 'Publish'}</span>
                  </button>
                  <button
                    className="flex items-center p-1.5 bg-rose-700 text-rose-100 rounded-md hover:bg-rose-600 transition duration-150 text-xs"
                    onClick={() => handleDeleteForm(form.id)}
                    title="Delete Form"
                  >
                    <TrashIcon className="w-4 h-4"/>
                    <span className="ml-1 hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 