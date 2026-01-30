import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, ArrowUp, MessageCircle, Calendar, Filter } from 'lucide-react'
import { useIssues } from '../contexts/IssueContext'

const Dashboard = () => {
  const { user, issues, fetchIssues } = useIssues()
  const [userIssues, setUserIssues] = useState([])
  const [activeTab, setActiveTab] = useState('reported')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (user && issues.length > 0) {
      const reported = issues.filter(issue => issue.reporter?._id === user.id)
      setUserIssues(reported)
    }
  }, [user, issues])

  const filteredIssues = userIssues.filter(issue => 
    statusFilter === 'all' || issue.status === statusFilter
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800'
      case 'acknowledged': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-resolved text-white'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStats = () => {
    const reported = userIssues.length
    const resolved = userIssues.filter(issue => issue.status === 'resolved').length
    const inProgress = userIssues.filter(issue => issue.status === 'in-progress').length
    const totalUpvotes = userIssues.reduce((sum, issue) => sum + (issue.upvotes || 0), 0)

    return { reported, resolved, inProgress, totalUpvotes }
  }

  const stats = getStats()

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to view your dashboard.</p>
          <div className="flex space-x-4 justify-center">
            <Link
              to="/login"
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="border border-primary text-primary px-6 py-2 rounded-lg hover:bg-blue-50"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your reported issues and community impact.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reported</p>
              <p className="text-2xl font-bold text-gray-900">{stats.reported}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-resolved">{stats.resolved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-resolved" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <MessageCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Upvotes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUpvotes}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ArrowUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Issues Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 lg:mb-0">Your Reported Issues</h2>
          
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="reported">Reported</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            
            <Link
              to="/report"
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Report New Issue
            </Link>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-600 mb-6">
              {userIssues.length === 0 
                ? "You haven't reported any issues yet."
                : "No issues match your current filter."
              }
            </p>
            {userIssues.length === 0 && (
              <Link
                to="/report"
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Report Your First Issue
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIssues.map((issue) => (
              <div key={issue._id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Link
                        to={`/issues/${issue._id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-primary transition-colors"
                      >
                        {issue.title}
                      </Link>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('-', ' ')}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{issue.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="capitalize bg-gray-100 px-3 py-1 rounded-full">
                        {issue.category}
                      </span>
                      <span>{issue.location.address}</span>
                      <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex lg:flex-col items-center lg:items-end space-x-4 lg:space-x-0 lg:space-y-2 mt-4 lg:mt-0 lg:ml-6">
                    <div className="flex items-center space-x-1 bg-gray-100 px-3 py-2 rounded-lg">
                      <ArrowUp className="h-4 w-4" />
                      <span>{issue.upvotes || 0}</span>
                    </div>
                    
                    <Link
                      to={`/issues/${issue._id}`}
                      className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{issue.comments?.length || 0}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard


