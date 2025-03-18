import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SimpleSmoothUI from './pages/SimpleSmoothUI';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './firebase/AuthProvider';

// Lazy load components
const Header = React.lazy(() => import('./components/Header'));
const Sidebar = React.lazy(() => import('./components/Sidebar'));
const AppRouter = React.lazy(() => import('./routes/Router'));
const SimpleApp = React.lazy(() => import('./pages/SimpleDashboard'));

// Admin Route Component with authentication check
const AdminRoute = ({ children }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/" />;
  }
  
  // Check if user is admin
  const isAdmin = currentUser.email === 'indianrapidmutualtransfer@gmail.com';
  
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [showSimpleView, setShowSimpleView] = useState(false);

  useEffect(() => {
    console.log('App.jsx: Initial render, setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('App.jsx: Auth state changed:', {
        isAuthenticated: !!user,
        uid: user?.uid,
        email: user?.email
      });
      
      setUser(user);
      setAuthChecked(true);
      
      if (user) {
        console.log('App.jsx: User is authenticated, should redirect to /dashboard');
      } else {
        console.log('App.jsx: No user, should show Auth component');
      }
    });

    return () => {
      console.log('App.jsx: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Handle navigation from sidebar to specific sections
  const handleSidebarNavigation = (section) => {
    console.log('Navigating to section:', section);
    setActiveSection(section);
    
    // Check if the section is for simple view
    if (section === 'simple-view') {
      setShowSimpleView(true);
      return;
    } else {
      setShowSimpleView(false);
    }
    
    // Store active section in session storage
    if (section === null) {
      sessionStorage.removeItem('activeSection');
    } else {
      sessionStorage.setItem('activeSection', section);
    }
    
    // Scroll to section
    if (section) {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Show loading spinner while checking auth state
  if (!authChecked) {
    console.log('App.jsx: Still checking auth state...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  console.log('App.jsx: Rendering main app with auth state:', {
    isAuthenticated: !!user,
    currentPath: window.location.pathname
  });

  // If in simple view mode, render SimpleApp
  if (showSimpleView && user) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
            </div>
          }>
            <SimpleApp />
          </Suspense>
          <button 
            onClick={() => setShowSimpleView(false)}
            className="fixed bottom-4 right-4 bg-[#5A4AE3] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#4A3AD3]"
          >
            Switch to Full View
          </button>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
          </div>
        }>
          <Header />
        </Suspense>
        <ToastContainer 
          position="top-right" 
          autoClose={3000} 
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        
        {/* Main Layout with Sidebar */}
        <div className="fixed-header-layout with-sidebar-layout">
          {/* Sidebar - Only show when user is authenticated */}
          {user && (
            <div className="sidebar-content">
              <Suspense fallback={<div className="w-64 bg-indigo-500/50 animate-pulse h-screen"></div>}>
                <Sidebar onNavigate={handleSidebarNavigation} />
              </Suspense>
            </div>
          )}
          
          {/* Main Content */}
          <main className={`main-content ${user ? 'ml-0 md:ml-64' : ''} transition-all duration-300 bg-gray-50 pl-0 md:pl-4`}>
            <div className="max-w-5xl mx-auto p-5 bg-gray-50">
              <Suspense fallback={
                <div className="flex justify-center items-center h-72">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-indigo-600"></div>
                  <p className="ml-3 text-indigo-600 font-medium">Loading...</p>
                </div>
              }>
                <div className="rounded-xl overflow-hidden bg-white shadow-md border border-gray-100">
                  <Routes>
                    <Route path="/" element={<SimpleSmoothUI />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route 
                      path="/admin" 
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      } 
                    />
                  </Routes>
                </div>
              </Suspense>
            </div>
          </main>
          
          {/* Simple View Toggle Button */}
          {user && (
            <button 
              onClick={() => setShowSimpleView(true)}
              className="fixed bottom-4 right-4 bg-[#5A4AE3] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#4A3AD3]"
            >
              Switch to Simple View
            </button>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App; 