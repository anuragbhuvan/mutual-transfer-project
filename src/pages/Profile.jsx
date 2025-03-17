import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { FaUserEdit, FaSave, FaLock, FaEnvelope, FaExclamationTriangle, FaEdit, FaUser, FaPhone, FaBriefcase, FaBuilding, FaFileAlt, FaCalendarAlt, FaMapMarkerAlt, FaGoogle, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../firebase/AuthProvider';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  const [userData, setUserData] = useState({
    displayName: "",
    email: "",
    phoneNumber: "",
    designation: "",
    department: "",
    gradeLevel: "",
    joiningDate: "",
    currentOffice: "",
    currentLocation: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Set default to false for Google user detection  
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Add debugging information
  console.log("Profile component loaded");
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      console.log("Fetching user data...");
      setLoading(true);
      setError("");
      
      try {
        if (!currentUser) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }
        
        // Get user document from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            displayName: data.displayName || currentUser.displayName || "",
            email: currentUser.email || "",
            phoneNumber: data.phoneNumber || "",
            designation: data.designation || "",
            department: data.department || "",
            gradeLevel: data.gradeLevel || "",
            joiningDate: data.joiningDate || "",
            currentOffice: data.currentOffice || "",
            currentLocation: data.currentLocation || "",
          });
        } else {
          // If no user document, initialize with auth data
          setUserData({
            displayName: currentUser.displayName || "",
            email: currentUser.email || "",
            phoneNumber: currentUser.phoneNumber || "",
            designation: "",
            department: "",
            gradeLevel: "",
            joiningDate: "",
            currentOffice: "",
            currentLocation: "",
          });
        }
        
        // Check if user is signed in with Google
        // Improved Google detection - check email, provider, and other signals
        const providerData = currentUser.providerData || [];
        let isGoogle = providerData.some(provider => provider.providerId === 'google.com');
        
        // Additional check: emails ending with gmail.com are likely Google accounts
        if (!isGoogle && currentUser.email && currentUser.email.toLowerCase().endsWith('@gmail.com')) {
          console.log("Detected potential Google account based on email");
          isGoogle = true;
        }
        
        // Additional check: if the user has no password, they might be using OAuth
        if (!isGoogle && !currentUser.providerData.some(provider => provider.providerId === 'password')) {
          console.log("Detected OAuth account (no password provider)");
          isGoogle = true;
        }
        
        // Log provider data for debugging
        console.log("Is Google user:", isGoogle);
        console.log("Provider data:", JSON.stringify(providerData));
        console.log("Current user:", currentUser.email);
        console.log("Provider IDs:", providerData.map(p => p.providerId));
        
        setIsGoogleUser(isGoogle);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load profile data: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
  };
  
  // Handle password changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };
  
  // Save profile data
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      if (!currentUser) {
        setError("User not authenticated");
        return;
      }
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        designation: userData.designation,
        department: userData.department,
        gradeLevel: userData.gradeLevel,
        joiningDate: userData.joiningDate,
        currentOffice: userData.currentOffice,
        currentLocation: userData.currentLocation,
        updatedAt: new Date(),
      });
      
      // Update email if changed
      if (userData.email !== currentUser.email) {
        await updateEmail(currentUser, userData.email);
      }
      
      // Update display name in Auth profile
      if (userData.displayName !== currentUser.displayName) {
        await updateProfile(currentUser, {
          displayName: userData.displayName
        });
      }
      
      setSuccess("Profile updated successfully!");
      setIsEditing(false); // Exit edit mode after successful save
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Problem updating profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      // Validate new password
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("New passwords do not match");
        setSaving(false);
        return;
      }
      
      if (isGoogleUser) {
        setError("Google users cannot change their password through this app. Please update your password in your Google account settings.");
        setSaving(false);
        return;
      }
      
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, passwordData.newPassword);
      
      // Reset password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      
      setSuccess("Password changed successfully!");
      setShowPasswordSection(false); // Hide password section after successful change
    } catch (err) {
      console.error("Error changing password:", err);
      if (err.code === 'auth/wrong-password') {
        setError("Current password is incorrect");
      } else {
        setError("Problem changing password: " + err.message);
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    // Reset error and success messages when toggling edit mode
    setError("");
    setSuccess("");
  };
  
  // Toggle password section
  const togglePasswordSection = () => {
    setShowPasswordSection(!showPasswordSection);
    // Reset password fields and error/success messages when toggling section
    if (!showPasswordSection) {
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setError("");
      setSuccess("");
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Test indicator */}
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 text-center">
        <strong>Test Mode:</strong> Google User Message Testing - Updated Version
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FaUser className="mr-2 text-indigo-600" />
          My Profile
        </h1>
        
        <div className="space-x-3">
          {!isEditing && (
            <button
              onClick={toggleEditMode}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              <FaEdit className="mr-2" /> Edit Profile
            </button>
          )}
          
          {!isGoogleUser && !isEditing && !showPasswordSection && (
            <button
              onClick={togglePasswordSection}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center"
            >
              <FaLock className="mr-2" /> Change Password
            </button>
          )}
          
          {isGoogleUser && !isEditing && !showPasswordSection && (
            <div className="flex items-center">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md flex items-center cursor-not-allowed"
                disabled
              >
                <FaLock className="mr-2" /> Change Password
              </button>
              <div className="ml-3 flex items-center bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-md shadow-sm">
                <FaGoogle className="text-red-500 mr-2" size={14} />
                <span className="text-sm font-medium text-yellow-800">
                  Google users: <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Manage password in Google Settings</a>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Error and Success messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
          <FaExclamationTriangle className="mr-2 mt-0.5 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-start">
          <FaCheckCircle className="mr-2 mt-0.5 text-green-500" />
          <span>{success}</span>
        </div>
      )}
      
      {/* View/Edit Profile Section */}
      {!showPasswordSection && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Profile Information</h2>
          
          {isEditing ? (
            <form onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <FaUser className="inline mr-1 text-indigo-500" /> Name
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    value={userData.displayName}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <FaEnvelope className="inline mr-1 text-indigo-500" /> Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${isGoogleUser ? 'bg-gray-100' : ''}`}
                    disabled={isGoogleUser}
                  />
                  {isGoogleUser && (
                    <p className="text-xs text-gray-500 mt-1">Google account email cannot be changed</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <FaPhone className="inline mr-1 text-indigo-500" /> Phone Number
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={userData.phoneNumber}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <FaBriefcase className="inline mr-1 text-indigo-500" /> Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={userData.designation}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <FaBuilding className="inline mr-1 text-indigo-500" /> Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={userData.department}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <FaFileAlt className="inline mr-1 text-indigo-500" /> Grade Level
                  </label>
                  <input
                    type="text"
                    name="gradeLevel"
                    value={userData.gradeLevel}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <FaCalendarAlt className="inline mr-1 text-indigo-500" /> Joining Date
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={userData.joiningDate}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <FaBuilding className="inline mr-1 text-indigo-500" /> Current Office
                  </label>
                  <input
                    type="text"
                    name="currentOffice"
                    value={userData.currentOffice}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <FaMapMarkerAlt className="inline mr-1 text-indigo-500" /> Current Location
                  </label>
                  <input
                    type="text"
                    name="currentLocation"
                    value={userData.currentLocation}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={toggleEditMode}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center"
                >
                  {saving ? (
                    <span className="inline-block mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  ) : (
                    <FaSave className="mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="space-y-1">
                <p className="text-sm text-gray-500"><FaUser className="inline mr-1 text-indigo-500" /> Name</p>
                <p className="font-medium">{userData.displayName || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500"><FaEnvelope className="inline mr-1 text-indigo-500" /> Email</p>
                <p className="font-medium">{userData.email || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500"><FaPhone className="inline mr-1 text-indigo-500" /> Phone Number</p>
                <p className="font-medium">{userData.phoneNumber || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500"><FaBriefcase className="inline mr-1 text-indigo-500" /> Designation</p>
                <p className="font-medium">{userData.designation || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500"><FaBuilding className="inline mr-1 text-indigo-500" /> Department</p>
                <p className="font-medium">{userData.department || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500"><FaFileAlt className="inline mr-1 text-indigo-500" /> Grade Level</p>
                <p className="font-medium">{userData.gradeLevel || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500"><FaCalendarAlt className="inline mr-1 text-indigo-500" /> Joining Date</p>
                <p className="font-medium">{userData.joiningDate || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500"><FaBuilding className="inline mr-1 text-indigo-500" /> Current Office</p>
                <p className="font-medium">{userData.currentOffice || 'Not set'}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-500"><FaMapMarkerAlt className="inline mr-1 text-indigo-500" /> Current Location</p>
                <p className="font-medium">{userData.currentLocation || 'Not set'}</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Password Change Section */}
      {showPasswordSection && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center">
              <FaLock className="mr-2 text-indigo-600" />
              Change Password
            </h2>
            <button 
              onClick={togglePasswordSection}
              className="text-gray-500 hover:text-gray-700"
            >
              Back to Profile
            </button>
          </div>
          
          {isGoogleUser ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md relative shadow-md">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-yellow-500 mr-3 text-2xl flex-shrink-0" />
                <div>
                  <p className="font-bold text-yellow-800 text-lg">
                    Google Account Users
                  </p>
                  <p className="font-medium text-yellow-700 mt-1">
                    Password changes can only be made through Google Account Settings
                  </p>
                  <a 
                    href="https://myaccount.google.com/security" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-3 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium"
                  >
                    Go to Google Security Settings
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  minLength="6"
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  minLength="6"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center"
                >
                  {saving ? (
                    <span className="inline-block mr-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  ) : (
                    <FaLock className="mr-2" />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile; 