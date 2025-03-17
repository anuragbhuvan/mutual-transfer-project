import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { FaCheck, FaEnvelope, FaSpinner, FaExchangeAlt, FaUserFriends, FaUndo } from 'react-icons/fa';
import { useAuth } from '../firebase/AuthProvider';

const MyAcceptedRequests = () => {
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);

  // Fetch accepted requests
  useEffect(() => {
    const fetchAcceptedRequests = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError('');
      
      try {
        console.log("Fetching accepted requests for user:", currentUser.uid);
        
        // Query the acceptedRequests collection
        const q = query(
          collection(db, 'acceptedRequests'),
          where('receiverId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        console.log("Found accepted requests:", querySnapshot.size);
        
        const requestsData = [];
        
        for (const reqDoc of querySnapshot.docs) {
          const requestData = reqDoc.data();
          
          // Get original request details if available
          let originalRequest = null;
          if (requestData.requestId) {
            const requestRef = doc(db, 'transferRequests', requestData.requestId);
            const requestSnap = await getDoc(requestRef);
            if (requestSnap.exists()) {
              originalRequest = requestSnap.data();
            }
          }
          
          // Get sender details
          let senderData = { displayName: 'Unknown User' };
          const senderDocs = await getDocs(
            query(collection(db, 'employees'), where('userId', '==', requestData.senderId))
          );
          
          if (!senderDocs.empty) {
            senderData = senderDocs.docs[0].data();
          }
          
          requestsData.push({
            id: reqDoc.id,
            ...requestData,
            sender: senderData,
            originalRequest,
            timestamp: requestData.createdAt ? requestData.createdAt.toDate() : new Date(),
          });
        }
        
        // Sort by newest first
        requestsData.sort((a, b) => b.timestamp - a.timestamp);
        
        setAcceptedRequests(requestsData);
      } catch (err) {
        console.error('Error fetching accepted requests:', err);
        setError('Problem loading accepted requests: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAcceptedRequests();
  }, [currentUser]);
  
  // Handle undoing an accepted request
  const handleUndo = async (request) => {
    if (!currentUser) return;
    
    setProcessingRequest(request.id);
    setError('');
    setSuccess('');
    
    try {
      // 1. Update the original notification back to pending
      if (request.notificationId) {
        await updateDoc(doc(db, 'notifications', request.notificationId), {
          status: 'pending',
          respondedAt: null
        });
      }
      
      // 2. Delete from acceptedRequests collection
      await deleteDoc(doc(db, 'acceptedRequests', request.id));
      
      // 3. Create a notification for the sender
      await addDoc(collection(db, 'notifications'), {
        toUserId: request.senderId,
        fromUserId: currentUser.uid,
        message: 'Your request has been returned to pending status',
        status: 'info',
        timestamp: serverTimestamp(),
        isRead: false
      });
      
      // 4. Update local state
      setAcceptedRequests(acceptedRequests.filter(req => req.id !== request.id));
      
      setSuccess('Request has been returned to pending status');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error undoing request:', err);
      setError('Failed to undo this request: ' + err.message);
    } finally {
      setProcessingRequest(null);
    }
  };
  
  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Request type icon
  const getRequestTypeIcon = (type) => {
    if (type === 'chain') {
      return <FaUserFriends className="text-purple-500" title="Chain Transfer" />;
    }
    return <FaExchangeAlt className="text-blue-500" title="One-to-One Transfer" />;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Accepted Requests</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <FaSpinner className="animate-spin text-indigo-600 mr-2" />
          <span>Loading...</span>
        </div>
      ) : acceptedRequests.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 text-center">
          <p className="text-yellow-700">You haven't accepted any requests yet</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {acceptedRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center">
                  {getRequestTypeIcon(request.requestType)}
                  <h3 className="text-lg font-semibold ml-2">
                    {request.sender.displayName || 'Unknown User'}
                  </h3>
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <FaCheck className="mr-1" />
                    Accepted
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(request.timestamp)}
                </span>
              </div>
              
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Current Location:</p>
                    <p className="font-medium">{request.sender.currentLocation || 'Not Available'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Designation:</p>
                    <p className="font-medium">{request.sender.designation || 'Not Available'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Department:</p>
                    <p className="font-medium">{request.sender.department || 'Not Available'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Grade Level:</p>
                    <p className="font-medium">{request.sender.gradeLevel || 'Not Available'}</p>
                  </div>
                </div>
                
                {request.originalRequest?.message && (
                  <div className="mt-3 bg-gray-50 p-3 rounded">
                    <p className="text-gray-600 text-sm font-medium">Message:</p>
                    <p className="italic">{request.originalRequest.message}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleUndo(request)}
                  disabled={processingRequest === request.id}
                  className="flex items-center py-1.5 px-3 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                >
                  {processingRequest === request.id ? (
                    <FaSpinner className="animate-spin mr-1" />
                  ) : (
                    <FaUndo className="mr-1" />
                  )}
                  Undo
                </button>
                
                <button 
                  onClick={() => setSelectedRequest(selectedRequest === request.id ? null : request.id)}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm ml-auto"
                >
                  <FaEnvelope className="mr-1" />
                  {selectedRequest === request.id ? 'Show Less Details' : 'View More Details'}
                </button>
              </div>
              
              {selectedRequest === request.id && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-md">
                  <h4 className="font-medium text-indigo-800 mb-2">Contact Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Email:</p>
                      <p className="font-medium">{request.sender.email || 'Not Available'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone Number:</p>
                      <p className="font-medium">{request.sender.phoneNumber || 'Not Available'}</p>
                    </div>
                  </div>
                  
                  <p className="mt-3 text-xs text-gray-500">
                    * You can now contact this user directly and discuss further steps.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAcceptedRequests; 