import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { FaSync, FaSearch } from 'react-icons/fa';

const OneToOneMatches = () => {
  const [userRequest, setUserRequest] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMatches, setFilteredMatches] = useState([]);
  
  useEffect(() => {
    const fetchUserRequestAndMatches = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          setError('You must be logged in to view matches');
          setLoading(false);
          return;
        }
        
        // Get user's transfer request
        const requestQuery = query(
          collection(db, 'transferRequests'),
          where('userId', '==', user.uid)
        );
        
        const requestSnapshot = await getDocs(requestQuery);
        
        if (!requestSnapshot.empty) {
          // User has an existing transfer request
          const requestData = requestSnapshot.docs[0].data();
          const requestWithId = {
            id: requestSnapshot.docs[0].id,
            ...requestData
          };
          setUserRequest(requestWithId);
          
          // Find matches based on user request
          await findMatches(requestWithId);
        } else {
          // User has no transfer request
          setUserRequest(null);
          setMatches([]);
          setError('You need to create a transfer request first to see potential matches');
        }
      } catch (err) {
        console.error('Error loading matches:', err);
        setError('Failed to load transfer request. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRequestAndMatches();
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMatches(matches);
    } else {
      const filtered = matches.filter(match => 
        match.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.currentZone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.currentDivision.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.designation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMatches(filtered);
    }
  }, [searchTerm, matches]);
  
  const findMatches = async (userRequest) => {
    try {
      // Get all transfer requests
      const transfersQuery = query(
        collection(db, 'transferRequests'),
        where('userId', '!=', auth.currentUser.uid) // Exclude current user
      );
      
      const transfersSnapshot = await getDocs(transfersQuery);
      
      if (transfersSnapshot.empty) {
        setMatches([]);
        return;
      }
      
      // Find one-to-one matches
      // A match means: User's preferred location matches other's current location AND
      // Other's preferred location matches user's current location
      const potentialMatches = [];
      
      transfersSnapshot.forEach(doc => {
        const otherRequest = { id: doc.id, ...doc.data() };
        
        // Check one-to-one match conditions
        const isZoneMatch = 
          userRequest.preferredZone === otherRequest.currentZone &&
          userRequest.currentZone === otherRequest.preferredZone;
          
        const isDivisionMatch = 
          userRequest.preferredDivision === otherRequest.currentDivision &&
          userRequest.currentDivision === otherRequest.preferredDivision;
        
        // Check department and designation match if user has preferences
        const isDepartmentMatch = 
          !userRequest.departmentPreference || 
          userRequest.department === otherRequest.department;
          
        const isDesignationMatch = 
          !userRequest.designationPreference || 
          userRequest.designation === otherRequest.designation;
          
        // If there's a match
        if (isZoneMatch && isDivisionMatch && isDepartmentMatch && isDesignationMatch) {
          potentialMatches.push(otherRequest);
        }
      });
      
      setMatches(potentialMatches);
      setFilteredMatches(potentialMatches);
    } catch (err) {
      console.error('Error finding matches:', err);
      setError('Failed to find matches. Please try again later.');
    }
  };
  
  // Handle send transfer request to another user
  const handleSendRequest = async (match) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        setError('You must be logged in to send requests');
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
        where('fromUserId', '==', user.uid),
        where('toUserId', '==', match.userId),
        where('type', '==', 'transfer_request'),
        where('status', 'in', ['pending', 'accepted'])
      );
      
      const existingRequestSnapshot = await getDocs(existingRequestQuery);
      
      if (!existingRequestSnapshot.empty) {
        setError('You have already sent a request to this user. You can only send one request at a time to the same user.');
        return;
      }
      
      // Create a notification for the recipient
      const notification = {
        toUserId: match.userId,
        fromUserId: user.uid,
        fromUserName: userRequest.name,
        fromTransferRequestId: userRequest.id,
        type: 'transfer_request',
        status: 'pending',
        message: 'आपको एक ट्रांसफर रिक्वेस्ट मिली है',
        timestamp: serverTimestamp(),
        isRead: false,
        currentZone: userRequest.currentZone,
        currentDivision: userRequest.currentDivision,
        preferredZone: userRequest.preferredZone,
        preferredDivision: userRequest.preferredDivision,
        department: userRequest.department,
        designation: userRequest.designation
      };
      
      await addDoc(collection(db, 'notifications'), notification);
      
      setSuccess('ट्रांसफर रिक्वेस्ट सफलतापूर्वक भेजी गई!');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error sending request:', err);
      setError('Failed to send transfer request. Please try again.');
      
      // Hide error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };
  
  const refreshMatches = () => {
    if (userRequest) {
      setLoading(true);
      findMatches(userRequest)
        .finally(() => setLoading(false));
    }
  };
  
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
  
  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">One-to-One Matches</h2>
          <button 
            onClick={refreshMatches}
            className="text-indigo-600 hover:text-indigo-800 flex items-center"
            disabled={!userRequest}
          >
            <FaSync className="mr-1" /> Refresh
          </button>
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
          
          {userRequest ? (
            <>
              <div className="mb-6 bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-800 mb-2">Based on your transfer request:</h3>
                <p className="text-gray-700">
                  From <strong>{userRequest.currentZone} ({userRequest.currentDivision})</strong> to <strong>{userRequest.preferredZone} ({userRequest.preferredDivision})</strong>
                </p>
                {(userRequest.departmentPreference || userRequest.designationPreference) && (
                  <p className="text-gray-700 mt-1">
                    {userRequest.departmentPreference && (
                      <span>Department: <strong>{userRequest.department}</strong></span>
                    )}
                    {userRequest.departmentPreference && userRequest.designationPreference && (
                      <span> • </span>
                    )}
                    {userRequest.designationPreference && (
                      <span>Designation: <strong>{userRequest.designation}</strong></span>
                    )}
                  </p>
                )}
              </div>
              
              {matches.length > 0 && (
                <div className="mb-4 relative">
                  <input
                    type="text"
                    placeholder="Search matches..."
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              )}
              
              {filteredMatches.length > 0 ? (
                <div className="space-y-4">
                  {filteredMatches.map(match => (
                    <div key={match.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-semibold">
                            {match.name}
                            {match.jobId && (
                              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                                Verified ✓
                              </span>
                            )}
                          </p>
                          <p className="text-gray-600">{match.department} • {match.designation}</p>
                          <p className="text-gray-600">
                            Current: {match.currentZone} ({match.currentDivision})
                          </p>
                          <p className="text-gray-600">
                            Wanted: {match.preferredZone} ({match.preferredDivision})
                          </p>
                        </div>
                        <div className="mt-2 flex space-x-3">
                          <button
                            onClick={() => handleSendRequest(match)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Send Request
                          </button>
                          <button
                            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 max-w-md mx-auto">No matches found based on your transfer request details.</p>
                  <p className="text-gray-600 max-w-md mx-auto mt-2">Try changing your preferences or check back later as new transfer requests are added.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No Transfer Request Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                You need to create a transfer request first to see potential matches.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OneToOneMatches; 