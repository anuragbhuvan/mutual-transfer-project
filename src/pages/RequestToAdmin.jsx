import React, { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthProvider';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const RequestToAdmin = () => {
  const { currentUser } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dailyRequestCount, setDailyRequestCount] = useState(0);

  // Check daily request limit
  useEffect(() => {
    const checkDailyLimit = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const requestsRef = collection(db, 'adminRequests');
      const q = query(
        requestsRef,
        where('userId', '==', currentUser.uid),
        where('createdAt', '>=', today)
      );
      
      const querySnapshot = await getDocs(q);
      setDailyRequestCount(querySnapshot.size);
    };
    
    checkDailyLimit();
  }, [currentUser.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Check word limits
    const subjectWords = subject.trim().split(/\s+/).length;
    const messageWords = message.trim().split(/\s+/).length;

    if (subjectWords > 50) {
      setError('Subject cannot exceed 50 words');
      setLoading(false);
      return;
    }

    if (messageWords > 50) {
      setError('Message cannot exceed 50 words');
      setLoading(false);
      return;
    }

    // Check daily limit
    if (dailyRequestCount >= 2) {
      setError('You have reached the daily limit of 2 requests');
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'adminRequests'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        subject,
        message,
        status: 'pending',
        createdAt: new Date(),
      });

      setSuccess(true);
      setSubject('');
      setMessage('');
      setDailyRequestCount(prev => prev + 1);
    } catch (err) {
      setError('Failed to send request. Please try again.');
      console.error('Error sending request:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-6">Request to Admin</h2>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Your request has been sent successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600">
        Daily requests remaining: {2 - dailyRequestCount}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject (max 50 words)
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter subject"
            required
          />
          <div className="text-sm text-gray-500 mt-1">
            Words: {subject.trim().split(/\s+/).length}/50
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message (max 50 words)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="6"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter your message"
            required
          />
          <div className="text-sm text-gray-500 mt-1">
            Words: {message.trim().split(/\s+/).length}/50
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || dailyRequestCount >= 2}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            (loading || dailyRequestCount >= 2) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </form>
    </div>
  );
};

export default RequestToAdmin; 