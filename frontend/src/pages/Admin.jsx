import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Search, Eye, Edit, Trash2, User, MapPin, Calendar, Shield, BarChart3, TrendingUp, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useIssues } from '../contexts/IssueContext'

const Admin = () => {
  const { issues, user, updateIssueStatus } = useIssues()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [timeFilter, setTimeFilter] = useState('all') // all, today, week, month

  // Redirect non-admin users
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/')
    }
  }, [user, navigate])

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Final check for admin role
  if (user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Administrator privileges required to access this page.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  const categories = ['all', 'pothole', 'garbage', 'streetlight', 'traffic-signal', 'parks', 'sidewalk', 'other']
  const statuses = ['all', 'reported', 'acknowledged', 'in-progress', 'resolved']
  const timeFilters = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ]

  // Filter issues by time
  const filterIssuesByTime = (issues) => {
    const now = new Date()
    switch (timeFilter) {
      case 'today':
        return issues.filter(issue => {
          const issueDate = new Date(issue.createdAt)
          return issueDate.toDateString() === now.toDateString()
        })
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return issues.filter(issue => new Date(issue.createdAt) >= weekAgo)
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return issues.filter(issue => new Date(issue.createdAt) >= monthAgo)
      default:
        return issues
    }
  }

  const timeFilteredIssues = filterIssuesByTime(issues)

  const filteredIssues = timeFilteredIssues.filter(issue => {
    const statusMatch = statusFilter === 'all' || issue.status === statusFilter
    const categoryMatch = categoryFilter === 'all' || issue.category === categoryFilter
    const searchMatch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       issue.location.address.toLowerCase().includes(searchTerm.toLowerCase())
    
    return statusMatch && categoryMatch && searchMatch
  })

  // Analytics Data
  const getStatusCount = (status) => {
    return timeFilteredIssues.filter(issue => issue.status === status).length
  }

  const getCategoryCount = (category) => {
    return timeFilteredIssues.filter(issue => issue.category === category).length
  }

  const getTopReporters = () => {
    const reporterCount = {}
    timeFilteredIssues.forEach(issue => {
      const reporterName = issue.reporter?.name || 'Anonymous'
      reporterCount[reporterName] = (reporterCount[reporterName] || 0) + 1
    })
    return Object.entries(reporterCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  const getResolutionRate = () => {
    const resolved = timeFilteredIssues.filter(issue => issue.status === 'resolved').length
    const total = timeFilteredIssues.length
    return total > 0 ? Math.round((resolved / total) * 100) : 0
  }

  const getAverageResolutionTime = () => {
    const resolvedIssues = timeFilteredIssues.filter(issue => issue.status === 'resolved')
    if (resolvedIssues.length === 0) return 0
    
    const totalTime = resolvedIssues.reduce((sum, issue) => {
      const created = new Date(issue.createdAt)
      const updated = new Date(issue.updatedAt)
      return sum + (updated - created)
    }, 0)
    
    return Math.round(totalTime / resolvedIssues.length / (1000 * 60 * 60 * 24)) // Convert to days
  }

  const stats = {
    total: timeFilteredIssues.length,
    reported: getStatusCount('reported'),
    acknowledged: getStatusCount('acknowledged'),
    inProgress: getStatusCount('in-progress'),
    resolved: getStatusCount('resolved'),
    resolutionRate: getResolutionRate(),
    avgResolutionTime: getAverageResolutionTime(),
    urgentIssues: timeFilteredIssues.filter(issue => issue.upvotes > 10).length
  }

  const categoryStats = categories.filter(cat => cat !== 'all').map(category => ({
    name: category,
    count: getCategoryCount(category),
    percentage: timeFilteredIssues.length > 0 ? Math.round((getCategoryCount(category) / timeFilteredIssues.length) * 100) : 0
  }))

  const topReporters = getTopReporters()

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await updateIssueStatus(issueId, newStatus)
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating issue status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'acknowledged': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in-progress': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'resolved': return 'bg-resolved text-white border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Comprehensive overview of all reported issues and system analytics</p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700 font-medium">Administrator</span>
          </div>
        </div>
      </div>

      {/* Time Filter */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">Analytics Period</h2>
          <div className="flex flex-wrap gap-2">
            {timeFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeFilter === filter.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">{timeFilters.find(f => f.value === timeFilter)?.label}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
              <p className="text-2xl font-bold text-resolved">{stats.resolutionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Issues resolved</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-resolved" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Resolution Time</p>
              <p className="text-2xl font-bold text-orange-600">{stats.avgResolutionTime}d</p>
              <p className="text-xs text-gray-500 mt-1">Days to resolve</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Urgent Issues</p>
              <p className="text-2xl font-bold text-red-600">{stats.urgentIssues}</p>
              <p className="text-xs text-gray-500 mt-1">10+ upvotes</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <div className="space-y-3">
            {[
              { status: 'reported', label: 'Reported', color: 'bg-yellow-500', count: stats.reported },
              { status: 'acknowledged', label: 'Acknowledged', color: 'bg-blue-500', count: stats.acknowledged },
              { status: 'in-progress', label: 'In Progress', color: 'bg-orange-500', count: stats.inProgress },
              { status: 'resolved', label: 'Resolved', color: 'bg-resolved', count: stats.resolved }
            ].map(item => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({timeFilteredIssues.length > 0 ? Math.round((item.count / timeFilteredIssues.length) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <div className="space-y-3">
            {categoryStats
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
              .map(category => (
                <div key={category.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{category.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{category.count}</span>
                    <span className="text-xs text-gray-500 ml-2">({category.percentage}%)</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Reporters */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Reporters</h3>
          <div className="space-y-3">
            {topReporters.map(([reporter, count], index) => (
              <div key={reporter} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{reporter}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count} issues</span>
              </div>
            ))}
            {topReporters.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No reporter data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Issues Management */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Issues Management</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Issues Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upvotes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssues.map((issue) => (
                <tr key={issue._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{issue.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{issue.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded-full">
                      {issue.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{issue.reporter?.name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">{issue.upvotes || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                      className={`text-sm font-medium rounded-full px-3 py-1 border focus:outline-none focus:ring-2 focus:ring-primary ${getStatusColor(issue.status)}`}
                    >
                      <option value="reported">Reported</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.open(`/issues/${issue._id}`, '_blank')}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete Issue"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this issue?')) {
                            // Add delete functionality here
                            console.log('Delete issue:', issue._id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredIssues.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-600">
              {timeFilteredIssues.length === 0 
                ? "No issues have been reported in the selected period."
                : "No issues match your current filters."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin