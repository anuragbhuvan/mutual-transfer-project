import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';

const CyclicMatches = () => {
  const [loading, setLoading] = useState(true);
  const [userRequest, setUserRequest] = useState(null);
  const [cyclicMatches, setCyclicMatches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user's transfer request
  const fetchRequest = async () => {
    try {
      setLoading(true);
      setError('');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in to view cyclic matches');
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
        
        // Fetch cyclic matches
        await fetchCyclicMatches(userRequestData);
      } else {
        // User has no transfer request
        setUserRequest(null);
        setCyclicMatches([]);
        setError('You need to create a transfer request first to see cyclic matches');
      }
    } catch (err) {
      console.error('Error fetching request:', err);
      setError('Failed to load transfer request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Find cyclic matches (A wants B's location, B wants C's location, C wants A's location)
  const fetchCyclicMatches = async (userRequest) => {
    try {
      // This is a simplified placeholder for the cyclic match algorithm
      // In a real app, you would need a more complex algorithm to find these patterns
      
      // Get all transfer requests
      const requestsQuery = query(collection(db, 'transferRequests'));
      const requestsSnapshot = await getDocs(requestsQuery);
      
      if (requestsSnapshot.empty) {
        setCyclicMatches([]);
        return;
      }
      
      // Convert to array of request objects
      const requests = requestsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      
      // Filter out current user's request
      const otherRequests = requests.filter(req => req.userId !== auth.currentUser.uid);
      
      // For this example, we'll just set an empty array
      // A real implementation would have complex logic to find 3+ person cycles
      setCyclicMatches([]);
      
      // Note: A real implementation would look something like:
      // 1. Build a graph where nodes are employees and edges represent matching location preferences
      // 2. Use an algorithm to find cycles in this graph (DFS or similar)
      // 3. Filter cycles to ensure they meet all matching criteria (department, post, etc.)
      
    } catch (err) {
      console.error('Error finding cyclic matches:', err);
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Cyclic Transfer Matches</h1>
      
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
          
          {/* Cyclic Matches Section */}
          {userRequest && (
            <section className="mb-10">
              <p className="text-gray-600 mb-4">
                Cyclic matches are chains of 3 or more employees where each person wants the next person's location, 
                and the last person wants the first person's location, creating a cycle.
              </p>
              
              {cyclicMatches.length > 0 ? (
                <div className="grid gap-4">
                  {cyclicMatches.map((cycle, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md p-4">
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        Cyclic Match #{index + 1}
                      </h3>
                      <div className="flex flex-col space-y-4">
                        {/* Cycle visualization would go here */}
                        <p className="text-gray-600">Cyclic match details would be displayed here.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">
                  <p>No cyclic matches found based on your transfer request details.</p>
                  <p className="mt-2 text-sm">Cyclic matches are rare but can enable transfers when direct matches aren't available.</p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </motion.div>
  );
};

export default CyclicMatches; 