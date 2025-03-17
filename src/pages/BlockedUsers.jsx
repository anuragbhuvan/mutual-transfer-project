import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { FaBan, FaUnlock, FaInfoCircle, FaUser, FaSpinner, FaUserSlash, FaUndo } from 'react-icons/fa';
import { useAuth } from '../firebase/AuthProvider';

const BlockedUsers = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingUser, setUnblockingUser] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser, isAuthenticated } = useAuth();
  
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!currentUser) return;
      
      setLoading(true);
      setError("");
      
      try {
        // Query the blockedUsers collection
        const q = query(
          collection(db, "blockedUsers"),
          where("blockerId", "==", currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const usersData = [];
        
        for (const blockDoc of querySnapshot.docs) {
          const blockData = blockDoc.data();
          
          // Get blocked user details
          let userData = { displayName: "Unknown User" };
          const userDocs = await getDocs(
            query(collection(db, "employees"), where("userId", "==", blockData.blockedId))
          );
          
          if (!userDocs.empty) {
            userData = userDocs.docs[0].data();
          }
          
          usersData.push({
            id: blockDoc.id,
            blockedId: blockData.blockedId,
            ...userData,
            blockedAt: blockData.createdAt ? blockData.createdAt.toDate() : new Date(),
          });
        }
        
        // Sort by most recently blocked first
        usersData.sort((a, b) => b.blockedAt - a.blockedAt);
        
        setBlockedUsers(usersData);
      } catch (err) {
        console.error("Error fetching blocked users:", err);
        setError("Problem loading blocked users: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlockedUsers();
  }, [currentUser]);
  
  // Handle unblock user
  const handleUnblock = async (blockId, blockedId) => {
    setUnblockingUser(blockId);
    setError("");
    setSuccess("");
    
    try {
      // Delete from blockedUsers collection
      await deleteDoc(doc(db, "blockedUsers", blockId));
      
      // Update local state
      setBlockedUsers(blockedUsers.filter(user => user.id !== blockId));
      
      setSuccess("User has been unblocked");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error unblocking user:", err);
      setError("Problem unblocking user: " + err.message);
    } finally {
      setUnblockingUser(null);
    }
  };
  
  // Handle undoing block and moving back to incoming requests
  const handleUndo = async (user) => {
    setProcessingRequest(user.id);
    setError("");
    setSuccess("");
    
    try {
      // 1. Find any rejected notifications from this user
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("fromUserId", "==", user.blockedId),
        where("toUserId", "==", currentUser.uid),
        where("status", "==", "blocked")
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      // 2. Update these notifications back to pending
      const updatePromises = notificationsSnapshot.docs.map(doc => 
        updateDoc(doc.ref, {
          status: 'pending',
          respondedAt: null
        })
      );
      
      await Promise.all(updatePromises);
      
      // 3. Delete from blockedUsers collection
      await deleteDoc(doc(db, "blockedUsers", user.id));
      
      // 4. Notify the user
      await addDoc(collection(db, 'notifications'), {
        toUserId: user.blockedId,
        fromUserId: currentUser.uid,
        message: 'You are now unblocked and can send transfer requests',
        status: 'info',
        timestamp: serverTimestamp(),
        isRead: false
      });
      
      // 5. Update local state
      setBlockedUsers(blockedUsers.filter(u => u.id !== user.id));
      
      setSuccess("User has been unblocked and requests moved to incoming");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error undoing block:", err);
      setError("Problem undoing block: " + err.message);
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
          <FaBan size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            You must be logged in to view your blocked users.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Blocked Users</h1>
      
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
      ) : blockedUsers.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4 text-center">
          <p className="text-yellow-700">You haven't blocked any users yet</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {blockedUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <FaBan className="text-red-500" />
                  <h3 className="text-lg font-semibold ml-2">
                    {user.displayName || "Unknown User"}
                  </h3>
                </div>
                <span className="text-sm text-gray-500">
                  Blocked on {formatDate(user.blockedAt)}
                </span>
              </div>
              
              <div className="mt-3 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Current Location:</p>
                    <p className="font-medium">{user.currentLocation || "Not Available"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Designation:</p>
                    <p className="font-medium">{user.designation || "Not Available"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Department:</p>
                    <p className="font-medium">{user.department || "Not Available"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Grade Level:</p>
                    <p className="font-medium">{user.gradeLevel || "Not Available"}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 flex items-center">
                  <FaUserSlash className="mr-1" />
                  <span>You won't receive any transfer requests from this user</span>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUndo(user)}
                    disabled={processingRequest === user.id}
                    className="flex items-center px-3 py-1.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors disabled:opacity-50"
                  >
                    {processingRequest === user.id ? (
                      <FaSpinner className="animate-spin mr-1" />
                    ) : (
                      <FaUndo className="mr-1" />
                    )}
                    Undo
                  </button>
                
                  <button
                    onClick={() => handleUnblock(user.id, user.blockedId)}
                    disabled={unblockingUser === user.id}
                    className="flex items-center px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {unblockingUser === user.id ? (
                      <FaSpinner className="animate-spin mr-1" />
                    ) : (
                      <FaUnlock className="mr-1" />
                    )}
                    Unblock
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedUsers; 