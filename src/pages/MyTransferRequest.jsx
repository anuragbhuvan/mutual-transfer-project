import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, auth, checkAndUpdateActionLimit, getRemainingLimits } from '../firebase/config';
import { FaEdit, FaTrash, FaMapMarkerAlt, FaCalendarAlt, FaBuilding, FaIdCard, FaInfo, FaPhone, FaEnvelope, FaUserTie, FaExchangeAlt, FaArrowRight, FaCheckCircle, FaHourglassHalf, FaHistory, FaShare, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../firebase/AuthProvider';

const MyTransferRequest = () => {
  const { currentUser } = useAuth();
  const [userRequest, setUserRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState('');
  const [lastFetch, setLastFetch] = useState(Date.now());
  const [actionLimits, setActionLimits] = useState({ edit: 2, delete: 2 });
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [limitWarningMessage, setLimitWarningMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareText, setShareText] = useState('');
  
  const navigate = useNavigate();

  // Add multiple dependencies to ensure re-fetching
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          setError('You must be logged in to view your transfer request');
          setLoading(false);
          return;
        }
        
        const requestQuery = query(
          collection(db, 'transferRequests'),
          where('userId', '==', user.uid)
        );
        
        const requestSnapshot = await getDocs(requestQuery);
        
        if (isMounted) {
          if (!requestSnapshot.empty) {
            const requestData = requestSnapshot.docs[0].data();
            setUserRequest({
              id: requestSnapshot.docs[0].id,
              ...requestData
            });
          } else {
            setUserRequest(null);
          }
          setLastFetch(Date.now());
        }
      } catch (err) {
        console.error('Error fetching transfer request:', err);
        if (isMounted) {
          setError('Unable to load transfer request. Please check your internet connection and try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Remove lastFetch from dependencies

  // Fetch remaining limits
  useEffect(() => {
    const fetchLimits = async () => {
      if (auth.currentUser) {
        const limits = await getRemainingLimits(auth.currentUser.uid);
        setActionLimits(limits);
      }
    };
    fetchLimits();
  }, []);

  // Handle delete transfer request with better error handling
  const handleDeleteRequest = async (e) => {
    e.preventDefault();
    try {
      const limitCheck = await checkAndUpdateActionLimit(auth.currentUser.uid, 'delete');
      if (!limitCheck.allowed) {
        setLimitWarningMessage('You have reached the maximum limit of 2 deletions in 24 hours.');
        setShowLimitWarning(true);
        return;
      }

      await deleteDoc(doc(db, 'transferRequests', requestToDelete));
      setSuccess('Transfer request deleted successfully!');
      setUserRequest(null);
      setShowDeleteModal(false);
      setActionLimits(prev => ({ ...prev, delete: limitCheck.remainingCount }));
      setLoading(false);
    } catch (err) {
      console.error('Error deleting transfer request:', err);
      if (err.code === 'unavailable') {
        setError('Unable to delete request. Please check your internet connection and try again.');
      } else {
        setError('Failed to delete transfer request. Please try again.');
      }
      setShowDeleteModal(false);
    }
  };

  // Open confirm delete modal
  const confirmDelete = (id) => {
    setRequestToDelete(id);
    setShowDeleteModal(true);
  };

  // Handle edit request
  const handleEditRequest = async () => {
    try {
      const limitCheck = await checkAndUpdateActionLimit(auth.currentUser.uid, 'edit');
      if (!limitCheck.allowed) {
        setLimitWarningMessage('You have reached the maximum limit of 2 edits in 24 hours.');
        setShowLimitWarning(true);
        return;
      }

      navigate('/employee-form', { state: { editMode: true, requestData: userRequest } });
      setActionLimits(prev => ({ ...prev, edit: limitCheck.remainingCount }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle create new request
  const handleCreateRequest = () => {
    // Navigate directly to employee form instead of going through dashboard
    navigate('/employee-form');
  };

  // Manual refresh function
  const handleRefresh = () => {
    // This function is no longer used as the data is automatically refreshed
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

  // Function to generate share text
  const generateShareText = (request) => {
    const text = `
🔄 Transfer Request Details 🔄

👤 Name: ${request.name || 'Not specified'}
💼 Post: ${request.post || 'Not specified'}
⭐ Grade: ${request.grade || 'Not specified'}
📍 Current Location: ${request.currentLocation || 'Not specified'}
🎯 Wanted Locations: ${request.wantedLocations ? request.wantedLocations.join(', ') : 'Not specified'}
📝 Reason: ${request.reason || 'Not specified'}
📊 Status: ${request.status || 'Pending'}

Share and connect with other employees for mutual transfer!
    `.trim();
    setShareText(text);
    setShowShareModal(true);
  };

  // Function to share via WhatsApp
  const shareViaWhatsApp = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  // Function to share via Telegram
  const shareViaTelegram = () => {
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=&text=${encodedText}`, '_blank');
  };

  // Function to copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    alert('Text copied to clipboard!');
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

  if (!loading && !userRequest) {
    return (
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
                    <button
                      onClick={() => generateShareText(userRequest)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FaShare className="mr-2" /> Share
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
                onClick={handleDeleteRequest}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Warning Modal */}
      {showLimitWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold">Action Limit Reached</h3>
            </div>
            <p className="text-gray-600 mb-4">{limitWarningMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowLimitWarning(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Limits Display */}
      <div className="mb-4 text-sm text-gray-600">
        <p>Remaining today: {actionLimits.edit} edits, {actionLimits.delete} deletions</p>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Share Transfer Request</h3>
            <textarea
              value={shareText}
              readOnly
              className="w-full h-32 p-2 border rounded mb-4"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={shareViaWhatsApp}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Share on WhatsApp
              </button>
              <button
                onClick={shareViaTelegram}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Share on Telegram
              </button>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Copy Text
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
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

export default MyTransferRequest; 