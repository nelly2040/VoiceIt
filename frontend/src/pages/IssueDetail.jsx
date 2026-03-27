import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { ArrowUp, MessageCircle, Calendar, MapPin, User, Send } from 'lucide-react'
import { useIssues } from '../contexts/IssueContext'
import axios from 'axios'

const IssueDetail = () => {
  const { id } = useParams()
  const { user, upvoteIssue } = useIssues()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    fetchIssue()
  }, [id])

  const fetchIssue = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/issues/${id}`)
      setIssue(response.data)
    } catch (error) {
      console.error('Error fetching issue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpvote = async () => {
  if (!user) {
    alert('Please login to upvote issues')
    return
  }
  
  try {
    console.log('🎯 Upvoting issue from detail page:', id)
    const updatedIssue = await upvoteIssue(id)
    setIssue(updatedIssue)
    console.log('✅ Upvote completed for issue:', id)
  } catch (error) {
    console.error('❌ Error upvoting:', error)
    alert(error.response?.data?.message || error.message || 'Error upvoting issue')
  }
}

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !user) return

    setSubmittingComment(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/issues/${id}/comments`, {
        text: commentText
      })
      setIssue(response.data)
      setCommentText('')
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Error adding comment. Please try again.')
    } finally {
      setSubmittingComment(false)
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Issue Not Found</h2>
          <p className="text-gray-600 mb-6">The issue you're looking for doesn't exist.</p>
          <Link
            to="/issues"
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Issues
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Header */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{issue.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className={`px-3 py-1 rounded-full font-medium ${getStatusColor(issue.status)}`}>
                    {issue.status?.replace('-', ' ') || 'Unknown'}
                  </span>
                  <span className="capitalize bg-gray-100 px-3 py-1 rounded-full">
                    {issue.category}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleUpvote}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  user && issue.upvotedBy?.includes(user.id)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <ArrowUp className="h-5 w-5" />
                <span className="font-semibold">{issue.upvotes || 0}</span>
              </button>
            </div>

            <p className="text-gray-700 text-lg leading-relaxed mb-6">{issue.description}</p>

            <div className="flex items-center text-sm text-gray-600">
              <User className="h-4 w-4 mr-2" />
              <span>Reported by {issue.users?.name || 'Anonymous'}</span>
            </div>
          </div>

          {/* Location Map */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location
            </h2>
            <div className="h-64 rounded-lg overflow-hidden">
              <MapContainer
                center={[issue.latitude || -1.2921, issue.longitude || 36.8219]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[issue.latitude || -1.2921, issue.longitude || 36.8219]}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold">{issue.title}</h3>
                      <p className="text-sm text-gray-600">{issue.location_address}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <p className="text-sm text-gray-600 mt-2">{issue.location_address}</p>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Comments ({issue.comments?.length || 0})
            </h2>

            {/* Add Comment Form */}
            {user ? (
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={submittingComment}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center mb-6">
                <p className="text-gray-600">
                  <Link to="/login" className="text-primary hover:text-blue-700 font-semibold">
                    Sign in
                  </Link>{' '}
                  to add a comment
                </p>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {issue.comments?.length > 0 ? (
                issue.comments.map((comment, index) => (
                  <div key={comment.id || index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {comment.users?.name || comment.user_id || 'Anonymous'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Issue Images */}
          {issue.images && issue.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Photos</h3>
              <div className="grid grid-cols-2 gap-2">
                {issue.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Issue photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(image, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Issue Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Issue Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(issue.status)}`}>
                  {issue.status || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium capitalize">{issue.category || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Upvotes</span>
                <span className="font-medium">{issue.upvotes || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Comments</span>
                <span className="font-medium">{issue.comments?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reported</span>
                <span className="font-medium">
                  {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {issue.updated_at ? new Date(issue.updated_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={handleUpvote}
                className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
                  user && issue.upvotedBy?.includes(user.id)
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <ArrowUp className="h-4 w-4" />
                <span>Upvote ({issue.upvotes || 0})</span>
              </button>
              
              <Link
                to="/report"
                className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
              >
                Report Similar Issue
              </Link>
              
              <Link
                to="/issues"
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-center block"
              >
                Browse All Issues
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IssueDetail


