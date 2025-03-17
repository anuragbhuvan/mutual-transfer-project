import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { collection, query, getDocs, where, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processingId, setProcessingId] = useState(null);

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

  // Fetch notifications for the current user
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('You must be logged in to view notifications');
        setLoading(false);
        return;
      }

      // Get notifications where user is the recipient
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('toUserId', '==', currentUser.uid)
      );
      
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      if (notificationsSnapshot.empty) {
        setNotifications([]);
      } else {
        const notificationsData = notificationsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        // Sort by date (newest first)
        notificationsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        
        setNotifications(notificationsData);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle accepting a transfer request
  const handleAccept = async (notification) => {
    try {
      setProcessingId(notification.id);
      
      // Update notification status
      await updateDoc(doc(db, 'notifications', notification.id), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      // In a real application, you would also:
      // 1. Create a match record in the database
      // 2. Send notifications to all parties involved
      // 3. Update the transfer requests as "matched"
      
      setSuccess(`You've accepted the transfer request from ${notification.fromUserName}`);
      
      // Refresh notifications
      await fetchNotifications();
    } catch (err) {
      console.error('Error accepting request:', err);
      setError('Failed to accept transfer request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle rejecting a transfer request
  const handleReject = async (notification) => {
    try {
      setProcessingId(notification.id);
      
      // Update notification status
      await updateDoc(doc(db, 'notifications', notification.id), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      
      setSuccess(`You've rejected the transfer request from ${notification.fromUserName}`);
      
      // Refresh notifications
      await fetchNotifications();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject transfer request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Initialize data fetch
  useEffect(() => {
    if (auth.currentUser) {
      fetchNotifications();
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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Transfer Request Notifications</h1>
      
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
          
          {/* Notifications Section */}
          <section className="mb-10">
            {notifications.length > 0 ? (
              <div className="grid gap-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
                      notification.status === 'pending' ? 'border-blue-500' : 
                      notification.status === 'accepted' ? 'border-green-500' : 
                      notification.status === 'rejected' ? 'border-red-500' : 'border-gray-500'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="flex-grow">
                        <h3 className="text-lg font-medium text-gray-800">
                          {notification.type === 'transfer_request' ? 'Transfer Request' : 'Notification'}
                        </h3>
                        
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.message || 'You have received a transfer request'}
                        </p>
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {notification.type === 'transfer_request' && (
                            <>
                              <div>
                                <p className="text-gray-600">
                                  <strong>From:</strong> {notification.fromUserName}
                                </p>
                                <p className="text-gray-600">
                                  <strong>Current Location:</strong> {notification.fromCurrentLocation}
                                </p>
                                <p className="text-gray-600">
                                  <strong>Wanted Location:</strong> {notification.fromWantedLocation}
                                </p>
                              </div>
                              <div>
                                {notification.fromDepartment && (
                                  <p className="text-gray-600">
                                    <strong>Department:</strong> {notification.fromDepartment}
                                  </p>
                                )}
                                {notification.fromSubDepartment && (
                                  <p className="text-gray-600">
                                    <strong>Sub Dept:</strong> {notification.fromSubDepartment}
                                  </p>
                                )}
                                {notification.fromPost && (
                                  <p className="text-gray-600">
                                    <strong>Post:</strong> {notification.fromPost}
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        
                        <p className="mt-2 text-xs text-gray-500">
                          Received: {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      
                      <div className="mt-4 md:mt-0 md:ml-4 flex flex-col space-y-2">
                        {notification.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleAccept(notification)}
                              disabled={processingId === notification.id}
                              className={`bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 ${
                                processingId === notification.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(notification)}
                              disabled={processingId === notification.id}
                              className={`bg-red-600 text-white px-4 py-1 rounded text-sm hover:bg-red-700 ${
                                processingId === notification.id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            notification.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                            notification.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.status === 'accepted' ? 'Accepted' : 
                             notification.status === 'rejected' ? 'Rejected' : 
                             notification.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">
                <p>You have no notifications at this time.</p>
              </div>
            )}
          </section>
        </>
      )}
    </motion.div>
  );
};

export default Notifications; 