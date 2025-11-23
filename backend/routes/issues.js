import express from 'express'
import { body, validationResult } from 'express-validator'
import auth from '../middleware/auth.js'
import Issue from '../models/Issue.js'
import User from '../models/User.js'

const router = express.Router()

// Get all issues
router.get('/', async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate('reporter', 'name email')
      .populate('comments.user', 'name')
      .sort({ createdAt: -1 })
    
    res.json(issues)
  } catch (error) {
    console.error('Get issues error:', error)
    res.status(500).json({ message: 'Server error fetching issues' })
  }
})

// Get single issue
router.get('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('comments.user', 'name')
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }
    
    res.json(issue)
  } catch (error) {
    console.error('Get issue error:', error)
    res.status(500).json({ message: 'Server error fetching issue' })
  }
})

// Create issue
router.post('/', auth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isIn(['pothole', 'garbage', 'streetlight', 'traffic-signal', 'parks', 'sidewalk', 'other']).withMessage('Valid category is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('latitude').isNumeric().withMessage('Valid latitude is required'),
  body('longitude').isNumeric().withMessage('Valid longitude is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { title, description, category, address, latitude, longitude } = req.body

    const issue = await Issue.create({
      title,
      description,
      category,
      location: {
        address,
        coordinates: {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude)
        }
      },
      images: req.body.images || [],
      reporter: req.user.id
    })

    // Populate the reporter info
    await issue.populate('reporter', 'name email')
    
    res.status(201).json(issue)
  } catch (error) {
    console.error('Create issue error:', error)
    res.status(500).json({ message: 'Server error creating issue' })
  }
})

// Upvote issue
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    const hasUpvoted = issue.upvotedBy.includes(req.user.id)
    
    if (hasUpvoted) {
      // Remove upvote
      issue.upvotes = Math.max(0, issue.upvotes - 1)
      issue.upvotedBy = issue.upvotedBy.filter(
        userId => userId.toString() !== req.user.id
      )
    } else {
      // Add upvote
      issue.upvotes += 1
      issue.upvotedBy.push(req.user.id)
    }

    await issue.save()
    await issue.populate('reporter', 'name email')
    
    res.json(issue)
  } catch (error) {
    console.error('Upvote error:', error)
    res.status(500).json({ message: 'Server error upvoting issue' })
  }
})

// Update issue status
router.patch('/:id/status', auth, [
  body('status').isIn(['reported', 'acknowledged', 'in-progress', 'resolved']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { status } = req.body
    const issue = await Issue.findById(req.params.id)
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    issue.status = status
    await issue.save()
    await issue.populate('reporter', 'name email')
    
    res.json(issue)
  } catch (error) {
    console.error('Update status error:', error)
    res.status(500).json({ message: 'Server error updating issue status' })
  }
})

// Add comment
router.post('/:id/comments', auth, [
  body('text').notEmpty().withMessage('Comment text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { text } = req.body
    const issue = await Issue.findById(req.params.id)
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    issue.comments.push({
      user: req.user.id,
      text
    })

    await issue.save()
    await issue.populate('reporter', 'name email')
    await issue.populate('comments.user', 'name')
    
    res.json(issue)
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ message: 'Server error adding comment' })
  }
})

export default router