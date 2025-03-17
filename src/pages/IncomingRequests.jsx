import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { FaCheck, FaTimes, FaEnvelope, FaEnvelopeOpen, FaBan, FaExchangeAlt, FaUserFriends, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../firebase/AuthProvider';

const IncomingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRequestDetails, setShowRequestDetails] = useState(null);
  const { currentUser, isAuthenticated } = useAuth();
  const [processingRequest, setProcessingRequest] = useState(null);
  
  useEffect(() => {
    const fetchIncomingRequests = async () => {
      try {
        setLoading(true);
        
        if (!currentUser) {
          console.log("IncomingRequests: No authenticated user found");
          setLoading(false);
          return;
        }
        
        console.log("IncomingRequests: Fetching data for user:", currentUser.email);
        
        // Get all incoming requests (notifications where toUserId is current user)
        const requestsQuery = query(
          collection(db, 'notifications'),
          where('toUserId', '==', currentUser.uid),
          where('type', 'in', ['transfer_request', 'chain_request'])
        );
        
        const requestsSnapshot = await getDocs(requestsQuery);
        
        if (requestsSnapshot.empty) {
          setRequests([]);
          setLoading(false);
          return;
        }
        
        // Process requests and get sender details
        const requestsData = [];
        
        for (const docSnapshot of requestsSnapshot.docs) {
          const requestData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
          
          // Get sender's transfer request to show details
          if (requestData.fromTransferRequestId) {
            try {
              const senderRequestDoc = await getDoc(doc(db, 'transferRequests', requestData.fromTransferRequestId));
              
              if (senderRequestDoc.exists()) {
                requestData.senderRequest = {
                  id: senderRequestDoc.id,
                  ...senderRequestDoc.data()
                };
              }
            } catch (err) {
              console.error('Error fetching sender request:', err);
            }
          }
          
          // Add to array
          requestsData.push(requestData);
        }
        
        // Sort by timestamp (newest first)
        requestsData.sort((a, b) => {
          const timestampA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
          const timestampB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
          return timestampB - timestampA;
        });
        
        setRequests(requestsData);
      } catch (err) {
        console.error('Error fetching incoming requests:', err);
        setError('Failed to load incoming requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchIncomingRequests();
  }, [currentUser]);
  
  // Handle accepting a request
  const handleAccept = async (notification) => {
    setProcessingRequest(notification.id);
    
    try {
      if (!currentUser) {
        setError('You must be logged in to accept requests');
        return;
      }
      
      // Get user's transfer request
      const userRequestQuery = query(
        collection(db, 'transferRequests'),
        where('userId', '==', currentUser.uid)
      );
      
      const userRequestSnapshot = await getDocs(userRequestQuery);
      
      if (userRequestSnapshot.empty) {
        setError('You must have an active transfer request to accept this request');
        return;
      }
      
      // Update notification status to accepted
      await updateDoc(doc(db, 'notifications', notification.id), {
        status: 'accepted',
        respondedAt: serverTimestamp()
      });
      
      // Create a new notification to inform the sender
      const responseNotification = {
        toUserId: notification.fromUserId,
        fromUserId: currentUser.uid,
        fromUserName: userRequestSnapshot.docs[0].data().name,
        fromTransferRequestId: userRequestSnapshot.docs[0].id,
        relatedNotificationId: notification.id,
        type: notification.type === 'chain_request' ? 'chain_response' : 'transfer_response',
        status: 'accepted',
        message: `Your transfer request has been accepted by ${userRequestSnapshot.docs[0].data().name}`,
        timestamp: serverTimestamp(),
        isRead: false
      };
      
      // If it's a chain request, add chain details
      if (notification.type === 'chain_request' && notification.chainId) {
        responseNotification.chainId = notification.chainId;
        responseNotification.chainDetails = notification.chainDetails;
      }
      
      await addDoc(collection(db, 'notifications'), responseNotification);
      
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === notification.id 
            ? { ...req, status: 'accepted', respondedAt: new Date() } 
            : req
        )
      );
      
      setSuccess('Transfer request accepted successfully.');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Failed to accept request. Please try again.');
      
      // Hide error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingRequest(null);
    }
  };
  
  // Handle rejecting a request
  const handleReject = async (notification) => {
    setProcessingRequest(notification.id);
    
    try {
      if (!currentUser) {
        setError('You must be logged in to reject requests');
        return;
      }
      
      // Get user's transfer request
      const userRequestQuery = query(
        collection(db, 'transferRequests'),
        where('userId', '==', currentUser.uid)
      );
      
      const userRequestSnapshot = await getDocs(userRequestQuery);
      
      // Update notification status to rejected
      await updateDoc(doc(db, 'notifications', notification.id), {
        status: 'rejected',
        respondedAt: serverTimestamp()
      });
      
      // Create a new notification to inform the sender
      const responseNotification = {
        toUserId: notification.fromUserId,
        fromUserId: currentUser.uid,
        fromUserName: userRequestSnapshot.empty ? currentUser.displayName || currentUser.email : userRequestSnapshot.docs[0].data().name,
        relatedNotificationId: notification.id,
        type: notification.type === 'chain_request' ? 'chain_response' : 'transfer_response',
        status: 'rejected',
        message: `Your transfer request has been rejected`,
        timestamp: serverTimestamp(),
        isRead: false
      };
      
      // If it's a chain request, add chain details
      if (notification.type === 'chain_request' && notification.chainId) {
        responseNotification.chainId = notification.chainId;
      }
      
      await addDoc(collection(db, 'notifications'), responseNotification);
      
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === notification.id 
            ? { ...req, status: 'rejected', respondedAt: new Date() } 
            : req
        )
      );
      
      setSuccess('Transfer request rejected.');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request. Please try again.');
      
      // Hide error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingRequest(null);
    }
  };
  
  // Handle blocking a user
  const handleBlock = async (notification) => {
    setProcessingRequest(notification.id);
    
    try {
      if (!currentUser) {
        setError('You must be logged in to block users');
        return;
      }
      
      // Add user to blocked list
      await addDoc(collection(db, 'blockedUsers'), {
        blockerId: currentUser.uid,
        blockedId: notification.fromUserId,
        createdAt: Timestamp.now(),
      });
      
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === notification.id 
            ? { ...req, status: 'blocked', respondedAt: new Date() } 
            : req
        )
      );
      
      setSuccess('User blocked successfully.');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error blocking user:', err);
      setError('Failed to block user. Please try again.');
      
      // Hide error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setProcessingRequest(null);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (notification) => {
    if (notification.isRead) return;
    
    try {
      await updateDoc(doc(db, 'notifications', notification.id), {
        isRead: true
      });
      
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === notification.id 
            ? { ...req, isRead: true } 
            : req
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    // If it's today, show time
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If it's yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show full date
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Filter requests
  const pendingRequests = requests.filter(req => req.status === 'pending');
  const respondedRequests = requests.filter(req => req.status !== 'pending');
  
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <FaEnvelope size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            You must be logged in to view your incoming requests.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Incoming Requests</h2>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
              {success}
            </div>
          )}
          
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <FaEnvelope size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Incoming Requests</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                You haven't received any transfer requests yet. When someone sends you a request, it will appear here.
              </p>
            </div>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
                  <div className="space-y-4">
                    {pendingRequests.map(request => (
                      <div 
                        key={request.id} 
                        className={`border ${!request.isRead ? 'border-indigo-200 bg-indigo-50' : 'border-gray-200 bg-white'} rounded-lg overflow-hidden shadow-sm`}
                        onClick={() => {
                          setShowRequestDetails(request.id);
                          markAsRead(request);
                        }}
                      >
                        <div className="p-4 cursor-pointer hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <div className={`mt-1 ${!request.isRead ? 'text-indigo-500' : 'text-gray-400'}`}>
                                {!request.isRead ? <FaEnvelope size={16} /> : <FaEnvelopeOpen size={16} />}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-800">
                                  {request.fromUserName || 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {request.message || (request.type === 'chain_request' 
                                    ? 'Sent you a chain transfer request' 
                                    : 'Sent you a transfer request')}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(request.timestamp)}
                                </p>
                                {request.type === 'chain_request' && (
                                  <div className="mt-2">
                                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                      Chain Request
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAccept(request);
                                }}
                                disabled={processingRequest === request.id}
                                className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 flex items-center"
                                title="Accept"
                              >
                                {processingRequest === request.id ? (
                                  <FaSpinner className="animate-spin mr-1" />
                                ) : (
                                  <FaCheck size={14} className="mr-1" />
                                )}
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(request);
                                }}
                                disabled={processingRequest === request.id}
                                className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 flex items-center"
                                title="Reject"
                              >
                                {processingRequest === request.id ? (
                                  <FaSpinner className="animate-spin mr-1" />
                                ) : (
                                  <FaTimes size={14} className="mr-1" />
                                )}
                                Reject
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBlock(request);
                                }}
                                disabled={processingRequest === request.id}
                                className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center"
                                title="Block"
                              >
                                {processingRequest === request.id ? (
                                  <FaSpinner className="animate-spin mr-1" />
                                ) : (
                                  <FaBan size={14} className="mr-1" />
                                )}
                                Block
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {showRequestDetails === request.id && request.senderRequest && (
                          <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <h4 className="font-medium text-gray-700 mb-2">Transfer Request Details:</h4>
                            <div className="text-sm">
                              <p className="mb-1">
                                <span className="font-medium">From:</span> {request.senderRequest.currentZone} ({request.senderRequest.currentDivision})
                              </p>
                              <p className="mb-1">
                                <span className="font-medium">To:</span> {request.senderRequest.preferredZone} ({request.senderRequest.preferredDivision})
                              </p>
                              <p className="mb-1">
                                <span className="font-medium">Department:</span> {request.senderRequest.department || 'Not specified'}
                              </p>
                              <p className="mb-1">
                                <span className="font-medium">Designation:</span> {request.senderRequest.designation || 'Not specified'}
                              </p>
                              {request.senderRequest.remarks && (
                                <p className="mb-1">
                                  <span className="font-medium">Remarks:</span> {request.senderRequest.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {respondedRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Past Requests</h3>
                  <div className="space-y-4">
                    {respondedRequests.map(request => (
                      <div 
                        key={request.id} 
                        className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                        onClick={() => setShowRequestDetails(request.id === showRequestDetails ? null : request.id)}
                      >
                        <div className="p-4 cursor-pointer hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <div className="text-gray-400">
                                <FaEnvelopeOpen size={16} />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-800">
                                  {request.fromUserName || 'Unknown User'}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {request.message || (request.type === 'chain_request' 
                                    ? 'Sent you a chain transfer request' 
                                    : 'Sent you a transfer request')}
                                </p>
                                <div className="flex items-center mt-1">
                                  <p className="text-xs text-gray-500">
                                    {formatDate(request.timestamp)}
                                  </p>
                                  <span className="mx-2 text-gray-300">•</span>
                                  <span className={`text-xs ${request.status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
                                    {request.status === 'accepted' ? 'Accepted' : 'Rejected'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {showRequestDetails === request.id && request.senderRequest && (
                          <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <h4 className="font-medium text-gray-700 mb-2">Transfer Request Details:</h4>
                            <div className="text-sm">
                              <p className="mb-1">
                                <span className="font-medium">From:</span> {request.senderRequest.currentZone} ({request.senderRequest.currentDivision})
                              </p>
                              <p className="mb-1">
                                <span className="font-medium">To:</span> {request.senderRequest.preferredZone} ({request.senderRequest.preferredDivision})
                              </p>
                              <p className="mb-1">
                                <span className="font-medium">Department:</span> {request.senderRequest.department || 'Not specified'}
                              </p>
                              <p className="mb-1">
                                <span className="font-medium">Designation:</span> {request.senderRequest.designation || 'Not specified'}
                              </p>
                              {request.senderRequest.remarks && (
                                <p className="mb-1">
                                  <span className="font-medium">Remarks:</span> {request.senderRequest.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomingRequests; 