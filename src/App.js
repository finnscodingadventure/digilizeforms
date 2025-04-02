import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { registerCoreBlocks } from '@quillforms/react-renderer-utils';

// Register all the core blocks
registerCoreBlocks();

// Pages
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormPreview from './pages/FormPreview';
import FormResponses from './pages/FormResponses';
import Login from './pages/Login';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider } from './context/AuthContext';
import { FormsProvider } from './context/FormsContext';

// Utils
import './utils/profileRepair'; // Import the profile repair utility

function App() {
  // Log application startup
  useEffect(() => {
    console.log('DigilizeForms application initialized');
    console.log('If you encounter issues with saving forms, type "fixMyProfile()" in the browser console');
    console.log('To verify database setup, type "checkDatabase()" in the browser console');
  }, []);

  return (
    <AuthProvider>
      <FormsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="forms/new" element={<FormBuilder />} />
            <Route path="forms/:formId/edit" element={<FormBuilder />} />
            <Route path="forms/:formId/preview" element={<FormPreview />} />
            <Route path="forms/:formId/responses" element={<FormResponses />} />
          </Route>
          
          <Route path="/form/:formId" element={<FormPreview publicMode={true} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </FormsProvider>
    </AuthProvider>
  );
}

export default App; 