import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const IssueContext = createContext()

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useIssues = () => {
  const context = useContext(IssueContext)
  if (!context) {
    throw new Error('useIssues must be used within an IssueProvider')
  }
  return context
}

export const IssueProvider = ({ children }) => {
  const [issues, setIssues] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  // Set up axios interceptor for auth
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      // Verify the token is still valid
      axios.get(`${API_BASE_URL}/auth/me`)
        .then(response => {
          setUser(response.data.user)
        })
        .catch(error => {
          console.error('Token validation failed:', error)
          // Clear invalid token
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          delete axios.defaults.headers.common['Authorization']
        })
    }
  }, [])

  const fetchIssues = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/issues`)
      setIssues(response.data)
    } catch (error) {
      console.error('Error fetching issues:', error)
    }
  }

  const createIssue = async (formData) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found')
      }

      const response = await axios.post(`${API_BASE_URL}/issues`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      setIssues(prev => [response.data, ...prev])
      return response.data
    } catch (error) {
      console.error('Error creating issue:', error)
      if (error.response?.status === 401) {
        // Token is invalid, clear it
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']
        setUser(null)
        throw new Error('Session expired. Please login again.')
      }
      throw error
    }
  }

  const updateIssueStatus = async (id, status) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/issues/${id}/status`, 
        { status }
      )
      setIssues(prev => prev.map(issue => 
        issue.id === id ? response.data : issue
      ))
      return response.data
    } catch (error) {
      console.error('Error updating issue:', error)
      throw error
    }
  }

  const upvoteIssue = async (id) => {
  try {
    console.log('🔼 Attempting to upvote issue:', id)
    
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Please login to upvote issues')
    }

    const response = await axios.post(`${API_BASE_URL}/issues/${id}/upvote`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    console.log('✅ Upvote successful:', response.data)
    
    // Update the issues list with the updated issue
    setIssues(prev => prev.map(issue => 
      issue.id === id ? response.data : issue
    ))
    
    return response.data
  } catch (error) {
    console.error('❌ Error upvoting issue:', error)
    
    if (error.response?.status === 401) {
      // Token is invalid, clear it
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
      throw new Error('Session expired. Please login again.')
    }
    
    throw error
  }
}

  const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)
    const { token, user } = response.data
    
    // Store token and user
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    
    return response.data
  } catch (error) {
    console.error('Error logging in:', error)
    throw error
  }
}

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData)
      const { token, user } = response.data
      
      // Store token and user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      return response.data
    } catch (error) {
      console.error('Error registering:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  useEffect(() => {
    fetchIssues()
  }, [])

  const value = {
    issues,
    user,
    loading,
    fetchIssues,
    createIssue,
    updateIssueStatus,
    upvoteIssue,
    login,
    register,
    logout
  }

  return (
    <IssueContext.Provider value={value}>
      {children}
    </IssueContext.Provider>
  )
}