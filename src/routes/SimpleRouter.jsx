import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SimpleApp from '../pages/SimpleDashboard';

const SimpleRouter = ({ user }) => {
  // Redirect unauthenticated users to login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/simple-dashboard" element={<SimpleApp />} />
      <Route path="*" element={<Navigate to="/simple-dashboard" replace />} />
    </Routes>
  );
};

export default SimpleRouter; 