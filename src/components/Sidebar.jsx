import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

const Sidebar = ({ onNavigate }) => {
  const location = useLocation();
  const pathname = location.pathname;
  // Add state for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Track screen size
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userPost, setUserPost] = useState('');
  const [userGrade, setUserGrade] = useState('');
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPost(userData.post || '');
          setUserGrade(userData.grade || '');
        }
      }
    };
    
    fetchUserData();
  }, []);
  
  // Add effect to track window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Close mobile menu on window resize to desktop
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Define sidebar navigation items with category grouping
  const navItems = [
    {
      category: "Main",
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
          section: null,
        },
        {
          name: 'Your Transfer Request',
          path: '/dashboard',
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          section: 'your-request',
        },
        {
          name: 'Simple View',
          path: '#',
          icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          ),
          section: 'simple-view',
        },
      ]
    },
    {
      category: "Matches",
      items: [
        {
          name: 'Transfer Request Matches',
          path: '/matches',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          section: null,
        },
        {
          name: 'Cyclic Transfer Matches',
          path: '/cyclic-matches',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          section: null,
        },
      ]
    },
    {
      category: "Requests",
      items: [
        {
          name: 'Incoming Requests',
          path: '/incoming-requests',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
            </svg>
          ),
          section: null,
          highlight: true,
        },
        {
          name: 'Request Notifications',
          path: '/notifications',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
          section: null,
        },
      ]
    },
    {
      category: "Status",
      items: [
        {
          name: 'Requests You Accepted',
          path: '/my-accepted-requests',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          section: null,
        },
        {
          name: 'Your Accepted Requests',
          path: '/accepted-by-others',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
            </svg>
          ),
          section: null,
        },
        {
          name: 'Requests You Rejected',
          path: '/my-rejected-requests',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          section: null,
        },
        {
          name: 'Users You Blocked',
          path: '/blocked-users',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ),
          section: null,
        },
      ]
    },
    {
      category: "Account",
      items: [
        {
          name: 'Profile Settings',
          path: '/profile',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          section: null,
        },
      ]
    },
    {
      category: "Support & Help",
      items: [
        {
          name: 'Contact Support',
          path: '/support',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
          section: null,
          highlight: true,
        },
        {
          name: 'Help Center',
          path: '/help',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          section: null,
        },
      ]
    }
  ];

  // Get current active section from sessionStorage
  const getActiveSection = () => {
    const activeSection = sessionStorage.getItem('activeSection');
    return activeSection;
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Close mobile menu on navigation
  const handleMobileNavigation = (item) => {
    // Close mobile menu after navigation
    setIsMobileMenuOpen(false);
    
    // Handle normal navigation logic
    if (item.path === '/dashboard') {
      // Dashboard main link - show all sections
      if (item.section === null && item.name === 'Dashboard') {
        sessionStorage.removeItem('activeSection');
        onNavigate(null);
        return;
      }
      
      // For section links, navigate directly to that section
      if (item.section) {
        sessionStorage.setItem('activeSection', item.section);
        onNavigate(item.section);
      }
    }
  };

  // Smooth navigation with scroll
  const handleNavigation = (item) => {
    // If it's a section link and we're already on dashboard
    if (item.section !== null && pathname === '/dashboard') {
      // Store active section in session storage
      sessionStorage.setItem('activeSection', item.section);
      
      // Use onNavigate to scroll to the section
      onNavigate(item.section);
      
      // Add hash to URL without page reload
      window.history.pushState(null, '', `#${item.section}`);
    }
    
    // Close mobile menu if open
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Check if an item is active
  const isItemActive = (item) => {
    const currentSection = getActiveSection();
    
    // If it's the dashboard main link
    if (item.name === 'Dashboard' && item.section === null) {
      return pathname === '/dashboard' && !currentSection;
    }
    
    // If it's a section link
    if (item.section) {
      return pathname === '/dashboard' && currentSection === item.section;
    }
    
    // If it's not a dashboard link (like Profile)
    return pathname === item.path && !item.section;
  };

  return (
    <div className={`sidebar-container bg-[#5A4AE3] h-full border-r border-indigo-700 ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      {/* Mobile toggle button */}
      {isMobile && (
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden fixed right-4 top-4 z-50 bg-white p-2 rounded-full shadow-lg border border-gray-200"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      )}
      
      {/* Main sidebar content */}
      <div className={`sidebar ${isMobile && !isMobileMenuOpen ? 'hidden' : 'block'} h-full overflow-y-auto bg-[#5A4AE3] shadow-lg md:shadow-none w-64 pb-8`}>
        <div className="flex flex-col h-full">
          {/* Sidebar branding */}
          <div className="p-5 border-b border-indigo-600 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Indian Rapid</h2>
              <p className="text-sm text-indigo-200">Mutual Transfer</p>
            </div>
          </div>

          {/* User Info Section - Above Dashboard */}
          <div className="p-4 border-b border-indigo-600">
            <div className="flex flex-col">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm font-medium text-white truncate">
                  {auth.currentUser?.displayName || 'User'}
                </p>
              </div>
              <p className="text-xs text-indigo-200 ml-7">
                {userPost} {userGrade}
              </p>
            </div>
          </div>
          
          {/* Navigation items */}
          <div className="px-3 py-4 flex-grow">
            {navItems.map((category) => (
              <div key={category.category} className="mb-6">
                <h3 className="text-sm font-semibold text-indigo-200 uppercase tracking-wider mb-2 px-3">
                  {category.category}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={(e) => {
                        if (item.section !== null && pathname === '/dashboard') {
                          e.preventDefault();
                          handleNavigation(item);
                        } else if (isMobile) {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className={`group flex items-center px-3 py-2 text-base font-medium rounded-md transition-all ${
                        (pathname === item.path && item.section === null) || 
                        (pathname === '/dashboard' && item.section === location.hash.replace('#', ''))
                          ? 'bg-indigo-700 text-white'
                          : 'text-[#E0E0E0] hover:text-white hover:bg-indigo-600'
                      } ${item.highlight ? 'border-l-4 border-yellow-400' : ''}`}
                    >
                      <span className="mr-3 transition-transform group-hover:scale-110">{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div className="px-3 py-4 border-t border-indigo-600">
            <div className="bg-indigo-700 rounded-lg p-3 text-center">
              <p className="text-xs text-indigo-200 mb-2">© 2024 Indian Rapid Mutual Transfer</p>
              <p className="text-xs text-indigo-200">Your one-stop platform for railway transfers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 