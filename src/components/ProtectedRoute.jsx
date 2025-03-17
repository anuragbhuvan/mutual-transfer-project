import React from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase/config';

const ProtectedRoute = ({ children }) => {
  // If not authenticated, redirect to login
  if (!auth.currentUser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default ProtectedRoute; 