import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { FaSync, FaLongArrowAltRight, FaInfo } from 'react-icons/fa';

const ChainTransferMatches = () => {
  const [userRequest, setUserRequest] = useState(null);
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  useEffect(() => {
    const fetchUserRequestAndChains = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          setError('You must be logged in to view chain transfer matches');
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
          
          // Find chain matches based on user request
          await findChainMatches(requestWithId);
        } else {
          // User has no transfer request
          setUserRequest(null);
          setChains([]);
          setError('You need to create a transfer request first to see cyclic matches');
        }
      } catch (err) {
        console.error('Error loading chain matches:', err);
        setError('Failed to load transfer request. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRequestAndChains();
  }, []);
  
  const findChainMatches = async (userRequest) => {
    try {
      // Get all transfer requests
      const requestsQuery = query(collection(db, 'transferRequests'));
      const requestsSnapshot = await getDocs(requestsQuery);
      
      if (requestsSnapshot.empty) {
        setChains([]);
        return;
      }
      
      // Build a graph of transfer requests
      const graph = {};
      const requestsMap = {};
      
      requestsSnapshot.forEach(doc => {
        const request = { id: doc.id, ...doc.data() };
        const key = `${request.currentZone}-${request.currentDivision}`;
        const targetKey = `${request.preferredZone}-${request.preferredDivision}`;
        
        if (!graph[key]) {
          graph[key] = [];
        }
        
        graph[key].push(targetKey);
        requestsMap[key] = request;
      });
      
      // Find cycles that include the user's request
      const userKey = `${userRequest.currentZone}-${userRequest.currentDivision}`;
      const targetKey = `${userRequest.preferredZone}-${userRequest.preferredDivision}`;
      
      const foundChains = [];
      const visited = new Set();
      
      // Helper function to find all cycles
      function findCycles(currentKey, path, cycle = []) {
        if (visited.has(currentKey)) return;
        
        // Add current node to path
        path.push(currentKey);
        visited.add(currentKey);
        
        // If we've found a cycle back to our target
        if (graph[currentKey] && graph[currentKey].includes(userKey) && path.length > 1) {
          // Create a full cycle including the user as the last node
          const fullCycle = [...path, userKey];
          
          // Convert locations back to request objects
          const chainRequests = fullCycle.map(key => requestsMap[key]);
          
          // Add to found chains if it's valid and not already included
          if (chainRequests.every(req => req)) {
            const chainId = fullCycle.join('-');
            if (!foundChains.some(chain => chain.id === chainId)) {
              foundChains.push({
                id: chainId,
                requests: chainRequests,
                locations: fullCycle
              });
            }
          }
        }
        
        // Continue DFS
        if (graph[currentKey]) {
          for (const neighbor of graph[currentKey]) {
            if (neighbor !== userKey && !path.includes(neighbor)) { // Avoid immediate cycles back to user
              findCycles(neighbor, [...path]);
            }
          }
        }
        
        // Remove from visited to allow this node in other paths
        visited.delete(currentKey);
      }
      
      // Start DFS from user's target location
      if (graph[targetKey]) {
        findCycles(targetKey, []);
      }
      
      // Sort chains by length (shorter chains first)
      foundChains.sort((a, b) => a.requests.length - b.requests.length);
      
      setChains(foundChains);
    } catch (err) {
      console.error('Error finding chain matches:', err);
      setError('Failed to find chain matches. Please try again later.');
    }
  };
  
  const refreshChains = () => {
    if (userRequest) {
      setLoading(true);
      findChainMatches(userRequest)
        .finally(() => setLoading(false));
    }
  };
  
  // Send chain request to all users in the chain
  const handleSendChainRequest = async (chain) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        setError('You must be logged in to send chain requests');
        return;
      }
      
      // Check if user has a transfer request
      if (!userRequest) {
        setError('You must create a transfer request before sending chain requests');
        return;
      }
      
      // Create a unique ID for this chain request
      const chainId = `chain-${Date.now()}`;
      
      // Send notification to each user in the chain
      for (const request of chain.requests) {
        // Skip self
        if (request.userId === user.uid) continue;
        
        const notification = {
          toUserId: request.userId,
          fromUserId: user.uid,
          fromUserName: userRequest.name,
          fromTransferRequestId: userRequest.id,
          type: 'chain_request',
          status: 'pending',
          chainId: chainId,
          message: `You've been included in a chain transfer request with ${chain.requests.length} participants`,
          chainDetails: JSON.stringify(chain.requests.map(req => ({
            name: req.name,
            currentZone: req.currentZone,
            currentDivision: req.currentDivision,
            preferredZone: req.preferredZone,
            preferredDivision: req.preferredDivision,
          }))),
          timestamp: serverTimestamp(),
          isRead: false
        };
        
        await addDoc(collection(db, 'notifications'), notification);
      }
      
      setSuccess('Chain transfer request sent successfully to all participants!');
      
      // Hide success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error sending chain request:', err);
      setError('Failed to send chain request. Please try again.');
      
      // Hide error message after 5 seconds
      setTimeout(() => setError(''), 5000);
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
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-gray-800">Chain Transfer Matches</h2>
            <button 
              onClick={() => setShowInfoModal(true)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              <FaInfo />
            </button>
          </div>
          <button 
            onClick={refreshChains}
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
              </div>
              
              {chains.length > 0 ? (
                <div className="space-y-6">
                  {chains.map((chain, chainIndex) => (
                    <div key={chain.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="font-medium">Chain Match #{chainIndex + 1} ({chain.requests.length} participants)</h3>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex flex-wrap items-center mb-4">
                          {chain.requests.map((request, index) => (
                            <React.Fragment key={request.id}>
                              <div className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                                <p className="font-medium">{request.name}</p>
                                <p className="text-sm text-gray-600">
                                  {request.currentZone} ({request.currentDivision})
                                </p>
                              </div>
                              
                              {index < chain.requests.length - 1 && (
                                <div className="mx-2">
                                  <FaLongArrowAltRight className="text-gray-400" />
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => handleSendChainRequest(chain)}
                          className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Send Chain Request
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 max-w-md mx-auto">No cyclic matches found based on your transfer request details.</p>
                  <p className="text-gray-600 max-w-md mx-auto mt-2">Chain transfers require multiple employees who can form a circle of transfers. Try again later as more employees join the platform.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">No Transfer Request Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                You need to create a transfer request to see chain transfer matches.
              </p>
              <button
                onClick={() => window.location.href = '/employee-form'}
                className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Create Transfer Request
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-4">About Chain Transfers</h3>
            <p className="text-gray-600 mb-4">
              Chain transfers involve multiple employees creating a chain of transfers where each person moves to the location where another person is currently posted.
            </p>
            <p className="text-gray-600 mb-4">
              For example: <br/>
              Employee A wants to go to B's location <br/>
              Employee B wants to go to C's location <br/>
              Employee C wants to go to A's location
            </p>
            <p className="text-gray-600 mb-4">
              This creates a "chain" where everyone gets their preferred posting through a coordinated multi-person transfer.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainTransferMatches; 