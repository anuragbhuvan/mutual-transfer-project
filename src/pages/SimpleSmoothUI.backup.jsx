import React, { useState, useEffect } from "react";
import { FaHome, FaUser, FaBell, FaSignOutAlt, FaEdit, FaTrash, FaSearch, FaExchangeAlt, FaUserFriends, FaHeadset, FaCheckCircle, FaBan, FaTimesCircle, FaCheck, FaUserEdit } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";
import { useAuth } from "../firebase/AuthProvider";

// Import page components
import Dashboard from "./Dashboard";
import MyTransferRequest from "./MyTransferRequest";
import OneToOneMatches from "./OneToOneMatches";
import ChainTransferMatches from "./ChainTransferMatches";
import IncomingRequests from "./IncomingRequests";
import MyAcceptedRequests from "./MyAcceptedRequests";
import MyRejectedRequests from "./MyRejectedRequests";
import BlockedUsers from "./BlockedUsers";
import AcceptedByOthers from "./AcceptedByOthers";
import EmployeeForm from "./EmployeeForm";
import Auth from "./Auth";
import Profile from "./Profile";

const SimpleSmoothUI = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check for activeSection in sessionStorage on component mount and when location changes
  useEffect(() => {
    const activeSection = sessionStorage.getItem('activeSection');
    console.log('SimpleSmoothUI: Reading from sessionStorage, activeSection=', activeSection);
    if (activeSection) {
      console.log('Setting activeTab to:', activeSection);
      setActiveTab(activeSection);
      sessionStorage.removeItem('activeSection'); // Clear after use
    }
  }, [location.pathname]); // Add location.pathname as dependency
  
  // Update activeTab when location changes (for direct URL navigation)
  useEffect(() => {
    if (location.pathname === '/employee-form') {
      setActiveTab('employee-form');
    }
  }, [location]);
  
  // If still loading auth state, show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }
  
  // If not authenticated, show the Auth component instead of redirecting
  if (!isAuthenticated) {
    return <Auth />;
  }
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Sidebar menu items
  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: <FaHome className="w-5 h-5" /> },
    { id: "my-transfer-request", name: "My Transfer Request", icon: <FaEdit className="w-5 h-5" /> },
    { id: "one-to-one-matches", name: "One-to-One Matches", icon: <FaExchangeAlt className="w-5 h-5" /> },
    { id: "chain-transfer-matches", name: "Chain Transfer Matches", icon: <FaUserFriends className="w-5 h-5" /> },
    { id: "incoming-requests", name: "Incoming Requests", icon: <FaBell className="w-5 h-5" /> },
    { id: "my-accepted-requests", name: "My Accepted Requests", icon: <FaCheckCircle className="w-5 h-5" /> },
    { id: "my-rejected-requests", name: "My Rejected Requests", icon: <FaTimesCircle className="w-5 h-5" /> },
    { id: "blocked-users", name: "Blocked Users", icon: <FaBan className="w-5 h-5" /> },
    { id: "accepted-by-others", name: "Accepted by Others", icon: <FaCheck className="w-5 h-5" /> },
    { id: "profile-edit", name: "Edit Profile", icon: <FaUserEdit className="w-5 h-5" /> },
  ];

  // Render page based on active tab
  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "my-transfer-request":
        return <MyTransferRequest />;
      case "one-to-one-matches":
        return <OneToOneMatches />;
      case "chain-transfer-matches":
        return <ChainTransferMatches />;
      case "incoming-requests":
        return <IncomingRequests />;
      case "my-accepted-requests":
        return <MyAcceptedRequests />;
      case "my-rejected-requests":
        return <MyRejectedRequests />;
      case "blocked-users":
        return <BlockedUsers />;
      case "accepted-by-others":
        return <AcceptedByOthers />;
      case "employee-form":
        return <EmployeeForm />;
      case "profile-edit":
        return <Profile />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Navbar - Simplified with only logo, bell, profile and logout */}
      <header className="bg-indigo-600 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-white text-xl font-bold">Indian Rapid Mutual Transfer</h1>
            </div>
            
            {/* Right side - Bell icon, profile and logout */}
            <div className="flex items-center">
              <button
                onClick={() => setActiveTab('incoming-requests')}
                className="p-1 mx-2 rounded-full text-indigo-200 hover:text-white focus:outline-none"
              >
                <FaBell className="h-6 w-6" />
              </button>
              
              <div className="mx-2">
                <div className="flex items-center">
                  <div className="bg-indigo-700 rounded-full h-8 w-8 flex items-center justify-center text-white">
                    {currentUser?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <span className="ml-2 text-white">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}</span>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center ml-2 px-3 py-2 border border-indigo-400 text-indigo-200 rounded-md hover:bg-indigo-500 hover:text-white"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Always visible */}
        <div className="flex flex-shrink-0">
          <div className="w-72 bg-white shadow-md overflow-y-auto">
            <div className="p-4">
              {/* User Profile Section */}
              <div className="flex items-center space-x-3 p-2 mb-4 border-b border-gray-200 pb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {currentUser?.email?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{currentUser?.displayName || currentUser?.email || 'User'}</p>
                  <p className="text-sm text-gray-500">JE (Works) • 4200</p>
                </div>
              </div>
              
              {/* Main Navigation */}
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <NavItem 
                    key={item.id}
                    active={activeTab === item.id} 
                    icon={item.icon} 
                    text={item.name} 
                    onClick={() => setActiveTab(item.id)} 
                  />
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {renderPage()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const NavItem = ({ active, icon, text, onClick }) => {
  return (
    <button
      className={`flex items-center w-full p-3 rounded-lg transition-all ${
        active 
          ? "bg-indigo-50 text-indigo-600 font-medium" 
          : "text-gray-700 hover:bg-gray-100"
      }`}
      onClick={onClick}
    >
      <div className={`${active ? "text-indigo-600" : "text-gray-500"} flex-shrink-0 mr-3`}>
        {icon}
      </div>
      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{text}</span>
    </button>
  );
};

export default SimpleSmoothUI; 