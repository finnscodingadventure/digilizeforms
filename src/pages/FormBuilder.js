import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForms } from '../context/FormsContext';
import { useAuth } from '../context/AuthContext';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Bars3Icon } from '@heroicons/react/24/solid'; // For drag handle
import { HexColorPicker } from 'react-colorful'; // Import HexColorPicker
import { toast } from 'react-toastify'; // Import toast

// List of available block types
const AVAILABLE_BLOCKS = [
  { type: 'short-text', label: 'Short Text' },
  { type: 'long-text', label: 'Long Text' },
  { type: 'multiple-choice', label: 'Multiple Choice' },
  { type: 'dropdown', label: 'Dropdown' },
  { type: 'number', label: 'Number' },
  { type: 'email', label: 'Email' },
  { type: 'date', label: 'Date' },
  { type: 'website', label: 'Website' },
  { type: 'welcome-screen', label: 'Welcome Screen' },
  { type: 'statement', label: 'Statement' },
  { type: 'group', label: 'Group' },
];

const FormBuilder = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { createForm, updateForm, getForm } = useForms();
  const { user } = useAuth();
  
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [blocks, setBlocks] = useState([
    {
      name: 'welcome-screen',
      id: 'welcome-screen-initial',
      attributes: {
        label: 'Welcome to our form',
        description: 'Please answer the following questions',
        buttonText: 'Start',
      },
    },
  ]);
  
  const [theme, setTheme] = useState({
    font: 'Roboto',
    backgroundColor: '#1e1e2d',
    questionsColor: '#ffffff',
    answersColor: '#e2e8f0',
    buttonsFontColor: '#ffffff',
    buttonsBgColor: '#4f46e5',
    buttonsBorderRadius: 8,
    progressBarFillColor: '#4f46e5',
    progressBarBgColor: '#374151',
  });

  // State for block editing
  const [editingBlock, setEditingBlock] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // State for color picker popover
  const [showColorPicker, setShowColorPicker] = useState(null); // Stores the key of the picker to show
  const pickerRef = useRef(null); // Ref for click outside logic

  // Click outside listener for color picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowColorPicker(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [pickerRef]);

  // Load form data if editing an existing form
  useEffect(() => {
    const loadForm = async () => {
      if (formId) {
        setLoading(true);
        setError(null); // Clear previous errors
        try {
          // Await the result from getForm
          const formData = await getForm(formId); 
          
          if (!formData) {
            // Handle case where getForm returns null/undefined explicitly
            console.error(`FormBuilder: Form with ID ${formId} not found.`);
            setError('Form not found. It might have been deleted.');
            // Optionally navigate away or show a clear message
            // navigate('/404'); 
            return; // Stop further processing
          }
          
          console.log("FormBuilder: Loaded form data:", formData); 

          // Set form properties from fetched data
          setFormTitle(formData.title || '');
          setFormDescription(formData.description || '');
          setIsPublished(formData.is_published || false);
          
          // Ensure form_structure and settings exist before trying to set state
          if (formData.form_structure && typeof formData.form_structure === 'object') {
            const structure = formData.form_structure;
            // Ensure blocks is an array, otherwise default
            if (structure.blocks && Array.isArray(structure.blocks) && structure.blocks.length > 0) {
              setBlocks(structure.blocks);
            } else {
              console.warn("FormBuilder: Invalid or missing blocks in form structure, using default welcome screen.");
              setBlocks([ { name: 'welcome-screen', id: `welcome-screen-${Date.now()}`, attributes: { label: 'Welcome', buttonText: 'Start' } } ]); 
            }
            
            if (structure.theme && typeof structure.theme === 'object') {
              setTheme(prevTheme => ({ ...prevTheme, ...structure.theme })); // Merge with default theme
            } else {
              console.warn("FormBuilder: Invalid or missing theme in form structure, using default.");
            }
          } else {
             console.warn("FormBuilder: Form structure is missing or invalid, initializing with defaults.");
             setBlocks([ { name: 'welcome-screen', id: `welcome-screen-${Date.now()}`, attributes: { label: 'Welcome', buttonText: 'Start' } } ]);
          }
          
        } catch (err) {
          console.error('Error loading form in FormBuilder:', err);
          setError(`Failed to load form: ${err.message}. Please try again.`);
          setFormTitle('Error Loading Form');
          setFormDescription('');
          setBlocks([ { name: 'welcome-screen', id: `welcome-screen-error-${Date.now()}`, attributes: { label: 'Error Loading Form', buttonText: 'Back' } } ]);
        } finally {
          setLoading(false);
        }
      } else {
        // Creating a new form - ensure defaults are set and loading is false
        console.log("FormBuilder: Initializing for new form.");
        setFormTitle('');
        setFormDescription('');
        setIsPublished(false);
        setBlocks([ { name: 'welcome-screen', id: `welcome-screen-new-${Date.now()}`, attributes: { label: 'Welcome to your new form!', buttonText: 'Start' } } ]);
        setLoading(false);
        setError(null);
      }
    };
    
    loadForm();
  }, [formId, getForm, navigate]);
  
  // Block manipulation functions
  const createNewBlock = (blockType) => {
    // Using a more robust ID, though Date.now + random is usually okay
    const newBlockId = `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    let newBlock = {
      id: newBlockId,
      name: blockType,
      attributes: {
        required: true,
        label: 'New Question',
      },
    };
    // Default attributes logic based on blockType (ensure this is correct)
    switch (blockType) {
        case 'welcome-screen':
          newBlock.attributes = { label: 'Welcome Screen', description: '', buttonText: 'Start' }; 
          delete newBlock.attributes.required;
          break;
        case 'multiple-choice':
          newBlock.attributes = { ...newBlock.attributes, choices: [{ value: 'option1', label: 'Option 1' }], multiple: false };
          break;
        case 'date':
          newBlock.attributes = { ...newBlock.attributes, format: 'MMDDYYYY', separator: '/' };
          break;
        case 'dropdown':
          newBlock.attributes = { ...newBlock.attributes, choices: [{ value: 'option1', label: 'Option 1' }] };
          break;
        case 'statement':
          newBlock.attributes = { label: 'Statement Text', buttonText: 'Continue' };
          delete newBlock.attributes.required;
          break;
        case 'group':
          newBlock.attributes = { label: 'Group Title' };
          newBlock.innerBlocks = []; 
          delete newBlock.attributes.required;
          break;
        default:
          // Basic types like short-text, long-text, email, number, website
          // Use the default { required: true, label: 'New Question' }
          break;
      }
    console.log("Created new block:", newBlock);
    return newBlock;
  };
  
  const removeBlock = (blockId) => {
    // Use functional update for safety
    setBlocks(currentBlocks => currentBlocks.filter(block => block.id !== blockId));
  };
  
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    console.log("Drag End:", { source, destination, draggableId });

    // 1. Ignore if dropped outside a valid droppable area
    if (!destination) {
      console.log("No valid destination.");
      return;
    }

    const sourceId = source.droppableId;
    const destinationId = destination.droppableId;

    // 2. Handle reordering within the 'blocks' list
    if (sourceId === 'blocks' && destinationId === 'blocks') {
      // Ignore if dropped in the same position
      if (source.index === destination.index) {
        console.log("Dropped in same position, ignoring.");
        return;
      }
      
      console.log("Attempting to reorder blocks list...");
      
      // Use functional state update for reordering
      setBlocks(currentBlocks => {
        // Check rules within the functional update to use the latest state
        const itemToMove = currentBlocks[source.index];
        if (!itemToMove) return currentBlocks; // Should not happen
        
        if (itemToMove.name === 'welcome-screen' && destination.index !== 0) {
           console.log("Rule Violation: Cannot move Welcome Screen from index 0.");
           return currentBlocks; // Abort update
        }
        if (destination.index === 0 && itemToMove.name !== 'welcome-screen' && currentBlocks[0]?.name === 'welcome-screen') {
           console.log("Rule Violation: Cannot drop before Welcome Screen.");
           return currentBlocks; // Abort update
        }
        
        const reordered = Array.from(currentBlocks);
        const [moved] = reordered.splice(source.index, 1);
        reordered.splice(destination.index, 0, moved);
        console.log("Reordering successful. New state:", reordered);
        return reordered;
      });
    }
    // 3. Handle adding a new block from 'add-block-source' to 'blocks'
    else if (sourceId === 'add-block-source' && destinationId === 'blocks') {
      console.log("Attempting to add new block...");
      const blockType = draggableId.replace('add-', '');
      console.log("Type to add:", blockType);

      // Use functional state update for adding
      setBlocks(currentBlocks => {
        // Check rules within the functional update
        if (blockType === 'welcome-screen' && currentBlocks.some(b => b.name === 'welcome-screen')) {
           toast.warn('Only one Welcome Screen block is allowed.');
           console.log("Rule Violation: Second Welcome Screen prevented.");
           return currentBlocks; // Abort update
        }
        if (destination.index === 0 && currentBlocks[0]?.name === 'welcome-screen') {
           toast.warn('Cannot add blocks before the Welcome Screen.');
           console.log("Rule Violation: Adding before Welcome Screen prevented.");
           return currentBlocks; // Abort update
        }

        const newBlock = createNewBlock(blockType);
        if (!newBlock) { 
           console.error("Block creation failed unexpectedly.");
           return currentBlocks; // Abort update
        }

        const added = Array.from(currentBlocks);
        added.splice(destination.index, 0, newBlock);
        console.log("Adding successful. New state:", added);
        return added;
      });
    } else {
       console.log("Unhandled/Ignored drag case:", {sourceId, destinationId});
    }
  };
  
  const editBlock = (block) => {
    // Make a deep copy if attributes/innerBlocks can be nested objects/arrays
    // Simple spread might not be enough for nested structures if modal modifies them directly
    try {
      setEditingBlock(JSON.parse(JSON.stringify(block))); 
    } catch (e) {
      console.error("Failed to clone block for editing:", e);
      setEditingBlock({...block}); // Fallback to shallow copy
    }
    setShowEditModal(true);
  };
  
  const saveBlockEdit = (updatedBlock) => {
    setBlocks(blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    ));
    setShowEditModal(false);
    setEditingBlock(null);
  };
  
  const cancelBlockEdit = () => {
    setShowEditModal(false);
    setEditingBlock(null);
  };

  const handleSave = async () => {
    if (!user) {
      console.error('Attempt to save form without authenticated user');
      toast.error('You must be logged in to save forms');
      navigate('/login');
      return;
    }

    if (!formTitle.trim()) {
      toast.warn('Please enter a form title');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      // Ensure welcome screen is first if it exists
      const finalBlocks = [...blocks];
      const welcomeIndex = finalBlocks.findIndex(b => b.name === 'welcome-screen');
      if (welcomeIndex > 0) {
         const [welcomeBlock] = finalBlocks.splice(welcomeIndex, 1);
         finalBlocks.unshift(welcomeBlock);
      }

      const formObj = {
        blocks: finalBlocks, // Use potentially reordered blocks
        theme,
        settings: {
          disableProgressBar: false,
          disableWheelSwiping: false,
          showQuestionsNumbers: true,
        },
      };
      
      if (formId) {
        await updateForm(formId, { 
          title: formTitle, 
          description: formDescription,
          formObj,
          isPublished
        });
        toast.success('Form updated successfully!');
      } else {
        const newFormId = await createForm({ 
          title: formTitle, 
          description: formDescription,
          formObj,
          isPublished
        });
        
        if (newFormId) {
          toast.success('Form created successfully!');
          navigate(`/forms/${newFormId}/edit`);
        } else {
          throw new Error('Failed to create form - no ID returned');
        }
      }
    } catch (err) {
      console.error('Error saving form:', err);
      setError(err.message || 'Failed to save form');
      toast.error(`Error saving form: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (formId) {
      navigate(`/forms/${formId}/preview`);
    } else {
      toast.info('Please save the form first to preview it');
    }
  };

  // Render modal for editing block
  const renderEditModal = () => {
    if (!showEditModal || !editingBlock) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white">
          <h2 className="text-xl font-semibold mb-4">Edit Block: {editingBlock.name}</h2>
          
          {/* Common Fields */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Question Label / Title</label>
            <input
              type="text"
              className="input w-full bg-gray-700 border-gray-600"
              value={editingBlock.attributes.label || ''}
              onChange={(e) => setEditingBlock({
                ...editingBlock,
                attributes: { ...editingBlock.attributes, label: e.target.value }
              })}
            />
          </div>
          
          {/* Required Toggle (except for welcome/statement) */} 
          {editingBlock.name !== 'welcome-screen' && editingBlock.name !== 'statement' && (
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id={`required-${editingBlock.id}`}
                checked={editingBlock.attributes.required ?? false} // Default to false if undefined
                onChange={(e) => setEditingBlock({
                  ...editingBlock,
                  attributes: { ...editingBlock.attributes, required: e.target.checked }
                })}
                className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 mr-2"
              />
              <label htmlFor={`required-${editingBlock.id}`} className="text-sm font-medium text-gray-300">
                Required
              </label>
            </div>
          )}
          
          {/* Description (for welcome/statement) */} 
          {(editingBlock.name === 'welcome-screen' || editingBlock.name === 'statement') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                className="input w-full h-24 bg-gray-700 border-gray-600"
                value={editingBlock.attributes.description || ''}
                onChange={(e) => setEditingBlock({
                  ...editingBlock,
                  attributes: { ...editingBlock.attributes, description: e.target.value }
                })}
              />
            </div>
          )}
          
          {/* Button Text (for welcome/statement) */} 
          {(editingBlock.name === 'welcome-screen' || editingBlock.name === 'statement') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Button Text</label>
              <input
                type="text"
                className="input w-full bg-gray-700 border-gray-600"
                value={editingBlock.attributes.buttonText || ''}
                onChange={(e) => setEditingBlock({
                  ...editingBlock,
                  attributes: { ...editingBlock.attributes, buttonText: e.target.value }
                })}
              />
            </div>
          )}
          
          {/* Placeholder (for short/long text) */}
          {(editingBlock.name === 'short-text' || editingBlock.name === 'long-text') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Placeholder</label>
              <input
                type="text"
                className="input w-full bg-gray-700 border-gray-600"
                value={editingBlock.attributes.placeholder || ''}
                onChange={(e) => setEditingBlock({
                  ...editingBlock,
                  attributes: { ...editingBlock.attributes, placeholder: e.target.value }
                })}
              />
            </div>
          )}
          
          {/* Choices (for multiple-choice/dropdown) */} 
          {(editingBlock.name === 'multiple-choice' || editingBlock.name === 'dropdown') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Choices</label>
              {editingBlock.attributes.choices?.map((choice, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    className="input flex-grow mr-2 bg-gray-700 border-gray-600"
                    value={choice.label}
                    onChange={(e) => {
                      const updatedChoices = [...editingBlock.attributes.choices];
                      updatedChoices[index] = { ...choice, label: e.target.value, value: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
                      setEditingBlock({ ...editingBlock, attributes: { ...editingBlock.attributes, choices: updatedChoices } });
                    }}
                  />
                  <button 
                    className="p-1 text-red-400 hover:text-red-300"
                    onClick={() => {
                      const updatedChoices = editingBlock.attributes.choices.filter((_, i) => i !== index);
                      setEditingBlock({ ...editingBlock, attributes: { ...editingBlock.attributes, choices: updatedChoices } });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button 
                className="btn-secondary text-sm mt-2"
                onClick={() => {
                   const newChoiceValue = `option-${Date.now()}`;
                  const updatedChoices = [...(editingBlock.attributes.choices || []), { value: newChoiceValue, label: 'New Option' }];
                  setEditingBlock({ ...editingBlock, attributes: { ...editingBlock.attributes, choices: updatedChoices } });
                }}
              >
                Add Option
              </button>
            </div>
          )}
          
          {/* Multiple Selection Toggle (for multiple-choice) */}
          {editingBlock.name === 'multiple-choice' && (
            <div className="mb-4 flex items-center">
               <input
                type="checkbox"
                id={`multiple-${editingBlock.id}`}
                checked={editingBlock.attributes.multiple || false}
                onChange={(e) => setEditingBlock({
                  ...editingBlock,
                  attributes: { ...editingBlock.attributes, multiple: e.target.checked }
                })}
                className="h-4 w-4 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 mr-2"
              />
              <label htmlFor={`multiple-${editingBlock.id}`} className="text-sm font-medium text-gray-300">
                Allow Multiple Selection
              </label>
            </div>
          )}
          
          {/* Date Block Specific Settings */} 
          {editingBlock.name === 'date' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Date Format</label>
                <select
                  className="input w-full bg-gray-700 border-gray-600"
                  value={editingBlock.attributes.format || 'MMDDYYYY'}
                  onChange={(e) => setEditingBlock({ ...editingBlock, attributes: { ...editingBlock.attributes, format: e.target.value } })}
                >
                  <option value="MMDDYYYY">MM/DD/YYYY</option>
                  <option value="DDMMYYYY">DD/MM/YYYY</option>
                  <option value="YYYYMMDD">YYYY/MM/DD</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Separator</label>
                <select
                  className="input w-full bg-gray-700 border-gray-600"
                  value={editingBlock.attributes.separator || '/'}
                  onChange={(e) => setEditingBlock({ ...editingBlock, attributes: { ...editingBlock.attributes, separator: e.target.value } })}
                >
                  <option value="/">/ (slash)</option>
                  <option value="-">- (dash)</option>
                  <option value=".">. (dot)</option>
                </select>
              </div>
            </>
          )}
          
          {/* Number Block Specific Settings */} 
          {editingBlock.name === 'number' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Minimum Value</label>
                 <input
                    type="number"
                    className="input w-full bg-gray-700 border-gray-600"
                    placeholder="Optional" // Indicate optional
                    value={editingBlock.attributes.min ?? ''} // Use ?? for optional number
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      attributes: { ...editingBlock.attributes, min: e.target.value === '' ? undefined : parseFloat(e.target.value) }
                    })}
                  />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">Maximum Value</label>
                  <input
                    type="number"
                    className="input w-full bg-gray-700 border-gray-600"
                     placeholder="Optional"
                    value={editingBlock.attributes.max ?? ''} 
                    onChange={(e) => setEditingBlock({
                      ...editingBlock,
                      attributes: { ...editingBlock.attributes, max: e.target.value === '' ? undefined : parseFloat(e.target.value) }
                    })}
                  />
              </div>
            </div>
          )}
          
          {/* Group Block Specific Settings */} 
          {editingBlock.name === 'group' && (
             <div className="mb-4 border-t border-gray-600 pt-4">
              <label className="block text-sm font-semibold text-gray-200 mb-3">Inner Questions in Group</label>
              {/* Render inner block editors here - simplified for brevity */}
              <div className="space-y-3">
                 {(editingBlock.innerBlocks || []).map((innerBlock, index) => (
                    <div key={innerBlock.id} className="bg-gray-700 p-3 rounded relative">
                        <button 
                            className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-xs"
                            onClick={() => {
                                const updatedInner = editingBlock.innerBlocks.filter((_, i) => i !== index);
                                setEditingBlock({...editingBlock, innerBlocks: updatedInner});
                            }}
                        >✕</button>
                        <p className="text-xs font-medium text-gray-400 mb-1">{innerBlock.name} #{index + 1}</p>
                        <input 
                            type="text" 
                            value={innerBlock.attributes.label || ''}
                            className="input w-full text-sm bg-gray-600 border-gray-500 mb-1"
                            placeholder="Inner Question Label"
                            onChange={(e) => { /* Update inner block label */ 
                                const updatedInner = [...editingBlock.innerBlocks];
                                updatedInner[index] = {...innerBlock, attributes: {...innerBlock.attributes, label: e.target.value}};
                                setEditingBlock({...editingBlock, innerBlocks: updatedInner});
                            }}
                        />
                        {/* Add other inner block fields as needed */}
                    </div>
                ))}
              </div>
               <button 
                className="btn-secondary text-sm mt-3"
                 onClick={() => {
                    const newInnerBlock = createNewBlock('short-text'); // Default add short-text
                    newInnerBlock.attributes.label = `Inner Question ${ (editingBlock.innerBlocks || []).length + 1}`;
                    setEditingBlock({...editingBlock, innerBlocks: [...(editingBlock.innerBlocks || []), newInnerBlock]});
                 }}
               >Add Inner Question</button>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 mt-6 border-t border-gray-600 pt-4">
            <button onClick={cancelBlockEdit} className="btn-secondary">Cancel</button>
            <button onClick={() => saveBlockEdit(editingBlock)} className="btn">Save Changes</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading Form Builder...</div>;
  }

  return (
    // Wrap the main layout structure in DragDropContext
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-white">
        {renderEditModal()} 
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">
            {formId ? 'Edit Form' : 'Create New Form'}
          </h1>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <button className="btn-secondary" onClick={() => navigate('/dashboard')}> Back to Dashboard </button>
            <button onClick={handlePreview} className="btn-secondary" disabled={!formId}> Preview </button>
            <button onClick={handleSave} className="btn" disabled={saving}> {saving ? 'Saving...' : 'Save Form'} </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-800 border border-red-700 text-red-100 rounded-md shadow-lg">
            {error}
          </div>
        )}
        
        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Form Info, Add Blocks, Theme */} 
          <div className="lg:col-span-4 space-y-6">
            {/* Form Info Panel */} 
            <div className="bg-gray-800 p-5 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Form Information</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">Form Title</label>
                <input type="text" className="input w-full bg-gray-700 border-gray-600" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Enter form title" />
               </div>
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
                 <textarea className="input w-full h-20 bg-gray-700 border-gray-600" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Enter form description" />
               </div>
               <div className="flex items-center">
                 <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isPublished} onChange={() => setIsPublished(!isPublished)} className="sr-only peer"/>
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-300"> {isPublished ? 'Published' : 'Draft'} </span>
                 </label>
               </div>
            </div>
            
            {/* Add Blocks Panel (Droppable Source) */}
            <div className="bg-gray-800 p-5 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Add Blocks</h2>
              <Droppable droppableId="add-block-source" isDropDisabled={true}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-2 gap-3"
                  >
                    {AVAILABLE_BLOCKS.map(({ type, label }, index) => (
                      <Draggable key={type} draggableId={`add-${type}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 rounded-md text-center text-sm cursor-grab ${snapshot.isDragging ? 'bg-blue-700 shadow-lg' : 'bg-gray-700 hover:bg-gray-600'} transition-colors duration-150`}
                          >
                            {label}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
            
            {/* Theme Settings Panel */}
            <div className="bg-gray-800 p-5 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Theme Settings</h2>
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-300 mb-1">Font</label>
                     <select className="input w-full bg-gray-700 border-gray-600" value={theme.font} onChange={(e) => setTheme({ ...theme, font: e.target.value })}>
                       <option>Roboto</option> <option>Open Sans</option> <option>Lato</option> <option>Montserrat</option>
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-300 mb-1">Background</label>
                       <div 
                          className="w-full h-8 rounded border border-gray-600 cursor-pointer" 
                          style={{ backgroundColor: theme.backgroundColor || '#ffffff' }} 
                          onClick={() => setShowColorPicker('backgroundColor')} // Toggle picker
                       ></div>
                       {showColorPicker === 'backgroundColor' && (
                         <div ref={pickerRef} className="absolute z-10 mt-1 p-2 bg-gray-700 rounded shadow-lg">
                            <HexColorPicker 
                               color={theme.backgroundColor || '#ffffff'} 
                               onChange={(newColor) => setTheme({ ...theme, backgroundColor: newColor })}
                            />
                         </div>
                        )}
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-300 mb-1">Questions</label>
                       <div 
                          className="w-full h-8 rounded border border-gray-600 cursor-pointer" 
                          style={{ backgroundColor: theme.questionsColor || '#ffffff' }} 
                          onClick={() => setShowColorPicker('questionsColor')} // Toggle picker
                       ></div>
                       {showColorPicker === 'questionsColor' && (
                         <div ref={pickerRef} className="absolute z-10 mt-1 p-2 bg-gray-700 rounded shadow-lg">
                            <HexColorPicker 
                               color={theme.questionsColor || '#ffffff'} 
                               onChange={(newColor) => setTheme({ ...theme, questionsColor: newColor })}
                            />
                         </div>
                        )}
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-300 mb-1">Answers</label>
                       <div 
                          className="w-full h-8 rounded border border-gray-600 cursor-pointer" 
                          style={{ backgroundColor: theme.answersColor || '#ffffff' }} 
                          onClick={() => setShowColorPicker('answersColor')} // Toggle picker
                       ></div>
                       {showColorPicker === 'answersColor' && (
                         <div ref={pickerRef} className="absolute z-10 mt-1 p-2 bg-gray-700 rounded shadow-lg">
                            <HexColorPicker 
                               color={theme.answersColor || '#ffffff'} 
                               onChange={(newColor) => setTheme({ ...theme, answersColor: newColor })}
                            />
                         </div>
                        )}
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-300 mb-1">Buttons</label>
                       <div 
                          className="w-full h-8 rounded border border-gray-600 cursor-pointer" 
                          style={{ backgroundColor: theme.buttonsBgColor || '#ffffff' }} 
                          onClick={() => setShowColorPicker('buttonsBgColor')} // Toggle picker
                       ></div>
                       {showColorPicker === 'buttonsBgColor' && (
                         <div ref={pickerRef} className="absolute z-10 mt-1 p-2 bg-gray-700 rounded shadow-lg">
                            <HexColorPicker 
                               color={theme.buttonsBgColor || '#ffffff'} 
                               onChange={(newColor) => setTheme({ ...theme, buttonsBgColor: newColor })}
                            />
                         </div>
                        )}
                     </div>
                  </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-300 mb-1">Button Radius ({theme.buttonsBorderRadius}px)</label>
                       <input type="range" min="0" max="25" value={theme.buttonsBorderRadius} onChange={(e) => setTheme({ ...theme, buttonsBorderRadius: parseInt(e.target.value) })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
                   </div>
               </div>
            </div>
          </div>
          
          {/* Right Panel: Form Structure (Droppable Target) */} 
          <div className="lg:col-span-8">
            <div className="bg-gray-800 p-5 rounded-lg shadow-md min-h-[600px]">
              <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">Form Structure</h2>
              <p className="text-sm text-gray-400 mb-4">Drag blocks from the left panel or reorder existing blocks below.</p>
              
              <Droppable droppableId="blocks">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 transition-colors duration-200 p-2 rounded-md min-h-[400px] ${snapshot.isDraggingOver ? 'bg-gray-700/50' : 'bg-transparent'}`}
                  >
                    {blocks.length === 0 ? (
                      <div className="text-center py-16 text-gray-500">
                        Drop blocks here to build your form
                      </div>
                    ) : (
                      blocks.map((block, index) => (
                        <Draggable 
                          key={block.id} 
                          draggableId={block.id} 
                          index={index}
                          isDragDisabled={block.name === 'welcome-screen' && index === 0} 
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`relative bg-gray-700 p-4 rounded-lg shadow transition-shadow duration-200 ${snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500' : 'shadow-md'}`}
                            >
                              <div {...provided.dragHandleProps} className="absolute top-3 left-2 cursor-grab text-gray-500 hover:text-gray-300" title="Drag to reorder">
                                 <Bars3Icon className="h-5 w-5" />
                              </div>
                              
                              <div className="ml-6">
                                 <div className="flex justify-between items-center mb-1">
                                    <div className="font-medium text-gray-200">
                                       {block.name}
                                       {block.name !== 'welcome-screen' && <span className="text-xs text-gray-400 ml-1">#{index}</span>}
                                    </div>
                                    <div className="flex space-x-2">
                                       <button onClick={() => editBlock(block)} className="text-xs bg-sky-800 hover:bg-sky-700 px-2 py-1 rounded">Edit</button>
                                       {!(block.name === 'welcome-screen' && index === 0) && (
                                         <button onClick={() => removeBlock(block.id)} className="text-xs bg-rose-800 hover:bg-rose-700 px-2 py-1 rounded">✕</button>
                                       )}
                                    </div>
                                 </div>
                                 <p className="text-sm text-gray-300 truncate" title={block.attributes.label}>{block.attributes.label || '(No Label)'}</p>
                                 {block.attributes.required && (
                                    <span className="text-xs font-semibold text-red-400 mt-1 inline-block">Required</span>
                                 )}
                              </div> 
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder} 
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </div> 
      </div>
    </DragDropContext>
  );
};

export default FormBuilder; 