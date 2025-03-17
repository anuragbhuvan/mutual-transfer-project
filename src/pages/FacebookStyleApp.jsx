import React, { useState } from "react";
import { FaHome, FaUserFriends, FaVideo, FaStore, FaUsers, FaBell, FaFacebookMessenger, FaUserCircle, FaSearch, FaThumbsUp, FaComment, FaShare, FaGlobe, FaEllipsisH } from "react-icons/fa";

const FacebookStyleApp = () => {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left */}
          <div className="flex items-center">
            <h1 className="text-indigo-600 text-3xl font-bold">Indian Rapid</h1>
            <div className="ml-2 relative">
              <input
                type="text"
                placeholder="Search Indian Rapid Mutual Transfer"
                className="bg-gray-100 rounded-full py-2 pl-10 pr-4 w-60 focus:outline-none"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-500" />
            </div>
          </div>

          {/* Center */}
          <div className="flex items-center space-x-2">
            <NavButton
              icon={<FaHome size={25} />}
              active={activeTab === "home"}
              onClick={() => setActiveTab("home")}
            />
            <NavButton
              icon={<FaUserFriends size={25} />}
              active={activeTab === "friends"}
              onClick={() => setActiveTab("friends")}
            />
            <NavButton
              icon={<FaVideo size={25} />}
              active={activeTab === "watch"}
              onClick={() => setActiveTab("watch")}
            />
            <NavButton
              icon={<FaStore size={25} />}
              active={activeTab === "marketplace"}
              onClick={() => setActiveTab("marketplace")}
            />
            <NavButton
              icon={<FaUsers size={25} />}
              active={activeTab === "groups"}
              onClick={() => setActiveTab("groups")}
            />
          </div>

          {/* Right */}
          <div className="flex items-center space-x-2">
            <IconButton icon={<FaEllipsisH size={18} />} />
            <IconButton icon={<FaFacebookMessenger size={18} />} />
            <IconButton icon={<FaBell size={18} />} />
            <div className="ml-2">
              <FaUserCircle size={40} className="text-gray-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 pb-8 px-4">
        <div className="flex max-w-7xl mx-auto">
          {/* Left Sidebar */}
          <div className="w-1/4 pr-4 fixed left-4 top-20">
            <div className="space-y-1">
              <SidebarItem icon={<FaUserCircle size={36} />} text="Anurag Mishra" />
              <SidebarItem icon={<FaUserFriends size={20} />} text="Railway Friends" />
              <SidebarItem icon={<FaUsers size={20} />} text="Transfer Groups" />
              <SidebarItem icon={<FaStore size={20} />} text="Transfer Marketplace" />
              <SidebarItem icon={<FaVideo size={20} />} text="Railway Videos" />
              <div className="border-t border-gray-300 my-2 pt-2">
                <h3 className="font-medium text-gray-500 mb-2">Your Transfer Requests</h3>
                <SidebarItem icon={<div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">S</div>} text="South Eastern Railway" />
                <SidebarItem icon={<div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">N</div>} text="Northern Railway" />
                <SidebarItem icon={<div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">W</div>} text="Western Railway" />
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="w-2/4 mx-auto">
            {/* Create Post */}
            <div className="bg-white rounded-lg shadow mb-4 p-4">
              <div className="flex items-center space-x-2 mb-4">
                <FaUserCircle size={40} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="What's on your mind about transfers, Anurag?"
                  className="bg-gray-100 rounded-full py-2 px-4 w-full focus:outline-none"
                />
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <button className="flex items-center text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">
                    <FaVideo className="text-red-500 mr-2" /> Live Video
                  </button>
                  <button className="flex items-center text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">
                    <FaStore className="text-green-500 mr-2" /> Transfer Request
                  </button>
                  <button className="flex items-center text-gray-500 hover:bg-gray-100 px-2 py-1 rounded">
                    <FaUserFriends className="text-purple-500 mr-2" /> Tag Railways
                  </button>
                </div>
              </div>
            </div>

            {/* Posts */}
            <Post
              user="Sheetal Mishra"
              time="3 hours ago"
              content="Just submitted my transfer request from South Eastern Railway (Nagpur) to South Eastern Railway (Raipur). Anyone looking for a mutual transfer?"
              likes={24}
              comments={5}
              shares={2}
            />

            <Post
              user="Railway Transfers Group"
              time="5 hours ago"
              content="Good news for Engineering Works department! New mutual transfer policy announced that will make the process faster. Check the attached document for details."
              likes={152}
              comments={48}
              shares={76}
              isGroup={true}
            />

            <Post
              user="Rohan Sharma"
              time="Yesterday at 10:45 AM"
              content="After 2 years of waiting, my mutual transfer from Western Railway to Northern Railway has been approved! So happy! Thank you everyone who helped me in this journey."
              likes={348}
              comments={87}
              shares={12}
            />
          </div>

          {/* Right Sidebar */}
          <div className="w-1/4 pl-4 fixed right-4 top-20">
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <h3 className="font-medium text-gray-700 mb-3">Transfer Requests Matches</h3>
              <div className="space-y-3">
                <ContactItem name="Vijay Kumar" status="Bilaspur → Raipur" />
                <ContactItem name="Priya Singh" status="Delhi → Mumbai" />
                <ContactItem name="Rajesh Gupta" status="Chennai → Hyderabad" />
                <ContactItem name="Anil Sharma" status="Kolkata → Patna" />
                <ContactItem name="Sunita Patel" status="Ahmedabad → Surat" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-medium text-gray-700 mb-3">Recent Transfers</h3>
              <div className="space-y-3">
                <div className="text-sm">
                  <p><span className="font-medium">Rahul Verma</span> got transferred from Central to Western Railway</p>
                  <p className="text-gray-500 text-xs">2 days ago</p>
                </div>
                <div className="text-sm">
                  <p><span className="font-medium">Meena Sharma</span> got transferred from Southern to South Central Railway</p>
                  <p className="text-gray-500 text-xs">5 days ago</p>
                </div>
                <div className="text-sm">
                  <p><span className="font-medium">Prakash Jha</span> got transferred from Eastern to North Eastern Railway</p>
                  <p className="text-gray-500 text-xs">1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const NavButton = ({ icon, active, onClick }) => {
  return (
    <button
      className={`px-10 py-2 rounded-md ${
        active ? "border-b-4 border-indigo-500 text-indigo-500" : "text-gray-500 hover:bg-gray-100"
      }`}
      onClick={onClick}
    >
      {icon}
    </button>
  );
};

const IconButton = ({ icon }) => {
  return (
    <button className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-300">
      {icon}
    </button>
  );
};

const SidebarItem = ({ icon, text }) => {
  return (
    <div className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded-lg cursor-pointer">
      {icon}
      <span className="font-medium">{text}</span>
    </div>
  );
};

const ContactItem = ({ name, status }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold mr-2">
          {name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-sm">{name}</p>
          <p className="text-gray-500 text-xs">{status}</p>
        </div>
      </div>
      <button className="text-indigo-500 text-sm hover:bg-indigo-50 px-2 py-1 rounded">Match</button>
    </div>
  );
};

const Post = ({ user, time, content, likes, comments, shares, isGroup = false }) => {
  return (
    <div className="bg-white rounded-lg shadow mb-4">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full ${isGroup ? "bg-blue-500" : "bg-indigo-500"} flex items-center justify-center text-white font-bold mr-3`}>
              {user.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{user}</p>
              <div className="flex items-center text-gray-500 text-sm">
                <span>{time}</span>
                <span className="mx-1">•</span>
                <FaGlobe />
              </div>
            </div>
          </div>
          <button className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
            <FaEllipsisH />
          </button>
        </div>
        <div className="mt-3">
          <p className="text-gray-800">{content}</p>
        </div>
      </div>
      
      <div className="px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-gray-500 text-sm mb-2">
          <div>
            <span className="inline-flex items-center">
              <div className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center mr-1">
                <FaThumbsUp size={10} />
              </div>
              {likes}
            </span>
          </div>
          <div>
            <span>{comments} comments</span>
            <span className="mx-2">•</span>
            <span>{shares} shares</span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-1 flex justify-between">
          <button className="flex items-center justify-center w-1/3 p-2 text-gray-500 hover:bg-gray-100 rounded">
            <FaThumbsUp className="mr-2" /> Like
          </button>
          <button className="flex items-center justify-center w-1/3 p-2 text-gray-500 hover:bg-gray-100 rounded">
            <FaComment className="mr-2" /> Comment
          </button>
          <button className="flex items-center justify-center w-1/3 p-2 text-gray-500 hover:bg-gray-100 rounded">
            <FaShare className="mr-2" /> Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacebookStyleApp; 