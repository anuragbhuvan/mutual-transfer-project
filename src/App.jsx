import React, { Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Auth from './components/Auth';

function App() {
  return (
    <Router>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }>
        <div className="min-h-screen bg-gray-100">
          <Auth />
        </div>
      </Suspense>
    </Router>
  );
}

export default App; 