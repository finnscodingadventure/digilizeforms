import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForms } from '../context/FormsContext';
import { useAuth } from '../context/AuthContext';

const FormBuilder = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { createForm, updateForm, getForm } = useForms();
  const { user } = useAuth();
  
  const [formTitle, setFormTitle] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [blocks, setBlocks] = useState([
    {
      name: 'welcome-screen',
      id: 'welcome-screen',
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

  // Load form data if we're editing an existing form
  useEffect(() => {
    if (formId) {
      const fetchForm = async () => {
        try {
          setLoading(true);
          const form = getForm(formId);
          
          if (form) {
            console.log('Loaded form from context:', form);
            setFormTitle(form.title || '');
            setIsPublished(form.is_published || false);
            
            // Convert from database structure to editor structure
            if (form.form_structure) {
              setBlocks(form.form_structure.blocks || blocks);
              setTheme(form.form_structure.theme || theme);
            }
          } else {
            console.log('Form not found in context');
          }
        } catch (err) {
          console.error('Error loading form:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      
      fetchForm();
    } else {
      setLoading(false);
    }
  }, [formId, getForm]);

  // Confirm we have a user
  useEffect(() => {
    if (!loading && !user) {
      console.error('No authenticated user found');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const addBlock = (blockType) => {
    const newBlockId = `block-${Date.now()}`;
    
    let newBlock = {
      id: newBlockId,
      name: blockType,
      attributes: {
        required: true,
        label: 'New Question',
      },
    };
    
    // Set type-specific default attributes
    switch (blockType) {
      case 'welcome-screen':
        newBlock.attributes = {
          ...newBlock.attributes,
          label: 'Welcome to our form',
          description: 'Please answer the following questions',
          buttonText: 'Start',
        };
        break;
      case 'multiple-choice':
        newBlock.attributes = {
          ...newBlock.attributes,
          choices: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3' },
          ],
          multiple: false,
        };
        break;
      case 'date':
        newBlock.attributes = {
          ...newBlock.attributes,
          format: 'MMDDYYYY',
          separator: '/',
        };
        break;
      case 'dropdown':
        newBlock.attributes = {
          ...newBlock.attributes,
          choices: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' },
            { value: 'option3', label: 'Option 3' },
          ],
        };
        break;
      case 'statement':
        newBlock.attributes = {
          ...newBlock.attributes,
          label: 'This is a statement',
          buttonText: 'Continue',
        };
        break;
      case 'group':
        newBlock.attributes = {
          ...newBlock.attributes,
          label: 'Group of questions',
        };
        newBlock.innerBlocks = [
          {
            id: `${newBlockId}-inner-1`,
            name: 'short-text',
            attributes: {
              required: true,
              label: 'Question 1',
            },
          },
          {
            id: `${newBlockId}-inner-2`,
            name: 'short-text',
            attributes: {
              required: true,
              label: 'Question 2',
            },
          },
        ];
        break;
      default:
        break;
    }
    
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (blockId) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
  };

  const updateBlock = (blockId, updatedData) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, ...updatedData } : block
    ));
  };

  const moveBlockUp = (index) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    setBlocks(newBlocks);
  };

  const moveBlockDown = (index) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const handleEditBlock = (block) => {
    setEditingBlock(block);
    setShowEditModal(true);
  };

  const saveBlockEdit = (updatedBlock) => {
    setBlocks(blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    ));
    setEditingBlock(null);
    setShowEditModal(false);
  };

  const cancelBlockEdit = () => {
    setEditingBlock(null);
    setShowEditModal(false);
  };

  const handleSave = async () => {
    if (!user) {
      console.error('Attempt to save form without authenticated user');
      alert('You must be logged in to save forms');
      navigate('/login');
      return;
    }

    // Log user information to debug
    console.log('Current user:', user);
    console.log('User ID:', user.id);

    if (!formTitle.trim()) {
      alert('Please enter a form title');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const formObj = {
        blocks,
        theme,
        settings: {
          disableProgressBar: false,
          disableWheelSwiping: false,
          showQuestionsNumbers: true,
        },
      };
      
      console.log('Saving form with data:', {
        title: formTitle,
        formObj,
        isPublished
      });
      
      if (formId) {
        await updateForm(formId, { 
          title: formTitle, 
          formObj,
          isPublished
        });
        alert('Form updated successfully!');
      } else {
        const newFormId = await createForm({ 
          title: formTitle, 
          formObj,
          isPublished
        });
        
        if (newFormId) {
          alert('Form created successfully!');
          navigate(`/forms/${newFormId}/edit`);
        } else {
          throw new Error('Failed to create form - no ID returned');
        }
      }
    } catch (err) {
      console.error('Error saving form:', err);
      setError(err.message);
      
      // Display detailed error message
      let errorMessage = `Error saving form: ${err.message}`;
      
      // Check for specific database errors
      if (err.message.includes('foreign key constraint')) {
        errorMessage += '\n\nThis might be because your user profile is not properly set up in the database.';
        errorMessage += '\nPlease try logging out and signing in again, or contact support.';
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (formId) {
      navigate(`/forms/${formId}/preview`);
    } else {
      alert('Please save the form first to preview it');
    }
  };

  // Render modal for editing block
  const renderEditModal = () => {
    if (!showEditModal || !editingBlock) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-dark-lighter rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Edit Question</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Question Label</label>
            <input
              type="text"
              className="input w-full"
              value={editingBlock.attributes.label}
              onChange={(e) => setEditingBlock({
                ...editingBlock,
                attributes: {
                  ...editingBlock.attributes,
                  label: e.target.value
                }
              })}
            />
          </div>

          {editingBlock.name !== 'welcome-screen' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Required</label>
              <input
                type="checkbox"
                checked={editingBlock.attributes.required}
                onChange={(e) => setEditingBlock({
                  ...editingBlock,
                  attributes: {
                    ...editingBlock.attributes,
                    required: e.target.checked
                  }
                })}
              />
            </div>
          )}
          
          {(editingBlock.name === 'welcome-screen' || editingBlock.name === 'statement') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                className="input w-full h-24"
                value={editingBlock.attributes.description || ''}
                onChange={(e) => setEditingBlock({
                  ...editingBlock,
                  attributes: {
                    ...editingBlock.attributes,
                    description: e.target.value
                  }
                })}
              />
            </div>
          )}
          
          {(editingBlock.name === 'welcome-screen' || editingBlock.name === 'statement') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Button Text</label>
              <input
                type="text"
                className="input w-full"
                value={editingBlock.attributes.buttonText || ''}
                onChange={(e) => setEditingBlock({
                  ...editingBlock,
                  attributes: {
                    ...editingBlock.attributes,
                    buttonText: e.target.value
                  }
                })}
              />
            </div>
          )}
          
          {(editingBlock.name === 'short-text' || editingBlock.name === 'long-text') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Placeholder</label>
              <input
                type="text"
                className="input w-full"
                value={editingBlock.attributes.placeholder || ''}
                onChange={(e) => setEditingBlock({
                  ...editingBlock,
                  attributes: {
                    ...editingBlock.attributes,
                    placeholder: e.target.value
                  }
                })}
              />
            </div>
          )}
          
          {(editingBlock.name === 'multiple-choice' || editingBlock.name === 'dropdown') && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Choices</label>
              {editingBlock.attributes.choices.map((choice, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    className="input flex-grow mr-2"
                    value={choice.label}
                    onChange={(e) => {
                      const updatedChoices = [...editingBlock.attributes.choices];
                      updatedChoices[index] = {
                        ...choice,
                        label: e.target.value,
                        value: e.target.value.toLowerCase().replace(/\s+/g, '-')
                      };
                      setEditingBlock({
                        ...editingBlock,
                        attributes: {
                          ...editingBlock.attributes,
                          choices: updatedChoices
                        }
                      });
                    }}
                  />
                  <button
                    className="bg-red-900 px-3 py-1 rounded"
                    onClick={() => {
                      const updatedChoices = editingBlock.attributes.choices.filter((_, i) => i !== index);
                      setEditingBlock({
                        ...editingBlock,
                        attributes: {
                          ...editingBlock.attributes,
                          choices: updatedChoices
                        }
                      });
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                className="btn-secondary mt-2"
                onClick={() => {
                  const updatedChoices = [
                    ...editingBlock.attributes.choices,
                    { value: `option${Date.now()}`, label: 'New Option' }
                  ];
                  setEditingBlock({
                    ...editingBlock,
                    attributes: {
                      ...editingBlock.attributes,
                      choices: updatedChoices
                    }
                  });
                }}
              >
                Add Option
              </button>
            </div>
          )}
          
          {editingBlock.name === 'multiple-choice' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <input
                  type="checkbox"
                  checked={editingBlock.attributes.multiple || false}
                  onChange={(e) => setEditingBlock({
                    ...editingBlock,
                    attributes: {
                      ...editingBlock.attributes,
                      multiple: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                Allow Multiple Selection
              </label>
            </div>
          )}
          
          {editingBlock.name === 'date' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Date Format</label>
                <select
                  className="input w-full"
                  value={editingBlock.attributes.format || 'MMDDYYYY'}
                  onChange={(e) => setEditingBlock({
                    ...editingBlock,
                    attributes: {
                      ...editingBlock.attributes,
                      format: e.target.value
                    }
                  })}
                >
                  <option value="MMDDYYYY">MM/DD/YYYY</option>
                  <option value="DDMMYYYY">DD/MM/YYYY</option>
                  <option value="YYYYMMDD">YYYY/MM/DD</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Separator</label>
                <select
                  className="input w-full"
                  value={editingBlock.attributes.separator || '/'}
                  onChange={(e) => setEditingBlock({
                    ...editingBlock,
                    attributes: {
                      ...editingBlock.attributes,
                      separator: e.target.value
                    }
                  })}
                >
                  <option value="/">/ (slash)</option>
                  <option value="-">- (dash)</option>
                  <option value=".">. (dot)</option>
                </select>
              </div>
            </>
          )}
          
          {editingBlock.name === 'number' && (
            <>
              <div className="flex mb-4">
                <div className="mr-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <input
                      type="checkbox"
                      checked={editingBlock.attributes.setMin || false}
                      onChange={(e) => setEditingBlock({
                        ...editingBlock,
                        attributes: {
                          ...editingBlock.attributes,
                          setMin: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    Set Minimum
                  </label>
                  {editingBlock.attributes.setMin && (
                    <input
                      type="number"
                      className="input w-full mt-2"
                      value={editingBlock.attributes.min || 0}
                      onChange={(e) => setEditingBlock({
                        ...editingBlock,
                        attributes: {
                          ...editingBlock.attributes,
                          min: parseInt(e.target.value)
                        }
                      })}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <input
                      type="checkbox"
                      checked={editingBlock.attributes.setMax || false}
                      onChange={(e) => setEditingBlock({
                        ...editingBlock,
                        attributes: {
                          ...editingBlock.attributes,
                          setMax: e.target.checked
                        }
                      })}
                      className="mr-2"
                    />
                    Set Maximum
                  </label>
                  {editingBlock.attributes.setMax && (
                    <input
                      type="number"
                      className="input w-full mt-2"
                      value={editingBlock.attributes.max || 100}
                      onChange={(e) => setEditingBlock({
                        ...editingBlock,
                        attributes: {
                          ...editingBlock.attributes,
                          max: parseInt(e.target.value)
                        }
                      })}
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {editingBlock.name === 'group' && editingBlock.innerBlocks && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Inner Questions</label>
              <div className="space-y-4 mt-2">
                {editingBlock.innerBlocks.map((innerBlock, index) => (
                  <div key={innerBlock.id} className="bg-dark p-3 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium text-sm">
                        {innerBlock.name} #{index + 1}
                      </div>
                      <button
                        className="text-xs bg-red-900 px-2 py-1 rounded"
                        onClick={() => {
                          const updatedInnerBlocks = editingBlock.innerBlocks.filter((_, i) => i !== index);
                          setEditingBlock({
                            ...editingBlock,
                            innerBlocks: updatedInnerBlocks
                          });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="mb-2">
                      <label className="block text-xs text-gray-400 mb-1">Question Label</label>
                      <input
                        type="text"
                        className="input w-full text-sm"
                        value={innerBlock.attributes.label}
                        onChange={(e) => {
                          const updatedInnerBlocks = [...editingBlock.innerBlocks];
                          updatedInnerBlocks[index] = {
                            ...innerBlock,
                            attributes: {
                              ...innerBlock.attributes,
                              label: e.target.value
                            }
                          };
                          setEditingBlock({
                            ...editingBlock,
                            innerBlocks: updatedInnerBlocks
                          });
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={innerBlock.attributes.required}
                        onChange={(e) => {
                          const updatedInnerBlocks = [...editingBlock.innerBlocks];
                          updatedInnerBlocks[index] = {
                            ...innerBlock,
                            attributes: {
                              ...innerBlock.attributes,
                              required: e.target.checked
                            }
                          };
                          setEditingBlock({
                            ...editingBlock,
                            innerBlocks: updatedInnerBlocks
                          });
                        }}
                      />
                      <label className="text-xs text-gray-400">Required</label>
                    </div>

                    {(innerBlock.name === 'short-text' || innerBlock.name === 'long-text') && (
                      <div className="mb-2">
                        <label className="block text-xs text-gray-400 mb-1">Placeholder</label>
                        <input
                          type="text"
                          className="input w-full text-sm"
                          value={innerBlock.attributes.placeholder || ''}
                          onChange={(e) => {
                            const updatedInnerBlocks = [...editingBlock.innerBlocks];
                            updatedInnerBlocks[index] = {
                              ...innerBlock,
                              attributes: {
                                ...innerBlock.attributes,
                                placeholder: e.target.value
                              }
                            };
                            setEditingBlock({
                              ...editingBlock,
                              innerBlocks: updatedInnerBlocks
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Add New Inner Question</label>
                <div className="flex">
                  <select
                    className="input flex-grow mr-2"
                    id="innerBlockType"
                    defaultValue="short-text"
                  >
                    <option value="short-text">Short Text</option>
                    <option value="long-text">Long Text</option>
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="date">Date</option>
                    <option value="website">Website</option>
                  </select>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      const blockType = document.getElementById('innerBlockType').value;
                      const newInnerBlockId = `${editingBlock.id}-inner-${Date.now()}`;
                      
                      let newInnerBlock = {
                        id: newInnerBlockId,
                        name: blockType,
                        attributes: {
                          required: true,
                          label: `New Question ${editingBlock.innerBlocks.length + 1}`,
                        },
                      };
                      
                      // Set type-specific default attributes for inner blocks
                      if (blockType === 'multiple-choice' || blockType === 'dropdown') {
                        newInnerBlock.attributes.choices = [
                          { value: 'option1', label: 'Option 1' },
                          { value: 'option2', label: 'Option 2' },
                          { value: 'option3', label: 'Option 3' },
                        ];
                        
                        if (blockType === 'multiple-choice') {
                          newInnerBlock.attributes.multiple = false;
                        }
                      }
                      
                      setEditingBlock({
                        ...editingBlock,
                        innerBlocks: [...editingBlock.innerBlocks, newInnerBlock]
                      });
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button onClick={cancelBlockEdit} className="btn-secondary">
              Cancel
            </button>
            <button onClick={() => saveBlockEdit(editingBlock)} className="btn">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      {renderEditModal()}
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Form Title
          </label>
          <input
            type="text"
            className="input w-64"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Enter form title"
          />
          
          <div className="mt-3 flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isPublished} 
                onChange={() => setIsPublished(!isPublished)} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">
                {isPublished ? 'Published' : 'Draft'}
              </span>
            </label>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleSave} 
            className={`btn ${saving ? 'opacity-50 cursor-not-allowed' : ''}`} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Form'}
          </button>
          <button onClick={handlePreview} className="btn-secondary" disabled={saving}>
            Preview
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-900/50 text-red-200 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Blocks Panel */}
        <div className="lg:col-span-1">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Add Blocks</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
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
              ].map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className="btn-secondary text-center py-3 px-2"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Theme Settings</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                className="w-full h-10 rounded"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Button Color
              </label>
              <input
                type="color"
                value={theme.buttonsBgColor}
                onChange={(e) => setTheme({ ...theme, buttonsBgColor: e.target.value })}
                className="w-full h-10 rounded"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Button Border Radius
              </label>
              <input
                type="range"
                min="0"
                max="25"
                value={theme.buttonsBorderRadius}
                onChange={(e) => setTheme({ ...theme, buttonsBorderRadius: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="text-center mt-1">{theme.buttonsBorderRadius}px</div>
            </div>
          </div>
        </div>
        
        {/* Form Preview */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Form Structure</h2>
            
            <div className="space-y-4">
              {blocks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  Add blocks to build your form
                </div>
              ) : (
                blocks.map((block, index) => (
                  <div key={block.id} className="bg-dark-lighter p-4 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">
                        {block.name} {index > 0 && <span className="text-xs text-gray-400">#{index}</span>}
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditBlock(block)} 
                          className="text-xs bg-blue-800 px-2 py-1 rounded"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => moveBlockUp(index)} 
                          className="text-xs bg-dark px-2 py-1 rounded"
                          disabled={index === 0}
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => moveBlockDown(index)} 
                          className="text-xs bg-dark px-2 py-1 rounded"
                          disabled={index === blocks.length - 1}
                        >
                          ↓
                        </button>
                        <button 
                          onClick={() => removeBlock(block.id)} 
                          className="text-xs bg-red-900 px-2 py-1 rounded"
                          disabled={index === 0 && blocks.length === 1}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-300 mb-2">
                      Label: {block.attributes.label}
                    </div>
                    
                    {block.name === 'multiple-choice' && (
                      <div className="text-xs text-gray-400">
                        Options: {block.attributes.choices.map(c => c.label).join(', ')}
                      </div>
                    )}
                    
                    {block.name === 'group' && block.innerBlocks && (
                      <div className="pl-4 mt-2 border-l border-gray-700">
                        <div className="text-xs text-gray-400 mb-1">Inner blocks:</div>
                        {block.innerBlocks.map((innerBlock, i) => (
                          <div key={innerBlock.id} className="text-xs text-gray-400">
                            {i+1}. {innerBlock.name}: {innerBlock.attributes.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder; 