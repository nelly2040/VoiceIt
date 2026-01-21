import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MapPin, Plus, List, User, LogOut, Settings } from 'lucide-react'
import { useIssues } from '../contexts/IssueContext'

const Navbar = () => {
  const { user, logout } = useIssues()
  const location = useLocation()

  const navItems = [
    { path: '/', icon: MapPin, label: 'Map' },
    { path: '/report', icon: Plus, label: 'Report' },
    { path: '/issues', icon: List, label: 'Issues' },
  ]

  // Add Admin link for admin users
  if (user && user.role === 'admin') {
    navItems.push({ path: '/admin', icon: Settings, label: 'Admin' })
  }

  return (
    <nav className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <MapPin className="h-8 w-8" />
            <span className="font-bold text-xl">VoiceIt</span>
          </Link>

          <div className="flex space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-white text-primary' : 'hover:bg-primary-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

