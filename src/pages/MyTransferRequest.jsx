import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { FaEdit, FaTrash, FaMapMarkerAlt, FaCalendarAlt, FaBuilding, FaIdCard, FaInfo, FaPhone, FaEnvelope, FaUserTie, FaExchangeAlt, FaArrowRight, FaCheckCircle, FaHourglassHalf, FaHistory } from 'react-icons/fa';

const MyTransferRequest = () => {
  const [userRequest, setUserRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState('');
  const [lastFetch, setLastFetch] = useState(Date.now());
  
  const navigate = useNavigate();

  // Add multiple dependencies to ensure re-fetching
  useEffect(() => {
    // Fetch data immediately when component mounts
    fetchUserRequest();
    
    // Set up a timer to fetch data every 2 seconds for a short period after mount
    const refreshTimer = setInterval(() => {
      console.log('Auto-refreshing transfer request data...');
      fetchUserRequest();
      
      // Stop auto-refresh after 6 seconds (3 refreshes)
      if (Date.now() - lastFetch > 6000) {
        clearInterval(refreshTimer);
      }
    }, 2000);
    
    // Clean up interval on unmount
    return () => clearInterval(refreshTimer);
  }, [lastFetch]);

  const fetchUserRequest = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        setError('You must be logged in to view your transfer request');
        setLoading(false);
        return;
      }
      
      console.log('Fetching transfer request for user:', user.uid);
      
      // Get user's transfer request
      const requestQuery = query(
        collection(db, 'transferRequests'),
        where('userId', '==', user.uid)
      );
      
      const requestSnapshot = await getDocs(requestQuery);
      
      if (!requestSnapshot.empty) {
        // User has an existing transfer request
        const requestData = requestSnapshot.docs[0].data();
        console.log('Found transfer request data:', requestData);
        setUserRequest({
          id: requestSnapshot.docs[0].id,
          ...requestData
        });
      } else {
        // User has no transfer request
        console.log('No transfer request found');
        setUserRequest(null);
      }
      
      // Update last fetch timestamp
      setLastFetch(Date.now());
    } catch (err) {
      console.error('Error fetching transfer request:', err);
      setError('Failed to load transfer request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete transfer request
  const handleDeleteRequest = async (id) => {
    try {
      await deleteDoc(doc(db, 'transferRequests', id));
      setSuccess('Transfer request deleted successfully!');
      setUserRequest(null);
      setShowDeleteModal(false);
      // Force a refresh after deletion
      setLastFetch(Date.now());
    } catch (err) {
      console.error('Error deleting transfer request:', err);
      setError('Failed to delete transfer request. Please try again.');
      setShowDeleteModal(false);
    }
  };

  // Open confirm delete modal
  const confirmDelete = (id) => {
    setRequestToDelete(id);
    setShowDeleteModal(true);
  };

  // Handle edit request
  const handleEditRequest = () => {
    navigate('/employee-form', { state: { editMode: true, requestData: userRequest } });
  };

  // Handle create new request
  const handleCreateRequest = () => {
    // Navigate directly to employee form instead of going through dashboard
    navigate('/employee-form');
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchUserRequest();
  };

  // Add this helper function near the top of the component, after the useState declarations
  const formatCreatedDate = (createdAt) => {
    if (!createdAt) return 'N/A';
    
    try {
      // If it's a Firestore timestamp with toDate() method
      if (createdAt.toDate && typeof createdAt.toDate === 'function') {
        return createdAt.toDate().toLocaleDateString();
      }
      // If it's a JavaScript Date object or timestamp number
      else if (createdAt instanceof Date || (typeof createdAt === 'number')) {
        return new Date(createdAt).toLocaleDateString();
      }
      // If it's a string that can be parsed as a date
      else if (typeof createdAt === 'string') {
        return new Date(createdAt).toLocaleDateString();
      }
      // Default fallback
      return 'N/A';
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  if (loading && !userRequest) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">My Transfer Request</h2>
          <button 
            onClick={handleRefresh}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="px-6 py-4 text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        {success && (
          <div className="px-6 py-4 text-green-600 bg-green-50 border-b border-green-100">
            {success}
          </div>
        )}

        {!userRequest && !loading ? (
          <div className="p-6">
            <div className="text-center py-8">
              <FaExchangeAlt className="mx-auto text-gray-400 text-5xl mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Active Transfer Request</h3>
              <p className="text-gray-500 mb-6">You haven't created a transfer request yet. Create one to find potential matches.</p>
              <button
                onClick={handleCreateRequest}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Create Transfer Request
              </button>
            </div>
          </div>
        ) : (
          <>
            {userRequest && (
              <div className="p-6">
                {/* Status Badge */}
                <div className="mb-6 flex justify-between items-center">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                      ${userRequest.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {userRequest.status === 'active' ? (
                        <><FaCheckCircle className="mr-1" /> Active</>
                      ) : (
                        <><FaHourglassHalf className="mr-1" /> Pending</>
                      )}
                    </span>
                    <span className="ml-3 text-sm text-gray-500">
                      <FaCalendarAlt className="inline mr-1" />
                      Created on: {formatCreatedDate(userRequest.createdAt)}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditRequest}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FaEdit className="mr-2" /> Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(userRequest.id)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <FaTrash className="mr-2" /> Delete
                    </button>
                  </div>
                </div>

                {/* Personal Information Card */}
                <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <FaUserTie className="mr-2 text-indigo-600" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-28">Name:</span>
                      <span className="font-medium">{userRequest.name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-28">Contact Number:</span>
                      <span className="font-medium">{userRequest.contactNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-28">Post:</span>
                      <span className="font-medium">{userRequest.post || 'N/A'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-28">Category:</span>
                      <span className="font-medium">{userRequest.category || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Current Location Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-lg p-5 border border-blue-200 shadow-sm">
                    <h3 className="text-lg font-medium text-blue-800 mb-4 border-b pb-2 border-blue-100 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-blue-600" /> Current Location
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 w-24">Zone:</span>
                        <span className="font-medium">{userRequest.currentZone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 w-24">Division:</span>
                        <span className="font-medium">{userRequest.currentDivision || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 w-24">Department:</span>
                        <span className="font-medium">{userRequest.department || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 w-24">Sub Dept:</span>
                        <span className="font-medium">{userRequest.subDepartment || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Preferred Location Card */}
                  <div className="bg-white rounded-lg p-5 border border-green-200 shadow-sm">
                    <h3 className="text-lg font-medium text-green-800 mb-4 border-b pb-2 border-green-100 flex items-center">
                      <FaArrowRight className="mr-2 text-green-600" /> Wanted Locations
                    </h3>
                    <div className="space-y-4">
                      {userRequest.wantedZone1 && (
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Option 1:</p>
                          <div className="flex items-center mt-1">
                            <span className="text-sm text-gray-500 w-20">Zone:</span>
                            <span className="font-medium">{userRequest.wantedZone1}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 w-20">Division:</span>
                            <span className="font-medium">{userRequest.wantedDivision1 || 'Any Division'}</span>
                          </div>
                        </div>
                      )}
                      
                      {userRequest.wantedZone2 && (
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Option 2:</p>
                          <div className="flex items-center mt-1">
                            <span className="text-sm text-gray-500 w-20">Zone:</span>
                            <span className="font-medium">{userRequest.wantedZone2}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 w-20">Division:</span>
                            <span className="font-medium">{userRequest.wantedDivision2 || 'Any Division'}</span>
                          </div>
                        </div>
                      )}
                      
                      {userRequest.wantedZone3 && userRequest.wantedZone3.trim() !== "" && (
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Option 3:</p>
                          <div className="flex items-center mt-1">
                            <span className="text-sm text-gray-500 w-20">Zone:</span>
                            <span className="font-medium">{userRequest.wantedZone3}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 w-20">Division:</span>
                            <span className="font-medium">{userRequest.wantedDivision3 || 'Any Division'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <FaInfo className="mr-2 text-indigo-600" /> Additional Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 w-24">Grade Pay:</span>
                      <span className="font-medium">{userRequest.gradePay || 'N/A'}</span>
                    </div>
                    {userRequest.jobId && userRequest.jobId.trim() !== "" && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 w-24">Job ID:</span>
                        <span className="font-medium">{userRequest.jobId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowDeleteModal(false)}>
          <div className="warning-popup animate-popup" onClick={e => e.stopPropagation()}>
            <div className="flex items-center mb-4 text-red-500">
              <FaExclamationTriangle className="mr-2 text-xl" />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            <p className="mb-4 text-gray-700">
              Are you sure you want to delete your transfer request? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRequest(requestToDelete)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTransferRequest; 