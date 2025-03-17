import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc, where, addDoc, serverTimestamp, limit, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { toast } from 'react-toastify';
import EditModal from './EditModal';

// Define animation variants
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const Dashboard = ({ activeSection }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [cyclicMatches, setCyclicMatches] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(null);
  const [sentRequests, setSentRequests] = useState({});
  const [transferHistory, setTransferHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(true);
  const [processingNotification, setProcessingNotification] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);
  const [confirmBlock, setConfirmBlock] = useState(null);
  const [blockedUsers, setBlockedUsers] = useState({});
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [isAcceptedByMeOpen, setIsAcceptedByMeOpen] = useState(true);
  const [isAcceptedByOthersOpen, setIsAcceptedByOthersOpen] = useState(true);
  const [confirmRejectAccepted, setConfirmRejectAccepted] = useState(null);
  
  // Add states for rejected and blocked requests
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [isRejectedOpen, setIsRejectedOpen] = useState(true);
  const [blockedRequests, setBlockedRequests] = useState([]);
  const [isBlockedOpen, setIsBlockedOpen] = useState(true);
  
  // Add pagination states
  const [rejectedPage, setRejectedPage] = useState(1);
  const [blockedPage, setBlockedPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [userRequest, setUserRequest] = useState(null);
  const itemsPerPage = 5; // Show 5 items per page
  
  // Section refs for scrolling
  const yourRequestSectionRef = useRef(null);
  const matchesSectionRef = useRef(null);
  const cyclicMatchesSectionRef = useRef(null);
  const notificationsSectionRef = useRef(null);
  const acceptedByMeRef = useRef(null);
  const acceptedByOthersRef = useRef(null);
  const rejectedRequestsRef = useRef(null);
  const blockedRequestsRef = useRef(null);
  
  // Remove specific Undo Accept functionality
  // const [activeUndo Accept, setActiveUndo Accept] = useState(null);
  
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

  // Function to find cyclic matches (3 or more users)
  const findCyclicMatches = (allRequests, currentUserRequest) => {
    console.log('Finding cyclic matches...');
    console.log('Current user request:', currentUserRequest);
    console.log('All potential matches:', allRequests);
    
    // Make sure current user is included in allRequests
    if (!allRequests.some(req => req.id === currentUserRequest.id)) {
      console.log('Adding current user to allRequests');
      allRequests = [...allRequests, currentUserRequest];
    }
    
    const matches = [];
    const visited = new Set();
    
    const findCycle = (start, current, path) => {
      // If we found a cycle of 3 or more users
      if (path.length >= 3 && isValidTransfer(current, start)) {
        console.log('Found potential cycle:', path.map(p => ({
          name: p.name,
          current: `${p.currentZone}/${p.currentDivision}`,
          wanted: [
            `${p.wantedZone1}/${p.wantedDivision1}`,
            `${p.wantedZone2}/${p.wantedDivision2}`,
            `${p.wantedZone3}/${p.wantedDivision3}`
          ]
        })));
        
        // Verify that each user in the cycle wants the next user's location
        let isValidCycle = true;
        for (let i = 0; i < path.length; i++) {
          const currentUser = path[i];
          const nextUser = path[(i + 1) % path.length];
          if (!isValidTransfer(currentUser, nextUser)) {
            isValidCycle = false;
            console.log(`Invalid transfer in cycle: ${currentUser.name} -> ${nextUser.name}`);
            break;
          }
        }
        
        if (isValidCycle) {
          console.log('Valid cycle found:', path.map(p => p.name).join(' -> '));
          matches.push([...path]);
        }
        return;
      }
      
      // Look for next possible user in the cycle
      allRequests.forEach(next => {
        if (!visited.has(next.id) && isValidTransfer(current, next)) {
          console.log(`Found potential next user: ${current.name} -> ${next.name}`);
          visited.add(next.id);
          path.push(next);
          findCycle(start, next, path);
          path.pop();
          visited.delete(next.id);
        }
      });
    };
    
    // Helper function to check if transfer is valid between two users
    const isValidTransfer = (user1, user2) => {
      if (!user1 || !user2 || user1.id === user2.id) {
        console.log('Invalid transfer - same user or missing data:', { 
          user1: user1?.name, 
          user2: user2?.name 
        });
        return false;
      }
      
      // Check if departments and posts match
      if (user1.department !== user2.department || 
          user1.subDepartment !== user2.subDepartment || 
          user1.post !== user2.post) {
        console.log('Invalid transfer - department/post mismatch:', {
          user1: `${user1.name} (${user1.department}/${user1.post})`,
          user2: `${user2.name} (${user2.department}/${user2.post})`
        });
        return false;
      }
      
      // Check if user1 wants user2's location (check all preferences)
      const user1WantsUser2Location = 
        (user1.wantedZone1 === user2.currentZone && user1.wantedDivision1 === user2.currentDivision) ||
        (user1.wantedZone2 === user2.currentZone && user1.wantedDivision2 === user2.currentDivision) ||
        (user1.wantedZone3 === user2.currentZone && user1.wantedDivision3 === user2.currentDivision);
      
      console.log(`Checking transfer validity: ${user1.name} -> ${user2.name}:`, {
        result: user1WantsUser2Location,
        user1Current: `${user1.currentZone}/${user1.currentDivision}`,
        user1Wanted: [
          `${user1.wantedZone1}/${user1.wantedDivision1}`,
          `${user1.wantedZone2}/${user1.wantedDivision2}`,
          `${user1.wantedZone3}/${user1.wantedDivision3}`
        ],
        user2Location: `${user2.currentZone}/${user2.currentDivision}`
      });
      
      return user1WantsUser2Location;
    };
    
    // Try finding cycles starting from each user
    allRequests.forEach(startUser => {
      if (!visited.has(startUser.id)) {
        console.log(`Starting new cycle search from: ${startUser.name}`);
        visited.add(startUser.id);
        findCycle(startUser, startUser, [startUser]);
        visited.delete(startUser.id);
      }
    });
    
    // Remove duplicate cycles and ensure current user is included
    const uniqueCycles = matches.filter(cycle => 
      cycle.some(user => user.id === currentUserRequest.id)
    );
    
    console.log('Found unique cycles:', uniqueCycles.length);
    console.log('Cycles:', uniqueCycles.map(cycle => cycle.map(user => user.name)));
    return uniqueCycles;
  };

  // Add function to handle send request - only allow one request per recipient
  const handleSendRequest = async (requestOrCycle) => {
    try {
      // Check if it's a cycle or a single request
      const isMultiUserCycle = Array.isArray(requestOrCycle);
      
      // Set loading state for the button
      if (!isMultiUserCycle) {
        setSendingRequest(requestOrCycle.id);
      }
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      // Get the current user's request
      const userRequestsQuery = query(
        collection(db, 'transferRequests'),
        where('userId', '==', currentUser.uid)
      );
      
      const userRequestsSnapshot = await getDocs(userRequestsQuery);
      if (userRequestsSnapshot.empty) {
        toast.error('You need to have an active transfer request to send a request');
        return;
      }
      
      const userRequest = {
        ...userRequestsSnapshot.docs[0].data(),
        id: userRequestsSnapshot.docs[0].id
      };
      
      if (isMultiUserCycle) {
        // Handle cyclic transfer logic
        // This would require implementation of the cycle request logic
        toast.info('Cyclic transfer requests are not yet implemented');
        return;
      } else {
        // Handle direct transfer request
        const toUser = requestOrCycle;
        
        // First check if a request has already been sent to this user
        const existingRequestQuery = query(
          collection(db, 'notifications'),
          where('fromUserId', '==', currentUser.uid),
          where('toUserId', '==', toUser.userId),
          where('status', 'in', ['pending', 'accepted', 'rejected'])
        );
        
        const existingRequestSnapshot = await getDocs(existingRequestQuery);
        
        if (!existingRequestSnapshot.empty) {
          toast.info('You have already sent a request to this user');
          return;
        }
        
        // Create notification for the recipient
        const notificationData = {
          fromUserId: currentUser.uid,
          fromUserName: userRequest.name,
          fromRequestId: userRequest.id,
          fromDepartment: userRequest.department,
          fromSubDepartment: userRequest.subDepartment,
          fromPost: userRequest.post,
          fromCurrentLocation: `${userRequest.currentZone} (${userRequest.currentDivision})`,
          fromWantedLocation: `${userRequest.wantedZone1} (${userRequest.wantedDivision1})`,
          
          toUserId: toUser.userId,
          toUserName: toUser.name,
          toRequestId: toUser.id,
          
          type: 'transfer_request',
          status: 'pending',
          message: 'You have received a transfer request',
          createdAt: serverTimestamp()
        };
        
        // Add to notifications collection
        const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
        
        // Update local state
        setSentRequests(prev => ({
          ...prev,
          [toUser.id]: true
        }));
        
        toast.success('Transfer request sent successfully');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error('Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  // Update fetchRequests to handle request matching after updates
  const fetchRequests = async () => {
    try {
      // First get current user's request
      const userRequestsQuery = query(
        collection(db, 'transferRequests'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const userRequestsSnapshot = await getDocs(userRequestsQuery);
      const userRequestDoc = userRequestsSnapshot.docs[0];
      const currentUserRequest = userRequestDoc?.data();
      
      if (currentUserRequest) {
        // Set user's own request first
        const currentRequest = { 
          ...currentUserRequest, 
          id: userRequestDoc.id,
          createdAt: formatDate(currentUserRequest.createdAt)
        };
        setRequests([currentRequest]);

        // If user has a request, fetch all potential matches
        const allRequestsQuery = query(
          collection(db, 'transferRequests'),
          where('department', '==', currentUserRequest.department),
          where('subDepartment', '==', currentUserRequest.subDepartment),
          where('post', '==', currentUserRequest.post)
        );
        
        const allRequestsSnapshot = await getDocs(allRequestsQuery);
        const allRequests = allRequestsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: formatDate(doc.data().createdAt)
          }));

        console.log('All matching requests (including current):', allRequests);

        // Also fetch existing sent requests to mark them as already sent
        const sentRequestsQuery = query(
          collection(db, 'notifications'),
          where('fromUserId', '==', auth.currentUser.uid),
          where('type', '==', 'transfer_request')
        );
        
        const sentRequestsSnapshot = await getDocs(sentRequestsQuery);
        const sentRequestsMap = {};
        
        sentRequestsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.toRequestId) {
            sentRequestsMap[data.toRequestId] = true;
          }
        });
        
        // Update sent requests state
        setSentRequests(sentRequestsMap);

        // Find direct matches (2-way)
        const directMatches = allRequests
          .filter(req => req.userId !== auth.currentUser.uid)
          .filter(req => {
            // First check if department, subDepartment and post match
            const basicDetailsMatch = 
              req.department === currentRequest.department &&
              req.subDepartment === currentRequest.subDepartment &&
              req.post === currentRequest.post;

            if (!basicDetailsMatch) {
              console.log('Basic details do not match:', {
                user1: {
                  name: currentRequest.name,
                  department: currentRequest.department,
                  subDepartment: currentRequest.subDepartment,
                  post: currentRequest.post
                },
                user2: {
                  name: req.name,
                  department: req.department,
                  subDepartment: req.subDepartment,
                  post: req.post
                }
              });
              return false;
            }

            // Check if the other user wants current user's location
            const theyWantMyLocation = 
              (req.wantedZone1 === currentRequest.currentZone && req.wantedDivision1 === currentRequest.currentDivision) ||
              (req.wantedZone2 === currentRequest.currentZone && req.wantedDivision2 === currentRequest.currentDivision) ||
              (req.wantedZone3 === currentRequest.currentZone && req.wantedDivision3 === currentRequest.currentDivision);

            // Check if current user wants their location
            const iWantTheirLocation = 
              (currentRequest.wantedZone1 === req.currentZone && currentRequest.wantedDivision1 === req.currentDivision) ||
              (currentRequest.wantedZone2 === req.currentZone && currentRequest.wantedDivision2 === req.currentDivision) ||
              (currentRequest.wantedZone3 === req.currentZone && currentRequest.wantedDivision3 === req.currentDivision);

            console.log('Checking match between:', {
              currentUser: {
                name: currentRequest.name,
                current: `${currentRequest.currentZone}/${currentRequest.currentDivision}`,
                wanted: [
                  `${currentRequest.wantedZone1}/${currentRequest.wantedDivision1}`,
                  `${currentRequest.wantedZone2}/${currentRequest.wantedDivision2}`,
                  `${currentRequest.wantedZone3}/${currentRequest.wantedDivision3}`
                ]
              },
              otherUser: {
                name: req.name,
                current: `${req.currentZone}/${req.currentDivision}`,
                wanted: [
                  `${req.wantedZone1}/${req.wantedDivision1}`,
                  `${req.wantedZone2}/${req.wantedDivision2}`,
                  `${req.wantedZone3}/${req.wantedDivision3}`
                ]
              },
              locationMatchStatus: {
                theyWantMyLocation,
                iWantTheirLocation,
                isMatch: theyWantMyLocation && iWantTheirLocation
              }
            });

            // Return true only if all conditions match
            return basicDetailsMatch && theyWantMyLocation && iWantTheirLocation;
          });
        
        setMatchedRequests(directMatches);
        console.log('Direct matches found:', directMatches.length, directMatches);

        // Find cyclic matches (3 or more users)
        const cycles = findCyclicMatches(allRequests, currentRequest);
        console.log('Found cyclic matches:', cycles);
        setCyclicMatches(cycles);
      } else {
        setRequests([]);
        setMatchedRequests([]);
        setCyclicMatches([]);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load transfer requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransferHistory = async () => {
    try {
      // Create composite index for notifications collection
      const historyQuery = query(
        collection(db, 'notifications'),
        where('status', '==', 'completed'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const historySnapshot = await getDocs(historyQuery);
      const history = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatDate(doc.data().createdAt)
      }));
      
      setTransferHistory(history);
    } catch (err) {
      console.error('Error fetching transfer history:', err);
      if (err.code === 'failed-precondition') {
        console.log('Please create the required index in Firebase Console');
      }
    }
  };

  const fetchPendingNotifications = async () => {
    try {
      console.log('Fetching notifications for dashboard');
      
      // First check if notifications are stored in the global window object (shared from Header)
      if (window.notifications && window.notifications.length > 0) {
        console.log(`Found ${window.notifications.length} notifications from window object`);
        
        // Filter out notifications with status 'no_longer_matching'
        const filteredNotifications = window.notifications.filter(
          notification => notification.status !== 'no_longer_matching'
        );
        
        console.log(`After filtering out no_longer_matching, ${filteredNotifications.length} notifications remain`);
        
        // Group notifications by fromUserId to avoid duplicates
        const notificationsByUser = {};
        
        filteredNotifications.forEach(notification => {
          const fromUserId = notification.fromUserId;
          
          // If we already have a notification from this user, keep the newer one
          if (!notificationsByUser[fromUserId] || 
              notification.createdAt > notificationsByUser[fromUserId].createdAt) {
            notificationsByUser[fromUserId] = notification;
          }
        });
        
        // Convert the grouped notifications back to an array
        const pendingNotifications = Object.values(notificationsByUser);
        console.log(`Final pending notifications count: ${pendingNotifications.length}`);
        
        setPendingNotifications(pendingNotifications);
        return;
      }
      
      // ... Rest of the existing code
    } catch (error) {
      console.error('Error fetching pending notifications:', error);
      setPendingNotifications([]);
    }
  };

  // Fetch accepted requests (both sent and received)
  const fetchAcceptedRequests = async () => {
    try {
      console.log(`========= FETCHING ACCEPTED REQUESTS =========`);
      console.log('Fetching accepted requests for user:', auth.currentUser.uid);
      
      // Get notifications that the current user has accepted (received requests)
      const receivedRequestsQuery = query(
        collection(db, 'notifications'),
        where('toUserId', '==', auth.currentUser.uid),
        where('status', '==', 'accepted')
      );
      
      // Get notifications that others have accepted from the current user (sent requests)
      const sentRequestsQuery = query(
        collection(db, 'notifications'),
        where('fromUserId', '==', auth.currentUser.uid),
        where('status', '==', 'accepted')
      );
      
      // Execute both queries
      const [receivedSnapshot, sentSnapshot] = await Promise.all([
        getDocs(receivedRequestsQuery),
        getDocs(sentRequestsQuery)
      ]);
      
      console.log(`Found ${receivedSnapshot.docs.length} received accepted requests`);
      console.log(`Found ${sentSnapshot.docs.length} sent accepted requests`);
      
      // Process received requests (requests the user has accepted)
      const receivedRequests = receivedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'received',
        createdAt: formatDate(doc.data().createdAt),
        statusText: 'You Accepted'
      }));
      
      // Process sent requests (requests others have accepted)
      const sentRequests = sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'sent',
        createdAt: formatDate(doc.data().createdAt),
        statusText: 'Request Accepted'
      }));
      
      console.log('Sent requests (should appear in "Your Requests Accepted by Others"):', sentRequests);
      
      // Combine both types
      const combined = [...receivedRequests, ...sentRequests];
      console.log('Combined accepted requests:', combined.length);
      
      // Update state
      setAcceptedRequests(combined);
    } catch (err) {
      console.error('Error fetching accepted requests:', err);
    }
  };

  // Fetch rejected requests
  const fetchRejectedRequests = async () => {
    try {
      console.log(`========= FETCHING REJECTED REQUESTS =========`);
      console.log('Fetching rejected requests for user:', auth.currentUser.uid);
      
      // Get notifications that the current user has rejected
      const rejectedRequestsQuery = query(
        collection(db, 'notifications'),
        where('toUserId', '==', auth.currentUser.uid),
        where('status', '==', 'rejected')
      );
      
      const rejectedSnapshot = await getDocs(rejectedRequestsQuery);
      console.log(`Found ${rejectedSnapshot.docs.length} rejected requests`);
      
      // Process rejected requests
      const rejected = rejectedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: formatDate(doc.data().createdAt),
        statusText: 'You Rejected'
      }));
      
      // Update state
      setRejectedRequests(rejected);
    } catch (err) {
      console.error('Error fetching rejected requests:', err);
    }
  };

  // Fetch blocked users
  const fetchBlockedUsers = async () => {
    try {
      console.log(`========= FETCHING BLOCKED USERS =========`);
      
      // Get the current user's blocked list
      const blockedUsersRef = doc(db, 'blockedUsers', auth.currentUser.uid);
      const blockedUsersDoc = await getDoc(blockedUsersRef);
      
      if (blockedUsersDoc.exists()) {
        const blockedData = blockedUsersDoc.data();
        const blockedUsersData = blockedData.blockedUsers || {};
        console.log(`Found ${Object.keys(blockedUsersData).length} blocked users`);
        
        // Format for UI display
        const blockedList = Object.entries(blockedUsersData).map(([userId, data]) => ({
          id: userId,
          userName: data.userName || 'Unknown User',
          blockedAt: formatDate(data.blockedAt),
          originalRequestId: data.originalRequestId
        }));
        
        setBlockedRequests(blockedList);
        setBlockedUsers(blockedUsersData);
      } else {
        console.log('No blocked users document found');
        setBlockedRequests([]);
        setBlockedUsers({});
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
  };

  // Add separate effect to refresh rejected requests when section is visible
  useEffect(() => {
    // If rejected requests section is open, refresh the data
    if (activeSection === 'rejected' || (isRejectedOpen && !activeSection)) {
      console.log('Rejected requests section is visible, refreshing data');
      fetchRejectedRequests();
    }
  }, [activeSection, isRejectedOpen]);

  // Add separate effect to refresh blocked users when section is visible
  useEffect(() => {
    // If blocked users section is open, refresh the data
    if (activeSection === 'blocked' || (isBlockedOpen && !activeSection)) {
      console.log('Blocked users section is visible, refreshing data');
      fetchBlockedUsers();
    }
  }, [activeSection, isBlockedOpen]);

  // Initialize data fetching
  useEffect(() => {
    console.log('Initializing data fetching');
    const initializeData = async () => {
      try {
        setLoading(true);
        console.log('Starting data fetch operations');
        
        await Promise.all([
          fetchRequests(),
          fetchPendingNotifications(),
          fetchAcceptedRequests(),
          fetchRejectedRequests(),
          fetchBlockedUsers()
        ]);
        
        console.log('All initial data fetched successfully');
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        console.log('Setting loading state to false after initialization');
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      initializeData();
    } else {
      setLoading(false);
    }
  }, []);

  // Handle edit button click
  const handleEdit = (request) => {
    setEditingRequest(request);
    setShowEditModal(true);
  };

  // Add handler to save edited request
  const handleSaveEdit = async (editedRequest) => {
    try {
      setLoading(true);
      setShowEditModal(false);
      
      // Format the request data
      const requestData = {
        ...editedRequest,
        updatedAt: new Date().toISOString()
      };
      
      // Update the request in Firestore
      const requestRef = doc(db, 'transferRequests', editingRequest.id);
      await updateDoc(requestRef, requestData);
      
      // Update related notifications with the updated transfer request data
      try {
        // Find all notifications sent by this user that are pending or accepted
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('fromUserId', '==', auth.currentUser.uid),
          where('status', 'in', ['pending', 'accepted'])
        );
        
        const notificationsSnapshot = await getDocs(notificationsQuery);
        
        // Update each notification with the new data
        const batch = writeBatch(db);
        let updatedCount = 0;
        
        notificationsSnapshot.forEach((notificationDoc) => {
          const notificationRef = doc(db, 'notifications', notificationDoc.id);
          
          // Update only the fields that might have changed in the transfer request
          batch.update(notificationRef, {
            fromCurrentLocation: `${requestData.currentZone} (${requestData.currentDivision})`,
            fromWantedLocation: `${requestData.wantedZone1} (${requestData.wantedDivision1})`,
            fromDepartment: requestData.department,
            fromSubDepartment: requestData.subDepartment,
            fromPost: requestData.post,
            lastUpdated: new Date(),
            fromRequestUpdated: true
          });
          
          updatedCount++;
        });
        
        // Commit the batch update
        if (updatedCount > 0) {
          await batch.commit();
          console.log(`Updated ${updatedCount} notifications with new transfer request data`);
        }
      } catch (updateError) {
        console.error('Error updating notifications:', updateError);
        // Don't block the main flow if notification updates fail
      }
      
      // Check if any matches need to be updated after the edit
      await checkMatchesAfterUpdate(requestData);
      
      // Refresh the requests data
      setUserRequest(requestData);
      fetchRequests();
      
      toast.success('Transfer request updated successfully!');
    } catch (error) {
      console.error('Error updating transfer request:', error);
      toast.error('Failed to update transfer request.');
    } finally {
      setLoading(false);
      setEditingRequest(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'transferRequests', id));
      setSuccess('Transfer request deleted successfully');
      setDeleteConfirm(null);
      await fetchRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
      setError('Failed to delete transfer request');
    } finally {
      setLoading(false);
    }
  };

  // Handle rejecting an already accepted request
  const handleRejectAcceptedRequest = async (requestId) => {
    try {
      setProcessingNotification(requestId);
      setLoading(true);
      
      // Get the notification data
      const notificationRef = doc(db, 'notifications', requestId);
      const notificationSnap = await getDoc(notificationRef);
      
      if (!notificationSnap.exists()) {
        setError('Request not found');
        setProcessingNotification(null);
        setLoading(false);
        return;
      }
      
      const notification = notificationSnap.data();
      
      // Update the notification status to rejected
      await updateDoc(notificationRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        wasAccepted: true // This marks that it was once accepted
      });
      
      // Send notification to the requester that their request was rejected after being accepted
      await addDoc(collection(db, 'notifications'), {
        fromUserId: auth.currentUser.uid,
        toUserId: notification.fromUserId,
        status: 'info',
        type: 'request_rejected_after_accept',
        message: 'Your previously accepted transfer request has been rejected.',
        relatedRequestId: notification.fromRequestId,
        createdAt: serverTimestamp()
      });
      
      setSuccess('Transfer request has been rejected. The requester has been notified.');
      
      // Refresh the accepted requests
      fetchAcceptedRequests();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error rejecting accepted request:', err);
      setError('Failed to reject request');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
      setProcessingNotification(null);
      setConfirmRejectAccepted(null);
    }
  };

  const handleNotificationAction = async (notificationId, action) => {
    try {
      console.log(`========= HANDLING NOTIFICATION ACTION =========`);
      console.log(`Action: ${action} for notification ID: ${notificationId}`);
      
      setProcessingNotification(notificationId);
      const notificationRef = doc(db, 'notifications', notificationId);
      
      // First verify notification exists
      const notificationSnapshot = await getDoc(notificationRef);
      if (!notificationSnapshot.exists()) {
        console.error(`Notification document ${notificationId} not found in Firestore`);
        toast.error('Notification not found in the database');
        return;
      }
      
      const notificationData = notificationSnapshot.data();
      console.log(`Current notification data in Firestore:`, notificationData);
      
      const notification = pendingNotifications.find(n => n.id === notificationId);
      
      if (!notification) {
        console.error(`Notification ${notificationId} not found in local state`);
        toast.error('Notification not found in UI state');
        return;
      }

      console.log(`Found notification in state:`, notification);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('User not authenticated');
        toast.error('You must be logged in to perform this action');
        return;
      }

      const currentTime = new Date().toISOString();
      
      // Data to update in Firestore
      const updateData = {
        status: action === 'accept' ? 'accepted' : 'rejected',
        actionTaken: true,
        actionType: action,
        processedAt: currentTime,
        processedBy: currentUser.uid
      };
      
      console.log(`Updating notification in Firestore with data:`, updateData);
      
      // Update the notification with action information instead of deleting it
      await updateDoc(notificationRef, updateData);
      
      // Double-check the update by re-fetching
      const updatedSnapshot = await getDoc(notificationRef);
      if (!updatedSnapshot.exists()) {
        console.error('Updated notification document no longer exists!');
      } else {
        const updatedData = updatedSnapshot.data();
        console.log('Updated notification in Firestore:', updatedData);
        console.log('Verification - status:', updatedData.status);
        console.log('Verification - actionTaken:', updatedData.actionTaken);
        console.log('Verification - actionType:', updatedData.actionType);
      }

      // Update UI
      setPendingNotifications(prev => {
        const updated = prev.map(item => 
          item.id === notificationId 
            ? { 
                ...item, 
                status: action === 'accept' ? 'accepted' : 'rejected',
                actionTaken: true,
                actionType: action,
                processedAt: currentTime,
                processedBy: currentUser.uid
              } 
            : item
        );
        
        console.log('Updated pendingNotifications state:', updated.length);
        updated.forEach((n, i) => {
          if (n.id === notificationId) {
            console.log(`Updated notification in state:`, {
              id: n.id,
              status: n.status,
              actionTaken: n.actionTaken,
              actionType: n.actionType
            });
          }
        });
        
        return updated;
      });
    } catch (err) {
      console.error('Error handling notification action:', err);
      toast.error('Failed to handle notification action');
    } finally {
      setProcessingNotification(null);
    }
  };

  // Function to undo an accepted or rejected notification
  const handleUndoAction = async (notificationId) => {
    try {
      console.log(`========= UNDOING NOTIFICATION ACTION =========`);
      console.log(`Undoing action for notification ID: ${notificationId}`);
      
      setProcessingNotification(notificationId);
      
      // Find the notification object
      const notificationRef = doc(db, 'notifications', notificationId);
      
      // First verify notification exists
      const notificationSnapshot = await getDoc(notificationRef);
      if (!notificationSnapshot.exists()) {
        console.error(`Notification document ${notificationId} not found in Firestore`);
        toast.error('Notification not found in the database');
        return;
      }
      
      const notificationData = notificationSnapshot.data();
      console.log(`Current notification data before undo:`, notificationData);
      
      // Update the notification document to remove actionTaken property
      await updateDoc(notificationRef, {
        status: 'pending',
        actionTaken: false,
        actionType: null,
        processedAt: null,
        processedBy: null
      });
      
      // Double-check the update
      const updatedSnapshot = await getDoc(notificationRef);
      console.log('Verification after undo:', updatedSnapshot.data());
      
      // Update local state based on the notification location (which list it's in)
      if (notificationData.status === 'accepted') {
        console.log('Updating acceptedRequests state after undo');
        setAcceptedRequests(prevRequests => 
          prevRequests.filter(req => req.id !== notificationId)
        );
      } else if (notificationData.status === 'rejected') {
        console.log('Updating rejectedRequests state after undo');
        setRejectedRequests(prevRequests => 
          prevRequests.filter(req => req.id !== notificationId)
        );
      }
      
      // Update pendingNotifications to include the undone notification
      setPendingNotifications(prevNotifications => {
        // Check if the notification already exists in the list
        const notificationExists = prevNotifications.some(notif => notif.id === notificationId);
        
        if (notificationExists) {
          // If it exists, update its properties
          return prevNotifications.map(notif => 
            notif.id === notificationId 
              ? { 
                  ...notif, 
                  status: 'pending',
                  actionTaken: false, 
                  actionType: null, 
                  processedAt: null,
                  processedBy: null
                } 
              : notif
          );
        } else {
          // If it doesn't exist, add it to the list
          const undoneNotification = {
            id: notificationId,
            ...notificationData,
            status: 'pending',
            actionTaken: false,
            actionType: null,
            processedAt: null,
            processedBy: null
          };
          return [...prevNotifications, undoneNotification];
        }
      });
      
      // Refresh the lists to ensure state is in sync with Firestore
      fetchPendingNotifications();
      fetchAcceptedRequests();
      fetchRejectedRequests();
      
      toast.success('Action has been undone');
    } catch (error) {
      console.error('Error undoing notification action:', error);
      toast.error('Failed to undo action. Please try again.');
    } finally {
      setProcessingNotification(null);
    }
  };

  // Effect to make sure loading state doesn't get stuck
  useEffect(() => {
    // Set a maximum loading time of 10 seconds to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing loading state to false');
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  // Function to handle unblocking a user
  const handleUnblockUser = async (userId, userName) => {
    try {
      setProcessingNotification(userId);
      console.log(`Unblocking user: ${userId} (${userName})`);
      
      // Get current blocked users
      const blockedUsersRef = doc(db, 'blockedUsers', auth.currentUser.uid);
      const blockedUsersDoc = await getDoc(blockedUsersRef);
      
      if (!blockedUsersDoc.exists()) {
        console.log('No blocked users document found');
        toast.error('Failed to find blocked users');
        return;
      }
      
      // Get the current blocked users
      const currentBlockedUsers = blockedUsersDoc.data().blockedUsers || {};
      
      // Check if the user is blocked
      if (!currentBlockedUsers[userId]) {
        console.log(`User ${userId} is not in the blocked list`);
        toast.info('This user is not blocked');
        return;
      }
      
      // Get the original request id if available
      const originalRequestId = currentBlockedUsers[userId].originalRequestId;
      
      // Remove the user from blocked list
      const updatedBlockedUsers = { ...currentBlockedUsers };
      delete updatedBlockedUsers[userId];
      
      // Update the blocked users document
      await setDoc(blockedUsersRef, { blockedUsers: updatedBlockedUsers }, { merge: true });
      
      // If there was an original request, try to restore it
      if (originalRequestId) {
        const notificationRef = doc(db, 'notifications', originalRequestId);
        const notificationSnap = await getDoc(notificationRef);
        
        if (notificationSnap.exists()) {
          // Restore the notification to pending state
          await updateDoc(notificationRef, {
            status: 'pending',
            actionTaken: false,
            actionType: null,
            processedAt: null,
            processedBy: null
          });
          
          toast.success(`User ${userName} has been unblocked and their request has been restored`);
        } else {
          toast.success(`User ${userName} has been unblocked`);
        }
      } else {
        toast.success(`User ${userName} has been unblocked`);
      }
      
      // Update local state
      setBlockedUsers(updatedBlockedUsers);
      fetchBlockedUsers();
      fetchPendingNotifications();
      
    } catch (err) {
      console.error('Error unblocking user:', err);
      toast.error('Failed to unblock user');
    } finally {
      setProcessingNotification(null);
    }
  };

  // Function to handle blocking a user
  const handleBlockUser = async (userId, userName, notificationId) => {
    try {
      setProcessingNotification(userId);
      console.log(`Blocking user: ${userId} (${userName})`);
      
      // Add to blocked users collection if it doesn't exist
      const blockedUsersRef = doc(db, 'blockedUsers', auth.currentUser.uid);
      const timestamp = serverTimestamp();
      
      const blockedUserData = {
        userName: userName || 'Unknown User',
        blockedAt: timestamp,
        originalRequestId: notificationId
      };
      
      // Get current blocked users
      const blockedUsersDoc = await getDoc(blockedUsersRef);
      let currentBlockedUsers = {};
      
      if (blockedUsersDoc.exists()) {
        currentBlockedUsers = blockedUsersDoc.data().blockedUsers || {};
      }
      
      // Add new blocked user
      const updatedBlockedUsers = {
        ...currentBlockedUsers,
        [userId]: blockedUserData
      };
      
      // Update Firestore
      await setDoc(blockedUsersRef, { blockedUsers: updatedBlockedUsers }, { merge: true });
      
      // Update the notification if notificationId is provided
      if (notificationId) {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, {
          status: 'blocked',
          actionTaken: true,
          actionType: 'block',
          processedAt: new Date().toISOString(),
          processedBy: auth.currentUser.uid
        });
      }
      
      // Update local state
      setBlockedUsers(updatedBlockedUsers);
      setConfirmBlock(null);
      
      // Refresh lists
      fetchBlockedUsers();
      fetchPendingNotifications();
      
      toast.success(`User ${userName} has been blocked`);
    } catch (err) {
      console.error('Error blocking user:', err);
      toast.error('Failed to block user');
    } finally {
      setProcessingNotification(null);
    }
  };

  // Pagination utility functions
  const getPaginatedItems = (items, page, perPage) => {
    const startIndex = (page - 1) * perPage;
    return items.slice(startIndex, startIndex + perPage);
  };
  
  const getPageCount = (totalItems, perPage) => {
    return Math.ceil(totalItems / perPage);
  };
  
  // Reset pagination when data changes
  useEffect(() => {
    setRejectedPage(1);
  }, [rejectedRequests]);
  
  useEffect(() => {
    setBlockedPage(1);
  }, [blockedRequests]);

  // Add a function to check if requests still match after update
  const checkMatchesAfterUpdate = async (updatedRequest) => {
    try {
      console.log('Checking all matches after update:', updatedRequest);
      
      // 1. Check accepted requests - if they no longer match, remove them
      const acceptedRequestsQuery = query(
        collection(db, 'notifications'),
        where('fromUserId', '==', auth.currentUser.uid),
        where('status', '==', 'accepted')
      );
      
      const acceptedSnapshot = await getDocs(acceptedRequestsQuery);
      
      for (const doc of acceptedSnapshot.docs) {
        const notification = doc.data();
        
        // Check if this notification still matches after the update
        const stillMatches = await checkIfRequestsStillMatch(notification, updatedRequest);
        
        if (!stillMatches) {
          console.log(`Accepted request ${doc.id} no longer matches - removing`);
          await updateDoc(doc.ref, {
            status: 'no_longer_matching',
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      // 2. Check rejected requests - if they no longer match, remove them
      const rejectedRequestsQuery = query(
        collection(db, 'notifications'),
        where('fromUserId', '==', auth.currentUser.uid),
        where('status', '==', 'rejected')
      );
      
      const rejectedSnapshot = await getDocs(rejectedRequestsQuery);
      
      for (const doc of rejectedSnapshot.docs) {
        const notification = doc.data();
        
        // Check if this notification still matches after the update
        const stillMatches = await checkIfRequestsStillMatch(notification, updatedRequest);
        
        if (!stillMatches) {
          console.log(`Rejected request ${doc.id} no longer matches - removing`);
          await updateDoc(doc.ref, {
            status: 'no_longer_matching',
            updatedAt: new Date().toISOString()
          });
        }
      }
      
      // 3. Check blocked users - if they no longer match, remove the block
      const blockedUsersQuery = query(
        collection(db, 'blockedUsers'),
        where('blockedBy', '==', auth.currentUser.uid)
      );
      
      const blockedSnapshot = await getDocs(blockedUsersQuery);
      
      for (const doc of blockedSnapshot.docs) {
        const blockedUser = doc.data();
        
        // Get the transfer request of the blocked user
        const blockedUserRequestQuery = query(
          collection(db, 'transferRequests'),
          where('userId', '==', blockedUser.userId),
          limit(1)
        );
        
        const blockedUserRequestSnapshot = await getDocs(blockedUserRequestQuery);
        
        if (blockedUserRequestSnapshot.docs.length > 0) {
          const blockedUserRequest = blockedUserRequestSnapshot.docs[0].data();
          
          // Check if the requests still match
          const stillMatches = checkLocationMatch(updatedRequest, blockedUserRequest) && 
                            checkDepartmentMatch(updatedRequest, blockedUserRequest);
          
          if (!stillMatches) {
            console.log(`Blocked user ${blockedUser.userId} no longer matches - removing block`);
            await deleteDoc(doc.ref);
          }
        }
      }
      
      // 4. Check inbound notifications (requests from others) - update their status
      const inboundNotificationsQuery = query(
        collection(db, 'notifications'),
        where('toUserId', '==', auth.currentUser.uid),
        where('status', 'in', ['pending', 'accepted'])
      );
      
      const inboundSnapshot = await getDocs(inboundNotificationsQuery);
      
      for (const doc of inboundSnapshot.docs) {
        const notification = doc.data();
        
        // Get the sender's transfer request
        const senderRequestQuery = query(
          collection(db, 'transferRequests'),
          where('userId', '==', notification.fromUserId),
          limit(1)
        );
        
        const senderRequestSnapshot = await getDocs(senderRequestQuery);
        
        if (senderRequestSnapshot.docs.length > 0) {
          const senderRequest = senderRequestSnapshot.docs[0].data();
          
          // Check if the requests still match
          const stillMatches = checkLocationMatch(updatedRequest, senderRequest) && 
                            checkDepartmentMatch(updatedRequest, senderRequest);
          
          if (!stillMatches) {
            console.log(`Inbound notification ${doc.id} no longer matches - updating status`);
            await updateDoc(doc.ref, {
              status: 'no_longer_matching',
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
      
      // Refresh all data after update
      fetchAcceptedRequests();
      fetchRejectedRequests();
      fetchBlockedUsers();
      fetchRequests();
      fetchPendingNotifications();
      
      // Trigger a refresh for notifications in Header component
      window.dispatchEvent(new Event('refresh-notifications'));
      
    } catch (error) {
      console.error('Error checking matches after update:', error);
    }
  };

  // Helper function to check if two requests still match
  const checkIfRequestsStillMatch = async (notification, updatedRequest) => {
    try {
      // Get the other user's transfer request
      const otherUserRequestQuery = query(
        collection(db, 'transferRequests'),
        where('userId', '==', notification.toUserId),
        limit(1)
      );
      
      const otherUserRequestSnapshot = await getDocs(otherUserRequestQuery);
      
      if (otherUserRequestSnapshot.docs.length === 0) {
        return false; // No request found, so no match
      }
      
      const otherUserRequest = otherUserRequestSnapshot.docs[0].data();
      
      // Check if the requests still match each other
      const departmentMatch = !updatedRequest.department || !otherUserRequest.department || 
                            updatedRequest.department === otherUserRequest.department;
      
      const subDepartmentMatch = !updatedRequest.subDepartment || !otherUserRequest.subDepartment || 
                                updatedRequest.subDepartment === otherUserRequest.subDepartment;
      
      const postMatch = !updatedRequest.post || !otherUserRequest.post || 
                       updatedRequest.post === otherUserRequest.post;
      
      const locationMatch = updatedRequest.currentLocation === otherUserRequest.wantedLocation && 
                           updatedRequest.wantedLocation === otherUserRequest.currentLocation;
      
      return departmentMatch && subDepartmentMatch && postMatch && locationMatch;
    } catch (error) {
      console.error('Error checking if requests still match:', error);
      return false;
    }
  };

  // Helper for location matching
  const checkLocationMatch = (request1, request2) => {
    return (request1.currentLocation === request2.wantedLocation || 
            `${request1.currentZone} (${request1.currentDivision})` === request2.wantedLocation) && 
           (request1.wantedLocation === request2.currentLocation || 
            request1.wantedLocation === `${request2.currentZone} (${request2.currentDivision})`);
  };

  // Helper for department matching
  const checkDepartmentMatch = (request1, request2) => {
    const departmentMatch = !request1.department || !request2.department || 
                           request1.department === request2.department;
    
    const subDepartmentMatch = !request1.subDepartment || !request2.subDepartment || 
                              request1.subDepartment === request2.subDepartment;
    
    const postMatch = !request1.post || !request2.post || 
                     request1.post === request2.post;
    
    return departmentMatch && subDepartmentMatch && postMatch;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div>
            {/* Your Transfer Request Section */}
            <section 
              ref={yourRequestSectionRef} 
              className={`mb-10 ${activeSection === 'your-transfer-request' ? 'scroll-mt-20' : ''}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Your Transfer Request</h2>
                {requests.length > 0 && (
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleEdit(requests[0])}
                      className="flex items-center text-indigo-600 hover:text-indigo-800"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(requests[0].id)}
                      className="flex items-center text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              {requests.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Current Location</h3>
                        <p className="text-gray-600">{requests[0].currentLocation || `${requests[0].currentZone} (${requests[0].currentDivision})`}</p>
                        
                        <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2">Department</h3>
                        <p className="text-gray-600">{requests[0].department || 'Not specified'}</p>
                        
                        {requests[0].subDepartment && (
                          <>
                            <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2">Sub-Department</h3>
                            <p className="text-gray-600">{requests[0].subDepartment}</p>
                          </>
                        )}
                        
                        {requests[0].post && (
                          <>
                            <h3 className="text-lg font-semibold text-gray-700 mt-4 mb-2">Post/Position</h3>
                            <p className="text-gray-600">{requests[0].post}</p>
                          </>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Requested Location</h3>
                        <div className="mb-4">
                          <p className="text-gray-600">
                            {requests[0].wantedLocation || `${requests[0].wantedZone1} (${requests[0].wantedDivision1})`}
                          </p>
                        </div>
                        
                        {requests[0].wantedZone2 && requests[0].wantedDivision2 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-600">Alternative Choice 1</h4>
                            <p className="text-gray-600">
                              {`${requests[0].wantedZone2} (${requests[0].wantedDivision2})`}
                            </p>
                          </div>
                        )}
                        
                        {requests[0].wantedZone3 && requests[0].wantedDivision3 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-600">Alternative Choice 2</h4>
                            <p className="text-gray-600">
                              {`${requests[0].wantedZone3} (${requests[0].wantedDivision3})`}
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-6 text-sm text-gray-500">
                          <p>Created: {requests[0].createdAt}</p>
                          {requests[0].updatedAt && (
                            <p className="mt-1">Last Updated: {formatDate(requests[0].updatedAt)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex justify-between">
                        <button
                          onClick={() => setDeleteConfirm(requests[0].id)}
                          className="flex items-center text-red-600 hover:text-red-800"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Request
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-700 mb-4">
                    You don't have a transfer request yet. Create one to start finding matches.
                  </p>
                  <button
                    onClick={() => navigate('/create-request')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                  >
                    Create Transfer Request
                  </button>
                </div>
              )}
            </section>

            {/* Other sections... */}
            
            {/* Your Requests Accepted by Others Section */}
            <section 
              ref={acceptedByOthersRef}
              className={`mb-10 ${activeSection === 'accepted-by-others' ? 'scroll-mt-20' : ''}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Your Requests Accepted by Others</h2>
                <button
                  onClick={() => setIsAcceptedByOthersOpen(!isAcceptedByOthersOpen)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isAcceptedByOthersOpen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              </div>
              
              <AnimatePresence>
                {isAcceptedByOthersOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {acceptedRequests.filter(request => request.type === 'sent').length > 0 ? (
                      <div className="grid gap-4">
                        {acceptedRequests
                          .filter(request => request.type === 'sent')
                          .map((request) => (
                            <div key={request.id} className="bg-white rounded-lg shadow-md p-4">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                <div>
                                  <h3 className="text-lg font-medium text-gray-800">{request.toUserName}</h3>
                                  
                                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                    <div>
                                      <p className="text-sm text-gray-600"><strong>From:</strong> {request.fromCurrentLocation}</p>
                                      <p className="text-sm text-gray-600"><strong>To:</strong> {request.fromWantedLocation}</p>
                                    </div>
                                    
                                    {(request.fromDepartment || request.fromSubDepartment || request.fromPost) && (
                                      <div>
                                        {request.fromDepartment && (
                                          <p className="text-sm text-gray-600"><strong>Department:</strong> {request.fromDepartment}</p>
                                        )}
                                        {request.fromSubDepartment && (
                                          <p className="text-sm text-gray-600"><strong>Sub Dept:</strong> {request.fromSubDepartment}</p>
                                        )}
                                        {request.fromPost && (
                                          <p className="text-sm text-gray-600"><strong>Post:</strong> {request.fromPost}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="mt-4 md:mt-0 flex items-center">
                                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 mr-2">
                                    {request.statusText}
                                  </span>
                                  
                                  <span className="text-xs text-gray-500">
                                    {request.createdAt}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg shadow-md p-6 text-gray-600">
                        <p>None of your requests have been accepted by others yet.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        )}
      </motion.div>
      
      {/* Render EditModal */}
      {editingRequest && (
        <EditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          request={editingRequest}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default Dashboard; 
