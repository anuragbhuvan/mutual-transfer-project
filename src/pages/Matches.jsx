import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, getDocs, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

const Matches = () => {
  const [loading, setLoading] = useState(true);
  const [userRequest, setUserRequest] = useState(null);
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingRequest, setSendingRequest] = useState(null);

  // Format date helper function
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Check if timestamp is a Firebase Timestamp
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    
    // If it's a regular Date object
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }
    
    // If it's already a string
    return timestamp;
  };

  // Fetch user's transfer request
  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError('');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in to view your matches');
        setLoading(false);
        return;
      }

      // Get user's transfer request
      const userRequestQuery = query(
        collection(db, 'transferRequests'),
        where('userId', '==', currentUser.uid)
      );
      
      const userRequestSnapshot = await getDocs(userRequestQuery);
      
      if (!userRequestSnapshot.empty) {
        // User has an existing transfer request
        const userRequestData = {
          ...userRequestSnapshot.docs[0].data(),
          id: userRequestSnapshot.docs[0].id
        };
        setUserRequest(userRequestData);
        
        // Fetch potential matches based on user's request criteria
        await fetchMatches(userRequestData);
      } else {
        // User has no transfer request
        setUserRequest(null);
        setMatchedRequests([]);
        setError('You need to create a transfer request first to see potential matches');
      }
    } catch (err) {
      console.error('Error fetching request:', err);
      setError('Failed to load transfer request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch potential matches based on user's request
  const fetchMatches = async (userRequest) => {
    try {
      // Get all transfer requests
      const requestsQuery = query(
        collection(db, 'transferRequests')
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      
      if (requestsSnapshot.empty) {
        setMatchedRequests([]);
        return;
      }
      
      // Filter out the current user's request
      const otherRequests = requestsSnapshot.docs
        .filter(doc => doc.data().userId !== auth.currentUser.uid)
        .map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
      
      // Find matches based on location, department and post
      const matches = otherRequests.filter(request => {
        // Check if department, subDepartment and post match
        const departmentMatch = 
          (!userRequest.department || !request.department || userRequest.department === request.department) &&
          (!userRequest.subDepartment || !request.subDepartment || userRequest.subDepartment === request.subDepartment) &&
          (!userRequest.post || !request.post || userRequest.post === request.post);
        
        // Check if locations match (user wants their location and they want user's location)
        const locationMatch = (
          // User's current location matches other's wanted location
          (userRequest.currentZone === request.wantedZone1 && userRequest.currentDivision === request.wantedDivision1) ||
          (userRequest.currentZone === request.wantedZone2 && userRequest.currentDivision === request.wantedDivision2) ||
          (userRequest.currentZone === request.wantedZone3 && userRequest.currentDivision === request.wantedDivision3)
        ) && (
          // User's wanted location matches other's current location
          (userRequest.wantedZone1 === request.currentZone && userRequest.wantedDivision1 === request.currentDivision) ||
          (userRequest.wantedZone2 === request.currentZone && userRequest.wantedDivision2 === request.currentDivision) ||
          (userRequest.wantedZone3 === request.currentZone && userRequest.wantedDivision3 === request.currentDivision)
        );
        
        return departmentMatch && locationMatch;
      });
      
      setMatchedRequests(matches);
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  // Handle send transfer request to another user
  const handleSendRequest = async (match) => {
    try {
      setSendingRequest(match.id);
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in to send a request');
        return;
      }
      
      // Check if user has a transfer request
      if (!userRequest) {
        setError('You must create a transfer request before sending requests to others');
        return;
      }
      
      // Check if a request already exists from this user to the same recipient
      const existingRequestQuery = query(
        collection(db, 'notifications'),
        where('fromUserId', '==', currentUser.uid),
        where('toUserId', '==', match.userId),
        where('type', '==', 'transfer_request'),
        where('status', 'in', ['pending', 'accepted'])
      );
      
      const existingRequestSnapshot = await getDocs(existingRequestQuery);
      
      if (!existingRequestSnapshot.empty) {
        setError('You have already sent a request to this user. You can only send one request at a time to the same user.');
        setSendingRequest(null);
        return;
      }

      // Create notification for the recipient
      await addDoc(collection(db, 'notifications'), {
        fromUserId: currentUser.uid,
        fromUserName: userRequest.name,
        fromTransferRequestId: userRequest.id,
        fromDepartment: userRequest.department,
        fromSubDepartment: userRequest.subDepartment,
        fromPost: userRequest.post,
        fromCurrentLocation: `${userRequest.currentZone} (${userRequest.currentDivision})`,
        fromWantedLocation: `${userRequest.preferredZone} (${userRequest.preferredDivision})`,
        
        toUserId: match.userId,
        toUserName: match.name,
        toRequestId: match.id,
        
        type: 'transfer_request',
        status: 'pending',
        message: 'आपको एक ट्रांसफर रिक्वेस्ट मिली है',
        timestamp: serverTimestamp(),
        isRead: false
      });
      
      // Mark this request as sent in UI
      match.requestSent = true;
      setSuccess('ट्रांसफर रिक्वेस्ट सफलतापूर्वक भेजी गई!');
      
      // Refresh matches list
      await fetchMatches(userRequest);
    } catch (err) {
      console.error('Error sending request:', err);
      setError('Failed to send transfer request. Please try again.');
    } finally {
      setSendingRequest(null);
    }
  };

  // Initialize data fetch
  useEffect(() => {
    if (auth.currentUser) {
      fetchRequest();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-6 max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Transfer Matches</h1>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
              {success}
            </div>
          )}
          
          {/* Transfer Request Matches Section */}
          {userRequest && (
            <section className="mb-10">
              <p className="text-gray-600 mb-4">
                Based on your transfer request from <strong>{userRequest.currentZone} ({userRequest.currentDivision})</strong> to 
                <strong> {userRequest.wantedZone1} ({userRequest.wantedDivision1})</strong>, here are your potential matches:
              </p>
              
              {matchedRequests.length > 0 ? (
                <div className="grid gap-4">
                  {matchedRequests.map((match) => (
                    <div key={match.id} className="bg-white rounded-lg shadow-md p-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div>
                          <h3 className="text-lg font-medium text-gray-800">
                            {match.name}
                          </h3>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                            <div>
                              <p className="text-sm text-gray-600"><strong>Current Location:</strong> {`${match.currentZone} (${match.currentDivision})`}</p>
                              <p className="text-sm text-gray-600"><strong>Requested Location:</strong> {`${match.wantedZone1} (${match.wantedDivision1})`}</p>
                            </div>
                            
                            {(match.department || match.subDepartment || match.post) && (
                              <div>
                                {match.department && (
                                  <p className="text-sm text-gray-600"><strong>Department:</strong> {match.department}</p>
                                )}
                                {match.subDepartment && (
                                  <p className="text-sm text-gray-600"><strong>Sub Dept:</strong> {match.subDepartment}</p>
                                )}
                                {match.post && (
                                  <p className="text-sm text-gray-600"><strong>Post:</strong> {match.post}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex mt-4 md:mt-0">
                          {!match.requestSent ? (
                            <button
                              onClick={() => handleSendRequest(match)}
                              disabled={sendingRequest === match.id}
                              className={`ml-auto bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 ${
                                sendingRequest === match.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {sendingRequest === match.id ? 'Sending...' : 'Send Request'}
                            </button>
                          ) : (
                            <span className="ml-auto px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              Request Sent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">
                  <p>No matches found based on your transfer request details.</p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Matches; 