import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Filter, ArrowUp, MessageCircle } from 'lucide-react'
import { useIssues } from '../contexts/IssueContext'

const Issues = () => {
  const { issues, upvoteIssue, user } = useIssues()
  const [filter, setFilter] = useState('all')
  const [category, setCategory] = useState('all')

  const categories = ['all', 'pothole', 'garbage', 'streetlight', 'traffic-signal', 'parks', 'sidewalk', 'other']
  const statuses = ['all', 'reported', 'acknowledged', 'in-progress', 'resolved']

  const filteredIssues = issues.filter(issue => {
    if (!issue) return false // Add safety check
    const statusMatch = filter === 'all' || issue.status === filter
    const categoryMatch = category === 'all' || issue.category === category
    return statusMatch && categoryMatch
  })

  const handleUpvote = async (issueId) => {
  if (!user) {
    alert('Please login to upvote issues')
    return
  }
  
  try {
    console.log('🎯 Upvoting issue:', issueId)
    await upvoteIssue(issueId)
    console.log('✅ Upvote completed for issue:', issueId)
  } catch (error) {
    console.error('❌ Error upvoting:', error)
    alert(error.response?.data?.message || error.message || 'Error upvoting issue')
  }
}

  const getStatusColor = (status) => {
    switch (status) {
      case 'reported': return 'bg-yellow-100 text-yellow-800'
      case 'acknowledged': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-orange-100 text-orange-800'
      case 'resolved': return 'bg-resolved text-white'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 lg:mb-0">Community Issues</h1>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
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

        <div className="grid gap-6">
          {filteredIssues.map((issue) => {
            if (!issue) return null // Safety check
            
            return (
              <div key={issue.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-primary transition-colors"
                      >
                        {issue.title}
                      </Link>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status?.replace('-', ' ') || 'Unknown'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{issue.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="capitalize bg-gray-100 px-3 py-1 rounded-full">
                        {issue.category || 'unknown'}
                      </span>
                      <span>{issue.location_address || 'No address'}</span>
                      <span>{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Unknown date'}</span>
                      <span>Reported by {issue.users?.name || issue.reporter_id || 'Anonymous'}</span>
                    </div>
                  </div>

                  <div className="flex lg:flex-col items-center lg:items-end space-x-4 lg:space-x-0 lg:space-y-2 mt-4 lg:mt-0 lg:ml-6">
                    <button
                      onClick={() => handleUpvote(issue.id)}
                      className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                    >
                      <ArrowUp className="h-4 w-4" />
                      <span>{issue.upvotes || 0}</span>
                    </button>
                    
                    <Link
                      to={`/issues/${issue.id}`}
                      className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{issue.comments?.length || 0}</span>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredIssues.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No issues found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Issues

