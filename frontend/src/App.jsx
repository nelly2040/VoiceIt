import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { IssueProvider } from './contexts/IssueContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import ReportIssue from './pages/ReportIssue'
import Issues from './pages/Issues'
import IssueDetail from './pages/IssueDetail'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'

function App() {
  return (
    <IssueProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </Router>
    </IssueProvider>
  )
}

export default App