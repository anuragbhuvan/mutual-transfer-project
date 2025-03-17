import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db, isFirebaseReady } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from 'firebase/firestore';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [pendingNotifications, setPendingNotifications] = useState(0);
  const [notificationsList, setNotificationsList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);
  const notificationsRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    
    // Clean up on unmount
    return () => unsubscribe();
  }, []);

  // Check if Firebase is ready
  useEffect(() => {
    // Check immediately if Firebase is already ready
    if (isFirebaseReady) {
      setIsDbReady(true);
    }
    
    // Set up an interval to check every 500ms until ready
    const checkInterval = setInterval(() => {
      if (isFirebaseReady) {
        setIsDbReady(true);
        clearInterval(checkInterval);
        console.log('Firebase is now ready in Header');
      }
    }, 500);
    
    return () => clearInterval(checkInterval);
  }, []);

  // Handle clicks outside the notifications dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch notification count and list
  useEffect(() => {
    const fetchNotificationData = async () => {
      if (!user || !isDbReady) return;
      
      console.log('DEBUGGING: Starting notification fetch for user:', user.uid);
      
      try {
        setLoading(true);
        console.log('Fetching notifications for user:', user.uid);
        
        // Get all notifications for the current user
        const q = query(
          collection(db, 'notifications'),
          where('toUserId', '==', user.uid),
          where('status', 'in', ['pending', 'accepted']), // Only fetch pending and accepted, not no_longer_matching
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        
        // Process notifications
        const notificationsData = [];
        let latestNotificationsByUser = {};
        
        snapshot.forEach((doc) => {
          const notificationData = { id: doc.id, ...doc.data() };
          
          // Skip notifications that are marked as no_longer_matching
          if (notificationData.status === 'no_longer_matching') {
            return;
          }
          
          // Rest of your processing code
          notificationsData.push(notificationData);
          latestNotificationsByUser[notificationData.fromUserId] = notificationData;
        });
        
        // Get the current user's transfer request to check for matching
        const transferRequestsRef = collection(db, 'transferRequests');
        const userRequestQuery = query(
          transferRequestsRef,
          where('userId', '==', user.uid),
          limit(1)
        );
        
        const userRequestSnapshot = await getDocs(userRequestQuery);
        const userRequest = userRequestSnapshot.docs.length > 0 
          ? userRequestSnapshot.docs[0].data() 
          : null;
        
        console.log('Current user transfer request:', userRequest);
        
        // Group notifications by fromUserId to prevent duplicates
        const notificationsByUser = {};
        
        for (const notification of notificationsData) {
          const fromUserId = notification.fromUserId;
          
          // Skip if we already have a newer notification from this user
          if (notificationsByUser[fromUserId] && 
              notificationsByUser[fromUserId].createdAt > notification.createdAt) {
            continue;
          }
          
          // Check if this notification still matches the user's requirements
          let stillMatches = true;
          let matchStatus = 'matching';
          
          if (userRequest && notification.fromTransferRequestId) {
            // Get the sender's transfer request to check if it still matches
            try {
              const senderRequestRef = doc(db, 'transferRequests', notification.fromTransferRequestId);
              const senderRequestSnap = await getDoc(senderRequestRef);
              
              if (senderRequestSnap.exists()) {
                const senderRequest = senderRequestSnap.data();
                console.log(`Checking match for notification from ${notification.fromUserName}:`, senderRequest);
                
                // Check if the sender's request was updated after the notification was created
                const requestUpdatedAt = senderRequest.updatedAt ? new Date(senderRequest.updatedAt) : null;
                const notificationCreatedAt = notification.createdAt ? new Date(notification.createdAt) : null;
                
                const fromRequestUpdated = requestUpdatedAt && notificationCreatedAt && 
                                          requestUpdatedAt > notificationCreatedAt;
                
                if (fromRequestUpdated) {
                  console.log('Sender request was updated after notification was created');
                  matchStatus = 'updated';
                }
                
                // Check if the requests still match each other
                const departmentMatch = !userRequest.department || !senderRequest.department || 
                                       userRequest.department === senderRequest.department;
                
                const subDepartmentMatch = !userRequest.subDepartment || !senderRequest.subDepartment || 
                                          userRequest.subDepartment === senderRequest.subDepartment;
                
                const postMatch = !userRequest.post || !senderRequest.post || 
                                 userRequest.post === senderRequest.post;
                
                const locationMatch = userRequest.currentLocation === senderRequest.wantedLocation && 
                                     userRequest.wantedLocation === senderRequest.currentLocation;
                
                stillMatches = departmentMatch && subDepartmentMatch && postMatch && locationMatch;
                
                if (!stillMatches) {
                  console.log('Notification no longer matches user requirements');
                  matchStatus = 'no_longer_matching';
                }
                
                // Update notification with match status
                notification.stillMatches = stillMatches;
                notification.fromRequestUpdated = fromRequestUpdated;
                notification.matchStatus = matchStatus;
                notification.lastUpdated = requestUpdatedAt ? requestUpdatedAt.toISOString() : null;
                
                // Add detailed match info for debugging
                notification.matchDetails = {
                  departmentMatch,
                  subDepartmentMatch,
                  postMatch,
                  locationMatch,
                  userDepartment: userRequest.department,
                  senderDepartment: senderRequest.department,
                  userLocation: userRequest.currentLocation,
                  senderWantedLocation: senderRequest.wantedLocation,
                  userWantedLocation: userRequest.wantedLocation,
                  senderLocation: senderRequest.currentLocation
                };
              } else {
                console.log('Sender transfer request not found');
                notification.stillMatches = false;
                notification.matchStatus = 'request_deleted';
              }
            } catch (error) {
              console.error('Error checking sender request:', error);
              notification.matchStatus = 'error_checking';
            }
          }
          
          notificationsByUser[fromUserId] = notification;
        }
        
        // Convert to array and filter out notifications that don't match anymore if needed
        const filteredNotifications = Object.values(notificationsByUser)
          .filter(notification => {
            // Keep all notifications but mark their status
            return true;
          });
        
        console.log(`Final notification count: ${filteredNotifications.length}`);
        
        // Store notifications in window object for Dashboard to access
        window.userNotifications = filteredNotifications;
        
        // Count unique users with pending notifications
        const pendingCount = filteredNotifications.filter(
          notification => notification.matchStatus === 'matching' || notification.matchStatus === 'updated'
        ).length;
        
        setPendingNotifications(pendingCount);
        setNotificationsList(filteredNotifications);
        console.log('Notifications updated:', filteredNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // Reset states to empty on error
        setPendingNotifications(0);
        setNotificationsList([]);
        setHasNewNotification(false);
      } finally {
        setLoading(false);
      }
    };

    // Add the event listener to refresh notifications on demand
    window.addEventListener('refresh-notifications', fetchNotificationData);
    
    // Only fetch if user is logged in and database is ready
    if (user && isDbReady) {
      fetchNotificationData();
      
      // Set up interval to refresh notifications count every minute
      const intervalId = setInterval(fetchNotificationData, 60000);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('refresh-notifications', fetchNotificationData);
      };
    }
    
    return () => {
      window.removeEventListener('refresh-notifications', fetchNotificationData);
    };
  }, [user, isDbReady]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleToggleNotifications = (e) => {
    e.preventDefault(); // Prevent any default behavior
    setShowNotifications(!showNotifications);
    
    // Mark notifications as seen when opening dropdown
    if (!showNotifications && user) {
      const lastCheckKey = `lastNotificationCheck_${user.uid}`;
      localStorage.setItem(lastCheckKey, Date.now().toString());
      setHasNewNotification(false);
    }
  };
  
  const handleNotificationItemClick = () => {
    setShowNotifications(false);
    
    // Navigate to dashboard with notifications open
    if (window.location.pathname === '/dashboard') {
      sessionStorage.setItem('openNotifications', 'true');
      window.location.href = '/dashboard?openNotifications=true';
    } else {
      navigate('/dashboard?openNotifications=true');
    }
  };

  // If Firebase is not ready yet, show a simpler header
  if (!isDbReady) {
    return (
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex">
              <Link to="/" className="text-xl font-bold text-[#5A4AE3]">
                Indian Rapid Mutual Transfer
              </Link>
            </div>
            <nav className="flex space-x-4">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-[#5A4AE3] px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              ) : (
                <Link to="/" className="text-gray-600 hover:text-[#5A4AE3] px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="flex items-center">
                {/* Logo */}
                <div className="relative h-9 w-9 mr-3 rounded-lg overflow-hidden bg-[#5A4AE3] shadow-sm flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#5A4AE3]">Indian Rapid</div>
                  <div className="text-xs font-medium text-gray-600">Mutual Transfer</div>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center">
            {user && (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    className={`p-2 rounded-full text-gray-600 hover:bg-indigo-50 hover:text-[#5A4AE3] focus:outline-none focus:ring-1 focus:ring-[#5A4AE3] ${hasNewNotification ? 'animate-pulse' : ''}`}
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <span className="sr-only">Notifications</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {pendingNotifications > 0 && (
                      <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">{pendingNotifications}</span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {/* Keep your existing notification items code */}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Dropdown */}
                <div className="ml-4 relative" ref={userMenuRef}>
                  <div>
                    <button
                      className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-1 focus:ring-[#5A4AE3]"
                      id="user-menu"
                      aria-expanded="false"
                      aria-haspopup="true"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-[#5A4AE3] flex items-center justify-center text-white">
                          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden md:block ml-2 text-sm font-medium text-gray-700">{user?.displayName || user?.email?.split('@')[0]}</span>
                        <svg className="hidden md:block h-4 w-4 ml-1 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  </div>
                  
                  {dropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-[#5A4AE3]" onClick={() => setDropdownOpen(false)}>
                          Your Profile
                        </Link>
                        <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-[#5A4AE3]" onClick={() => setDropdownOpen(false)}>
                          Dashboard
                        </Link>
                        <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-[#5A4AE3]">
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {!user && (
              <div>
                <Link to="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#5A4AE3] hover:bg-[#4A3AD3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A4AE3]">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 