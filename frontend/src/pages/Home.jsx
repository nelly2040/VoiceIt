import React from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react'
import { useIssues } from '../contexts/IssueContext'

const Home = () => {
  const { issues } = useIssues()

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-resolved" />
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-urgent" />
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />
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

  // Filter out issues with invalid coordinates
  const validIssues = issues.filter(issue => 
    issue && typeof issue.latitude === 'number' && typeof issue.longitude === 'number'
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Make Your Community Better
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Report local issues, track government responses, and create positive change in your neighborhood.
        </p>
        <Link
          to="/report"
          className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
        >
          <span>Report an Issue</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Issues in Your Area</h2>
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={[-1.2921, 36.8219]} // Nairobi coordinates
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {validIssues.map((issue) => (
              <Marker
                key={issue.id}
                position={[issue.latitude, issue.longitude]}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold">{issue.title}</h3>
                    <p className="text-sm text-gray-600">{issue.category}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Recent Issues Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Issues</h2>
          <Link
            to="/issues"
            className="text-primary hover:text-blue-700 font-semibold flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {issues.slice(0, 6).map((issue) => {
            if (!issue) return null // Safety check
            
            return (
              <div key={issue.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                  {getStatusIcon(issue.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{issue.description}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span className="capitalize">{issue.category}</span>
                  <span>{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : 'Unknown date'}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                  <span className="text-sm text-gray-600">{issue.upvotes || 0} upvotes</span>
                </div>
              </div>
            )
          })}
        </div>

        {issues.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No issues reported yet. Be the first to report an issue!</p>
            <Link
              to="/report"
              className="inline-block mt-4 bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Report First Issue
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home