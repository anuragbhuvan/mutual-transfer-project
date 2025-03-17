import React, { useState } from "react";
import { FaBell, FaUser, FaSignOutAlt, FaEdit, FaTrash, FaPaperPlane, FaCommentAlt, FaCheck, FaTimes, FaBan } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

const CleanSidebar = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  
  const menuItems = [
    { name: "Dashboard", icon: <FaUser className="w-5 h-5 mr-3" /> },
    { name: "Profile", icon: <FaUser className="w-5 h-5 mr-3" /> },
    { name: "Your Transfer Request", icon: <FaEdit className="w-5 h-5 mr-3" /> },
    { name: "Transfer Request Matches", icon: <FaPaperPlane className="w-5 h-5 mr-3" /> },
    { name: "Cyclic Transfer Matches", icon: <FaCheck className="w-5 h-5 mr-3" /> },
    { name: "Requests Received", icon: <FaBell className="w-5 h-5 mr-3" /> },
    { name: "Requests You Accepted", icon: <FaCheck className="w-5 h-5 mr-3" /> },
    { name: "Contact Support", icon: <FaCommentAlt className="w-5 h-5 mr-3" /> }
  ];

  return (
    <div className="w-64 h-screen bg-indigo-600 text-white p-5 fixed">
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-xl font-bold">Indian Rapid</h2>
        <p className="text-sm text-indigo-200">Mutual Transfer</p>
      </div>
      
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li 
            key={item.name}
            className={`flex items-center ${
              activeItem === item.name 
                ? "bg-indigo-700 text-white" 
                : "hover:bg-indigo-500 text-white"
            } p-3 rounded-md cursor-pointer transition-all duration-200`}
            onClick={() => setActiveItem(item.name)}
          >
            {item.icon}
            {item.name}
          </li>
        ))}
      </ul>
      
      <div className="absolute bottom-5 left-0 right-0 px-5">
        <div className="bg-indigo-700 rounded-lg p-3 text-center">
          <p className="text-xs text-indigo-200 mb-1">© 2024 Indian Rapid Mutual Transfer</p>
        </div>
      </div>
    </div>
  );
};

const CleanDashboard = () => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <div className="ml-64 p-8 bg-gray-100 min-h-screen">
      <header className="flex justify-between items-center bg-white p-4 shadow-md rounded-lg">
        <h1 className="text-2xl font-semibold">Transfer Requests Dashboard</h1>
        <div className="flex space-x-4">
          <FaBell className="text-gray-600 text-xl cursor-pointer" />
          <FaUser className="text-gray-600 text-xl cursor-pointer" />
          <FaSignOutAlt className="text-gray-600 text-xl cursor-pointer" onClick={handleLogout} />
        </div>
      </header>
      
      <div className="mt-6 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Your Transfer Request</h2>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-lg font-semibold">Anurag Mishra <span className="text-blue-500">Pending</span></p>
          <p className="text-gray-600">Engineering • Works</p>
          <p className="text-gray-600">JE (Works) • 4200</p>
          <p className="text-gray-600">📞 9821376683</p>
          <p className="text-gray-600 mt-2">South East Central Railway (Raipur) → South East Central Railway (Nagpur)</p>
          <div className="mt-2 flex space-x-4">
            <button className="text-blue-500">Edit</button>
            <button className="text-red-500">Delete</button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Transfer Request Matches</h2>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-lg font-semibold">Sheetal Mishra</p>
          <p className="text-gray-600">Engineering • Works</p>
          <p className="text-gray-600">Current: South East Central Railway (Nagpur)</p>
          <p className="text-gray-600">Wanted: South East Central Railway (Raipur)</p>
          <div className="mt-4 flex space-x-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Send Request</button>
            <button className="bg-gray-300 text-black px-4 py-2 rounded-lg">Message</button>
          </div>
        </div>
        
        <div className="p-4 border rounded-lg bg-gray-50 mt-4">
          <p className="text-lg font-semibold">Rohan Sharma</p>
          <p className="text-gray-600">Engineering • Works</p>
          <p className="text-gray-600">Current: South East Central Railway (Nagpur)</p>
          <p className="text-gray-600">Wanted: South East Central Railway (Raipur)</p>
          <div className="mt-4 flex space-x-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">Send Request</button>
            <button className="bg-gray-300 text-black px-4 py-2 rounded-lg">Message</button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Requests You Received</h2>
        <div className="p-4 border rounded-lg bg-gray-50">
          <p className="text-lg font-semibold">Vijay Kumar</p>
          <p className="text-gray-600">Engineering • Works</p>
          <p className="text-gray-600">Current: South East Central Railway (Bilaspur)</p>
          <p className="text-gray-600">Wanted: South East Central Railway (Raipur)</p>
          <div className="mt-4 flex space-x-4">
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center">
              <FaCheck className="mr-2" /> Accept
            </button>
            <button className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center">
              <FaTimes className="mr-2" /> Reject
            </button>
            <button className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
              <FaBan className="mr-2" /> Block
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CleanApp = () => {
  return (
    <div className="flex">
      <CleanSidebar />
      <CleanDashboard />
    </div>
  );
};

export default CleanApp; 