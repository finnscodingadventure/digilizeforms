import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  
  const { login, signup, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';
  const loading = localLoading || authLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLocalLoading(true);
    
    try {
      if (isLogin) {
        // Login flow
        if (!email || !password) {
          setError('Please enter both email and password');
          setLocalLoading(false);
          return;
        }
        
        // Set a timeout to prevent UI from being stuck if auth is taking too long
        const timeoutId = setTimeout(() => {
          // This will only run if login hasn't completed in 15 seconds
          setError('Login request is taking longer than expected. You may continue to wait or try again.');
          setLocalLoading(false);
        }, 15000); // 15 second timeout
        
        try {
          const success = await login(email, password);
          clearTimeout(timeoutId);
          
          if (success) {
            // Redirect but keep the loading state to avoid flickering
            navigate('/');
          } else {
            setError('Invalid email or password');
            setLocalLoading(false);
          }
        } catch (loginError) {
          clearTimeout(timeoutId);
          console.error('Error during login:', loginError);
          setError(loginError.message || 'Login failed');
          setLocalLoading(false);
        }
      } else {
        // Signup flow
        if (!email || !password || !name) {
          setError('Please fill out all fields');
          setLocalLoading(false);
          return;
        }
        
        try {
          const success = await signup(email, password, name);
          
          if (success) {
            // Redirect to login page after successful signup
            setIsLogin(true);
            setPassword('');
            setError('Account created successfully. Please sign in.');
          } else {
            setError('Error creating account');
          }
        } catch (signupError) {
          console.error('Error during signup:', signupError);
          setError(signupError.message || 'Signup failed');
        } finally {
          setLocalLoading(false);
        }
      }
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setError(err.message || 'An unexpected error occurred');
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Digilize Forms" className="h-16 mx-auto mb-2" />
          <p className="text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                className="input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                disabled={loading}
              />
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              className="input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              className="input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn w-full"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-blue-400 hover:text-blue-300 text-sm"
            disabled={loading}
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login; 