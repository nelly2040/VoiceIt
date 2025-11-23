import express from 'express'
import auth from '../middleware/auth.js'
import User from '../models/User.js'
import Issue from '../models/Issue.js'

const router = express.Router()

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('reportedIssues')
    
    res.json(user)
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error fetching profile' })
  }
})

// Get user's reported issues
router.get('/my-issues', auth, async (req, res) => {
  try {
    const issues = await Issue.find({ reporter: req.user.id })
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 })
    
    res.json(issues)
  } catch (error) {
    console.error('Get user issues error:', error)
    res.status(500).json({ message: 'Server error fetching user issues' })
  }
})

export default router