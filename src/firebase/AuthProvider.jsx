import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from './config';
import { onAuthStateChanged } from 'firebase/auth';

// Create auth context
export const AuthContext = createContext(null);

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state observer
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      console.log("Auth state changed:", user ? `User logged in: ${user.email}` : "No user logged in");
    });

    // Clean up on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 