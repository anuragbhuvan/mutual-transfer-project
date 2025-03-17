import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { FaUser, FaPhoneAlt, FaBriefcase, FaMapMarkerAlt, FaIdCard, FaExchangeAlt, FaBuilding } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../firebase/AuthProvider';

const Dashboard = ({ activeSection }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRequest, setUserRequest] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        if (!currentUser) {
          console.log("Dashboard: No authenticated user found");
          setLoading(false);
          return;
        }
        
        console.log("Dashboard: Fetching data for user:", currentUser.email);
        
        // Get user's transfer request
        const requestQuery = query(
          collection(db, 'transferRequests'),
          where('userId', '==', currentUser.uid)
        );
        
        const requestSnapshot = await getDocs(requestQuery);
        
        if (!requestSnapshot.empty) {
          // User has an existing transfer request
          const requestData = requestSnapshot.docs[0].data();
          setUserRequest({
            id: requestSnapshot.docs[0].id,
            ...requestData
          });
        } else {
          // User has no transfer request
          setUserRequest(null);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-indigo-600 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm">
      <div className="py-3 px-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Welcome back! Here's an overview of your transfer requests and matches.</p>
      </div>
      <div className="px-4 py-3">
        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded-md mb-3 text-sm">
            <p>{error}</p>
          </div>
        )}
        
        {userRequest ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-800">Your Transfer Request</h3>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Request for transfer from <span className="font-medium">{userRequest.currentOffice}</span> to <span className="font-medium">{userRequest.preferredOffice || 'Any office'}</span>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-100 pt-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-indigo-600 mr-2" />
                  <h4 className="font-medium text-indigo-800 mb-1 text-sm">Current Location</h4>
                </div>
                <p className="text-sm text-gray-700">{userRequest.currentZone ? `${userRequest.currentZone} (${userRequest.currentDivision})` : 'Not specified'}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-purple-600 mr-2" />
                  <h4 className="font-medium text-purple-800 mb-1 text-sm">Preferred Location</h4>
                </div>
                <p className="text-sm text-gray-700">{userRequest.wantedZone1 ? `${userRequest.wantedZone1} (${userRequest.wantedDivision1})` : 'Any location'}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <FaBuilding className="text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-800 mb-1 text-sm">Grade Pay</h4>
                </div>
                <p className="text-sm text-gray-700">{userRequest.gradePay || 'Not specified'}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <FaPhoneAlt className="text-green-600 mr-2" />
                  <h4 className="font-medium text-green-800 mb-1 text-sm">Contact</h4>
                </div>
                <p className="text-sm text-gray-700">{userRequest.contactNumber || 'Not provided'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-white mx-auto mb-3">
              <FaExchangeAlt className="text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">No Transfer Request Found</h3>
            <p className="text-gray-600 mb-3 text-sm">You haven't created a transfer request yet. Create one to start finding matches!</p>
            <button 
              onClick={() => navigate('/employee-form')} 
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
            >
              Create Transfer Request
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-lg border border-gray-200 p-3 mb-3">
          <h3 className="text-md font-medium text-gray-800 mb-2">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button 
              onClick={() => {
                console.log("Navigating to matches page...");
                navigate('/matches');
              }} 
              className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded hover:bg-indigo-100 text-sm font-medium"
            >
              View Matches
            </button>
            <button 
              onClick={() => navigate('/incoming-requests')} 
              className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded hover:bg-purple-100 text-sm font-medium"
            >
              Check Requests
            </button>
            {userRequest ? (
              <button 
                onClick={() => navigate('/employee-form')} 
                className="bg-green-50 text-green-700 px-3 py-1.5 rounded hover:bg-green-100 text-sm font-medium"
              >
                Edit Request
              </button>
            ) : (
              <button 
                onClick={() => navigate('/employee-form')} 
                className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-100 text-sm font-medium"
              >
                New Request
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
