import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Lazy load pages for better performance
const Auth = lazy(() => import('../pages/Auth'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const EmployeeForm = lazy(() => import('../pages/EmployeeForm'));
const Profile = lazy(() => import('../pages/Profile'));
const Matches = lazy(() => import('../pages/Matches'));
const CyclicMatches = lazy(() => import('../pages/CyclicMatches'));
const Notifications = lazy(() => import('../pages/Notifications'));
const RequestReceived = lazy(() => import('../components/RequestReceived'));
const IncomingRequests = lazy(() => import('../pages/IncomingRequests'));
const MyAcceptedRequests = lazy(() => import('../pages/MyAcceptedRequests'));
const MyRejectedRequests = lazy(() => import('../pages/MyRejectedRequests'));
const BlockedUsers = lazy(() => import('../pages/BlockedUsers'));
const AcceptedByOthers = lazy(() => import('../pages/AcceptedByOthers'));

// Loading Fallbacks
const PageLoadingFallback = () => (
  <div className="animate-pulse h-96 bg-white rounded-lg shadow-md m-4">
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="ml-3 text-indigo-600 font-medium">Loading...</p>
    </div>
  </div>
);

const AuthLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[70vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const AppRouter = ({ user, activeSection }) => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Suspense fallback={<AuthLoadingFallback />}>
              <Auth />
            </Suspense>
          )
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <Dashboard activeSection={activeSection} />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employee-form" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <EmployeeForm />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/matches" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <Matches />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/cyclic-matches" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <CyclicMatches />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <Notifications />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-request" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <EmployeeForm />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/requests-received" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <RequestReceived />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/incoming-requests" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <IncomingRequests />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-accepted-requests" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <MyAcceptedRequests />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-rejected-requests" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <MyRejectedRequests />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/blocked-users" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <BlockedUsers />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/accepted-by-others" 
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoadingFallback />}>
              <AcceptedByOthers />
            </Suspense>
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default AppRouter; 