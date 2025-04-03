import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { registerCoreBlocks } from '@quillforms/react-renderer-utils';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';

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
import AuthErrorBoundary from './components/AuthErrorBoundary';

// Context
import { AuthProvider } from './context/AuthContext';
import { FormsProvider } from './context/FormsContext';

// Utils
import './utils/profileRepair'; // Import the profile repair utility

// Helper component to redirect to login if not authenticated
const RedirectToLogin = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    // Show a loading indicator during authentication check
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
};

function App() {
  // Log application startup
  useEffect(() => {
    console.log('DigilizeForms application initialized');
    console.log('If you encounter issues with saving forms, type "fixMyProfile()" in the browser console');
    console.log('To verify database setup, type "checkDatabase()" in the browser console');
  }, []);

  return (
    <AuthProvider>
      <AuthErrorBoundary>
        <FormsProvider>
          <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
          />
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
            
            {/* Public form access doesn't require authentication */}
            <Route path="/form/:formId" element={<FormPreview publicMode={true} />} />
            
            {/* Catch all other routes and redirect to login or dashboard */}
            <Route path="*" element={<RedirectToLogin />} />
          </Routes>
        </FormsProvider>
      </AuthErrorBoundary>
    </AuthProvider>
  );
}

export default App; 