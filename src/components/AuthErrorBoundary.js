import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkSupabaseConnection } from '../utils/supabase';

/**
 * Component that monitors authentication state and provides recovery options
 * when authentication errors are detected.
 */
const AuthErrorBoundary = ({ children }) => {
  const { error, loading, isAuthenticated } = useAuth();
  const [showRecovery, setShowRecovery] = useState(false);
  const navigate = useNavigate();
  
  // Show recovery options when an error occurs
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setShowRecovery(true);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Reset when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      setShowRecovery(false);
    }
  }, [isAuthenticated]);
  
  const handleLogout = () => {
    // Clear local storage to force a fresh login
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to login page
    navigate('/login');
    
    // Reload the page after a short delay to ensure a clean state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  // If we're showing recovery options, display them
  if (showRecovery) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Authentication Issue Detected</h2>
          
          <div className="mb-4 text-gray-300">
            <p className="mb-2">We're having trouble with your authentication session. You can try:</p>
            <ul className="list-disc pl-5 mb-4">
              <li>Clearing your session and logging in again</li>
              <li>Reloading the page</li>
              <li>Checking your internet connection</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={handleLogout}
              className="w-full btn"
            >
              Clear Session & Re-login
            </button>
            
            <button 
              onClick={() => window.location.reload()}
              className="w-full btn-secondary"
            >
              Reload Page
            </button>
            
            <button 
              onClick={() => setShowRecovery(false)}
              className="w-full text-gray-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Otherwise, render children normally
  return children;
};

export default AuthErrorBoundary; 