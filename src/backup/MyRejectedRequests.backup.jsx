import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { FaTimes, FaSpinner, FaExchangeAlt, FaUserFriends } from 'react-icons/fa';
import { useAuth } from '../firebase/AuthProvider';

const MyRejectedRequests = () => {
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  
  // Fetch rejected requests
  useEffect(() => {
    const fetchRejectedRequests = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError('');
      
      try {
        // Query the rejectedRequests collection
        const q = query(
          collection(db, 'rejectedRequests'),
          where('receiverId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
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
        
        setRejectedRequests(requestsData);
      } catch (err) {
        console.error('Error fetching rejected requests:', err);
        setError('Problem loading rejected requests: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRejectedRequests();
  }, [currentUser]);
  
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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Rejected Requests</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <FaSpinner className="animate-spin text-indigo-600 mr-2" />
          <span>Loading...</span>
        </div>
      ) : rejectedRequests.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 text-center">
          <p className="text-yellow-700">You haven't rejected any requests yet</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {rejectedRequests.map((request) => (
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
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <FaTimes className="mr-1" />
                    Rejected
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
              
              <div className="mt-3 px-3 py-2 bg-gray-50 rounded text-sm text-gray-600">
                <p>You have rejected this transfer request. The user may send it again or contact someone else.</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRejectedRequests; 