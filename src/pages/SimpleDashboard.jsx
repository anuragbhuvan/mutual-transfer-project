import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaUser, FaSignOutAlt, FaEdit, FaTrash, FaPaperPlane, FaCommentAlt } from "react-icons/fa";

const SimpleSidebar = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  
  const menuItems = [
    "Dashboard",
    "Profile", 
    "Your Transfer Request",
    "Transfer Request Matches",
    "Cyclic Transfer Matches",
    "Request Received",
    "Requests You Accepted",
    "Contact Support"
  ];

  return (
    <div className="w-64 h-screen bg-[#5A4AE3] text-white p-5 fixed">
      <div className="flex flex-col items-center mb-6">
        <h2 className="text-xl font-bold">Indian Rapid</h2>
        <p className="text-sm text-indigo-200">Mutual Transfer</p>
      </div>
      
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li 
            key={item}
            className={`${
              activeItem === item 
                ? "bg-indigo-700 text-white" 
                : "hover:bg-indigo-600 text-[#E0E0E0] hover:text-white"
            } p-3 rounded-md cursor-pointer transition-all duration-200`}
            onClick={() => setActiveItem(item)}
          >
            {item}
          </li>
        ))}
      </ul>
      
      <div className="absolute bottom-5 left-0 right-0 px-5">
        <div className="bg-indigo-700 rounded-lg p-3 text-center">
          <p className="text-xs text-indigo-200 mb-1">© 2024 Indian Rapid Mutual Transfer</p>
          <p className="text-xs text-indigo-200">Your one-stop platform for railway transfers</p>
        </div>
      </div>
    </div>
  );
};

const SimpleDashboard = () => {
  return (
    <div className="ml-64 bg-gray-50 min-h-screen">
      <main className="p-6">
        <div className="max-w-5xl mx-auto">
          {/* Content Cards */}
          <div className="mt-6 dashboard-card">
            <h2 className="text-xl font-semibold mb-4 text-[#374151]">Your Transfer Request</h2>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">Anurag Mishra <span className="badge badge-primary ml-2">Pending</span></p>
                  <p className="text-gray-600">Engineering • Works</p>
                  <p className="text-gray-600">JE (Works) • 4200</p>
                  <p className="text-gray-600">📞 9821376683</p>
                  <p className="text-gray-600 mt-2">South East Central Railway (Raipur) → South East Central Railway (Nagpur)</p>
                </div>
                <div className="flex space-x-2">
                  <button className="btn btn-light flex items-center">
                    <FaEdit className="mr-1" /> Edit
                  </button>
                  <button className="btn btn-light flex items-center text-red-500">
                    <FaTrash className="mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 dashboard-card">
            <h2 className="text-xl font-semibold mb-4 text-[#374151]">Transfer Request Matches</h2>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">Sheetal Mishra</p>
                  <p className="text-gray-600">Engineering • Works</p>
                  <p className="text-gray-600">Current: South East Central Railway (Nagpur)</p>
                  <p className="text-gray-600">Wanted: South East Central Railway (Raipur)</p>
                </div>
                <div className="flex space-x-2">
                  <button className="btn btn-primary flex items-center">
                    <FaPaperPlane className="mr-1" /> Send Request
                  </button>
                  <button className="btn btn-light flex items-center">
                    <FaCommentAlt className="mr-1" /> Message
                  </button>
                </div>
              </div>
            </div>
            
            {/* Additional Match Example */}
            <div className="p-4 border rounded-lg bg-gray-50 mt-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">Rohan Sharma</p>
                  <p className="text-gray-600">Engineering • Works</p>
                  <p className="text-gray-600">Current: South East Central Railway (Nagpur)</p>
                  <p className="text-gray-600">Wanted: South East Central Railway (Raipur)</p>
                </div>
                <div className="flex space-x-2">
                  <button className="btn btn-primary flex items-center">
                    <FaPaperPlane className="mr-1" /> Send Request
                  </button>
                  <button className="btn btn-light flex items-center">
                    <FaCommentAlt className="mr-1" /> Message
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 dashboard-card">
            <h2 className="text-xl font-semibold mb-4 text-[#374151]">Requests You Received</h2>
            <div className="p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">Vijay Kumar</p>
                  <p className="text-gray-600">Engineering • Works</p>
                  <p className="text-gray-600">Current: South East Central Railway (Bilaspur)</p>
                  <p className="text-gray-600">Wanted: South East Central Railway (Raipur)</p>
                </div>
                <div className="flex space-x-2">
                  <button className="accept-btn flex items-center">
                    <FaCheck className="mr-1" /> Accept
                  </button>
                  <button className="reject-btn flex items-center">
                    <FaTimes className="mr-1" /> Reject
                  </button>
                  <button className="block-btn flex items-center">
                    <FaBan className="mr-1" /> Block
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const SimpleApp = () => {
  return (
    <div className="flex">
      <SimpleSidebar />
      <SimpleDashboard />
    </div>
  );
};

export default SimpleApp; 