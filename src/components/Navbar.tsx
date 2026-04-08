import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logOut } from '../lib/firebase';
import { Button } from './ui/button';
import { Droplet, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Droplet className="h-6 w-6 text-primary fill-primary" />
              <span className="font-bold text-xl tracking-tight">Roktobondhu</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {currentUser && userProfile ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium hover:text-primary">Dashboard</Link>
                <Link to="/search" className="text-sm font-medium hover:text-primary">Find Donors</Link>
                <Link to="/requests" className="text-sm font-medium hover:text-primary">Emergency Requests</Link>
                <Button variant="ghost" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/login">
                  <Button>Become a Donor</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {currentUser && userProfile ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/search" 
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Find Donors
                </Link>
                <Link 
                  to="/requests" 
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Emergency Requests
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-primary hover:bg-red-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Become a Donor
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
