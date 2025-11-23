import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const IssueContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useIssues = () => {
  const context = useContext(IssueContext);
  if (!context) {
    throw new Error('useIssues must be used within an IssueProvider');
  }
  return context;
};

export const IssueProvider = ({ children }) => {
  const [issues, setIssues] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const fetchIssues = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/issues`);
      setIssues(response.data);
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const createIssue = async (issueData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/issues`, issueData);
      setIssues((prev) => [response.data, ...prev]);
      return response.data;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  };

  const updateIssueStatus = async (id, status) => {
    try {
      const response = await axios.patch(`${API_BASE_URL}/issues/${id}/status`, { status });
      setIssues((prev) => 
        prev.map((issue) => (issue._id === id ? response.data : issue))
      );
      return response.data;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error;
    }
  };

  const upvoteIssue = async (id) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/issues/${id}/upvote`);
      setIssues((prev) => 
        prev.map((issue) => (issue._id === id ? response.data : issue))
      );
      return response.data;
    } catch (error) {
      console.error('Error upvoting issue:', error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const isAdmin = credentials.email === 'adminvoiceit@gmail.com' && credentials.password === '5678admin';
      const mockUser = {
        id: isAdmin ? 'admin-1' : 'user-1',
        name: isAdmin ? 'Admin User' : credentials.email.split('@')[0],
        email: credentials.email,
        role: isAdmin ? 'admin' : 'user',
      };
      const mockToken = 'mock-jwt-token';

      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
      setUser(mockUser);

      return { token: mockToken, user: mockUser };
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      return response.data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    fetchIssues();
  }, []);

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
    logout,
  };

  return (
    <IssueContext.Provider value={value}>
      {children}
    </IssueContext.Provider>
  );
};