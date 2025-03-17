import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

const RequestReceived = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!auth.currentUser) return;
      
      try {
        setLoading(true);
        
        // Query notifications where the current user is the recipient
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('toUserId', '==', auth.currentUser.uid),
          where('status', '==', 'pending')
        );
        
        const snapshot = await getDocs(q);
        const requestsData = [];
        
        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          requestsData.push({
            id: docSnapshot.id,
            ...data
          });
        }
        
        setRequests(requestsData);
      } catch (err) {
        console.error('Error fetching requests:', err);
        setError('Failed to load requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, []);

  const handleAccept = async (requestId) => {
    try {
      // Update the notification status to accepted
      const notificationRef = doc(db, 'notifications', requestId);
      await updateDoc(notificationRef, {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'accepted' } : req
      ));
      
      // TODO: Implement logic to create a match record or update user status
      
    } catch (err) {
      console.error('Error accepting request:', err);
      alert('Failed to accept request. Please try again.');
    }
  };

  const handleReject = async (requestId) => {
    try {
      // Update the notification status to rejected
      const notificationRef = doc(db, 'notifications', requestId);
      await updateDoc(notificationRef, {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'rejected' } : req
      ));
      
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request. Please try again.');
    }
  };

  const handleBlock = async (requestId, userId) => {
    if (!confirm('Are you sure you want to block this user? You will not see their requests anymore.')) {
      return;
    }
    
    try {
      // First reject the request
      await handleReject(requestId);
      
      // Then add to blocked users collection
      await addDoc(collection(db, 'blockedUsers'), {
        blockedBy: auth.currentUser.uid,
        blockedUserId: userId,
        createdAt: serverTimestamp()
      });
      
      // Remove from local state
      setRequests(requests.filter(req => req.id !== requestId));
      
    } catch (err) {
      console.error('Error blocking user:', err);
      alert('Failed to block user. Please try again.');
    }
  };

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Handle Firebase timestamp
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    
    // Handle string timestamp
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleDateString();
    }
    
    // Handle Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[70vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold">Error Loading Requests</h3>
          </div>
          <p className="mt-2 ml-10">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 ml-10 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200 inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-indigo-50 to-white min-h-screen rounded-lg">
      <div className="max-w-6xl mx-auto">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-xl shadow-xl p-6 mb-8 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10"></div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white flex items-center relative z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
            </svg>
            Transfer Requests Received
          </h1>
          <p className="text-indigo-100 ml-11 relative z-10 max-w-3xl">
            Review and manage incoming transfer requests from other railway employees. Accept requests to initiate the transfer process or reject those that don't match your requirements.
          </p>
        </div>
        
        {requests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-xl p-10 text-center border border-indigo-100"
          >
            <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">No Transfer Requests Yet</h2>
            <p className="text-gray-600 max-w-md mx-auto">You haven't received any transfer requests from other employees. When someone sends you a request, it will appear here.</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => window.location.href = '/dashboard'} 
                className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white font-medium py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Dashboard
              </button>
              <button 
                onClick={() => window.location.href = '/matches'} 
                className="bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 font-medium py-2 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                View Available Matches
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg text-gray-700 font-medium">
                Showing {requests.length} request{requests.length !== 1 ? 's' : ''}
              </h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 font-medium py-1.5 px-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {requests.map((request, index) => (
                <motion.div 
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  {/* Request header with gradient */}
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-400 py-4 px-6">
                    <div className="flex justify-between items-center">
                      <h2 className="font-bold text-xl text-white">
                        {request.fromUserName || 'Unknown User'}
                      </h2>
                      <span className="bg-white/20 backdrop-blur-sm text-white text-sm py-1 px-3 rounded-full border border-white/30">
                        {request.fromDepartment || 'Department Not Specified'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Current Location Card */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 shadow-sm">
                        <h3 className="text-gray-800 font-semibold mb-3 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Current Location
                        </h3>
                        <p className="text-gray-700 mb-2">
                          <span className="font-medium">Location:</span> {request.fromCurrentLocation || 'Not specified'}
                        </p>
                        <p className="text-gray-700">
                          <span className="font-medium">Post:</span> {request.fromPost || 'Not specified'}
                        </p>
                      </div>
                      
                      {/* Wanted Location Card */}
                      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100 shadow-sm">
                        <h3 className="text-gray-800 font-semibold mb-3 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          Requested Location
                        </h3>
                        <p className="text-gray-700">
                          <span className="font-medium">Location:</span> {request.fromWantedLocation || 'Not specified'}
                        </p>
                        {request.message && (
                          <div className="mt-3 p-3 bg-white/70 rounded-lg border border-indigo-100">
                            <p className="text-gray-600 text-sm italic">
                              "{request.message}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-gray-500 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Received: {formatDate(request.createdAt)}
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleAccept(request.id)}
                          className="btn flex items-center text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Accept
                        </button>
                        
                        <button
                          onClick={() => handleReject(request.id)}
                          className="btn flex items-center text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                        
                        <button
                          onClick={() => handleBlock(request.id, request.fromUserId)}
                          className="btn flex items-center bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Block
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestReceived; 