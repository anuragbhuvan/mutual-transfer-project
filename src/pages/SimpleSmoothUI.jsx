import React, { useState, useEffect } from "react";
import { FaHome, FaUser, FaBell, FaSignOutAlt, FaEdit, FaTrash, FaSearch, FaExchangeAlt, FaUserFriends, FaHeadset, FaCheckCircle, FaBan, FaTimesCircle, FaCheck, FaUserEdit, FaCog, FaChevronDown, FaMapMarkerAlt, FaArrowRight, FaShare, FaUserTie } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase/config";
import { useAuth } from "../firebase/AuthProvider";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

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
import RequestToAdmin from "./RequestToAdmin";
import AdminPanel from './AdminPanel';

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

const SimpleSmoothUI = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { currentUser, isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [transferRequestData, setTransferRequestData] = useState(null);
  const [transferDataLoading, setTransferDataLoading] = useState(true);
  const [userPost, setUserPost] = useState('');
  const [userGrade, setUserGrade] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');
  
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
  
  // Fetch user's transfer request data
  useEffect(() => {
    const fetchTransferRequestData = async () => {
      if (!currentUser) return;
      
      try {
        setTransferDataLoading(true);
        const requestQuery = query(
          collection(db, 'transferRequests'),
          where('userId', '==', currentUser.uid)
        );
        
        const requestSnapshot = await getDocs(requestQuery);
        
        if (!requestSnapshot.empty) {
          const requestData = requestSnapshot.docs[0].data();
          setTransferRequestData(requestData);
        }
      } catch (err) {
        console.error('Error fetching transfer request data:', err);
      } finally {
        setTransferDataLoading(false);
      }
    };
    
    fetchTransferRequestData();
  }, [currentUser]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPost(userData.post || '');
          setUserGrade(userData.grade || '');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
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

  // Function to generate share text
  const generateShareText = (request) => {
    const text = `
Transfer Request Details:
Name: ${request.name}
Post: ${request.post}
Grade: ${request.grade}
Current Location: ${request.currentLocation}
Preferred Locations: ${request.preferredLocations.join(', ')}
Reason: ${request.reason}
Status: ${request.status}
    `.trim();
    setShareText(text);
    setShowShareModal(true);
  };

  // Function to share via WhatsApp
  const shareViaWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  // Function to share via Telegram
  const shareViaTelegram = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=&text=${encodedText}`, '_blank');
  };

  // Function to copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    alert('Text copied to clipboard!');
  };

  // Sidebar menu items
  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: <FaHome className="w-5 h-5" /> },
    { 
      id: "my-transfer-request", 
      name: "My Transfer Request", 
      icon: <FaEdit className="w-5 h-5" />,
      hasDetails: true,
      details: transferRequestData && (
        <div className="mt-1 pl-8 text-xs text-gray-500">
          <div className="flex items-center mb-1">
            <FaMapMarkerAlt className="text-red-500 mr-1" /> 
            <span>{transferRequestData.currentZone || 'Not set'} ({transferRequestData.currentDivision || ''})</span>
          </div>
          <div className="flex items-center">
            <FaArrowRight className="text-green-500 mr-1" /> 
            <span>{transferRequestData.preferredZone || 'Not set'} ({transferRequestData.preferredDivision || ''})</span>
          </div>
        </div>
      )
    },
    { id: "one-to-one-matches", name: "One-to-One Matches", icon: <FaExchangeAlt className="w-5 h-5" /> },
    { id: "chain-transfer-matches", name: "Chain Transfer Matches", icon: <FaUserFriends className="w-5 h-5" /> },
    { id: "incoming-requests", name: "Incoming Requests", icon: <FaBell className="w-5 h-5" /> },
    { id: "my-accepted-requests", name: "My Accepted Requests", icon: <FaCheckCircle className="w-5 h-5" /> },
    { id: "my-rejected-requests", name: "My Rejected Requests", icon: <FaTimesCircle className="w-5 h-5" /> },
    { id: "blocked-users", name: "Blocked Users", icon: <FaBan className="w-5 h-5" /> },
    { id: "accepted-by-others", name: "Accepted by Others", icon: <FaCheck className="w-5 h-5" /> },
    { id: "request-to-admin", name: "Request to Admin", icon: <FaUserTie className="w-5 h-5" /> },
    { id: "profile-edit", name: "Edit Profile", icon: <FaUserEdit className="w-5 h-5" /> },
    { id: "settings", name: "Settings", icon: <FaCog className="w-5 h-5" /> },
    { id: "help", name: "Help & Support", icon: <FaHeadset className="w-5 h-5" /> },
    { id: "admin-panel", name: "Admin Panel", icon: <FaUserTie className="w-5 h-5" /> },
    { id: "logout", name: "Logout", icon: <FaSignOutAlt className="w-5 h-5" />, onClick: handleLogout }
  ];

  // Render page based on active tab
  const renderPage = () => {
    console.log('Rendering page for activeTab:', activeTab);
    const key = `${activeTab}-${Date.now()}`; // Add a unique key to force re-render
    
    switch (activeTab) {
      case "dashboard":
        return <Dashboard key={key} />;
      case "my-transfer-request":
        return <MyTransferRequest key={key} />;
      case "one-to-one-matches":
        return <OneToOneMatches key={key} />;
      case "chain-transfer-matches":
        return <ChainTransferMatches key={key} />;
      case "incoming-requests":
        return <IncomingRequests key={key} />;
      case "my-accepted-requests":
        return <MyAcceptedRequests key={key} />;
      case "my-rejected-requests":
        return <MyRejectedRequests key={key} />;
      case "blocked-users":
        return <BlockedUsers key={key} />;
      case "accepted-by-others":
        return <AcceptedByOthers key={key} />;
      case "employee-form":
        return <EmployeeForm key={key} />;
      case "profile-edit":
        return <Profile key={key} />;
      case "request-to-admin":
        return <RequestToAdmin key={key} />;
      case "admin-panel":
        return <AdminPanel key={key} />;
      default:
        return <div key={key}>Page not found</div>;
    }
  };

  // Add this inside the transfer request content section
  const renderTransferRequestContent = () => (
    <div className="space-y-6">
      {/* ... existing transfer request content ... */}
      
      {/* Add share button in the actions section */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(request)}
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(request.id)}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => generateShareText(request)}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            <FaShare className="mr-1" /> Share
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Share Transfer Request</h3>
            <textarea
              value={shareText}
              readOnly
              className="w-full h-32 p-2 border rounded mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={shareViaWhatsApp}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Share on WhatsApp
              </button>
              <button
                onClick={shareViaTelegram}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Share on Telegram
              </button>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Copy Text
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
              
              {/* Profile dropdown */}
              <div className="mx-2 relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center focus:outline-none"
                >
                  <div className="bg-indigo-700 rounded-full h-8 w-8 flex items-center justify-center text-white">
                    {currentUser?.email?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <div className="ml-2 text-left">
                    <div className="text-white">{currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}</div>
                    <div className="text-xs text-indigo-200">{userPost} • {userGrade}</div>
                  </div>
                  <FaChevronDown className="ml-1 text-white text-xs" />
                </button>
                
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 animate-fade-in">
                    <button
                      onClick={() => {
                        setActiveTab('profile-edit');
                        setProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaUserEdit className="inline mr-2" /> Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('my-transfer-request');
                        setProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaEdit className="inline mr-2" /> My Transfer Request
                    </button>
                    <button
                      onClick={() => {
                        // Add account settings functionality here
                        setProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FaCog className="inline mr-2" /> Account Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <FaSignOutAlt className="inline mr-2" /> Logout
                    </button>
                  </div>
                )}
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
                  <p className="text-sm text-gray-500">{userPost} • {userGrade}</p>
                </div>
              </div>
              
              {/* Main Navigation */}
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <div key={item.id}>
                    <NavItem 
                      active={activeTab === item.id} 
                      icon={item.icon} 
                      text={item.name} 
                      onClick={() => item.onClick ? item.onClick() : setActiveTab(item.id)} 
                    />
                    {item.hasDetails && activeTab === item.id && item.details}
                  </div>
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

export default SimpleSmoothUI; 