import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, getDocs, updateDoc, doc } from 'firebase/firestore';
import { FaCheck, FaTimes, FaReply } from 'react-icons/fa';

const AdminPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [response, setResponse] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Fetch all admin requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, 'adminRequests');
        const q = query(requestsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const requestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRequests(requestsData);
      } catch (err) {
        setError('Failed to fetch requests');
        console.error('Error fetching requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Handle request status update
  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, 'adminRequests', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      // Update local state
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === requestId
            ? { ...request, status: newStatus }
            : request
        )
      );
    } catch (err) {
      setError('Failed to update request status');
      console.error('Error updating status:', err);
    }
  };

  // Handle response submission
  const handleResponseSubmit = async () => {
    if (!selectedRequest || !response.trim()) return;

    try {
      const requestRef = doc(db, 'adminRequests', selectedRequest.id);
      await updateDoc(requestRef, {
        adminResponse: response,
        respondedAt: new Date()
      });

      // Update local state
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request.id === selectedRequest.id
            ? { ...request, adminResponse: response }
            : request
        )
      );

      setShowResponseModal(false);
      setResponse('');
      setSelectedRequest(null);
    } catch (err) {
      setError('Failed to send response');
      console.error('Error sending response:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Admin Requests Panel</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map(request => (
          <div
            key={request.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{request.subject}</h3>
                <p className="text-sm text-gray-600">
                  From: {request.userName} ({request.userEmail})
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(request.createdAt?.toDate()).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 py-1 rounded text-sm ${
                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {request.status}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{request.message}</p>

            {request.adminResponse && (
              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="text-sm font-medium text-gray-700">Admin Response:</p>
                <p className="text-sm text-gray-600">{request.adminResponse}</p>
              </div>
            )}

            <div className="flex space-x-2">
              {request.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusUpdate(request.id, 'approved')}
                    className="flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    <FaCheck className="mr-1" /> Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(request.id, 'rejected')}
                    className="flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    <FaTimes className="mr-1" /> Reject
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedRequest(request);
                  setShowResponseModal(true);
                }}
                className="flex items-center px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                <FaReply className="mr-1" /> Respond
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Send Response</h3>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
              placeholder="Enter your response..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setResponse('');
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleResponseSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 