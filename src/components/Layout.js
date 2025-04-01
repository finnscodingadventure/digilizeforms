import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-dark">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-dark-card transition-all duration-300 p-4 flex flex-col`}>
        <div className="flex items-center justify-between mb-10">
          <h1 className={`text-xl font-bold text-primary ${!sidebarOpen && 'hidden'}`}>
            <img src="/logo.png" alt="Digilize Forms" className="h-12" />
          </h1>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 rounded-full hover:bg-dark-lighter"
          >
            {sidebarOpen ? (
              <span>←</span>
            ) : (
              <span>→</span>
            )}
          </button>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/" 
                className={`flex items-center p-3 rounded ${location.pathname === '/' ? 'bg-primary text-white' : 'hover:bg-dark-lighter'}`}
              >
                <span className="mr-3">📊</span>
                {sidebarOpen && <span>Dashboard</span>}
              </Link>
            </li>
            <li>
              <Link 
                to="/forms/new" 
                className={`flex items-center p-3 rounded ${location.pathname === '/forms/new' ? 'bg-primary text-white' : 'hover:bg-dark-lighter'}`}
              >
                <span className="mr-3">➕</span>
                {sidebarOpen && <span>New Form</span>}
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="mt-auto">
          {sidebarOpen && (
            <div className="mb-4 text-sm text-gray-400">
              Logged in as: {user?.name}
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className={`w-full flex items-center p-3 rounded hover:bg-dark-lighter ${!sidebarOpen && 'justify-center'}`}
          >
            <span className="mr-3">🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-dark-lighter p-4 shadow-md">
          <div className="text-lg font-semibold">
            {location.pathname === '/' && 'Dashboard'}
            {location.pathname === '/forms/new' && 'Create New Form'}
            {location.pathname.includes('/edit') && 'Edit Form'}
            {location.pathname.includes('/preview') && 'Form Preview'}
            {location.pathname.includes('/responses') && 'Form Responses'}
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 