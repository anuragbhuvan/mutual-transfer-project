import React from "react";
import { Link } from "react-router-dom";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">My Website</h1>
          <div>
            <Link to="/" className="text-gray-600 hover:text-blue-500 px-4">
              Home
            </Link>
            <Link to="/auth" className="text-gray-600 hover:text-blue-500 px-4">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner p-4 text-center text-gray-500">
        © {new Date().getFullYear()} All Rights Reserved.
      </footer>
    </div>
  );
};

export default Layout;
