import express from 'express'
import auth from '../middleware/auth.js'
import { DatabaseService } from '../services/database.js'

const router = express.Router()

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await DatabaseService.findUserById(req.user.id)
    const userIssues = await DatabaseService.getUserIssues(req.user.id)
    
    res.json({
      ...user,
      reportedIssues: userIssues
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ message: 'Server error fetching profile' })
  }
})

// Get user's reported issues
router.get('/my-issues', auth, async (req, res) => {
  try {
    const issues = await DatabaseService.getUserIssues(req.user.id)
    res.json(issues)
  } catch (error) {
    console.error('Get user issues error:', error)
    res.status(500).json({ message: 'Server error fetching user issues' })
  }
})

export default router