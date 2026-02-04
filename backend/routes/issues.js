import express from 'express'
import multer from 'multer'
import { body, validationResult } from 'express-validator'
import auth from '../middleware/auth.js'
import { DatabaseService } from '../services/database.js'
import cloudinary from '../config/cloudinary.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'), false)
    }
  }
})

// Get all issues
router.get('/', async (req, res) => {
  try {
    const issues = await DatabaseService.getAllIssues()
    res.json(issues)
  } catch (error) {
    console.error('Get issues error:', error)
    res.status(500).json({ message: 'Server error fetching issues' })
  }
})

// Get single issue
router.get('/:id', async (req, res) => {
  try {
    const issue = await DatabaseService.getIssueById(req.params.id)
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }
    res.json(issue)
  } catch (error) {
    console.error('Get issue error:', error)
    res.status(500).json({ message: 'Server error fetching issue' })
  }
})

// Upload image to Cloudinary
const uploadToCloudinary = async (fileBuffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'voiceit/issues',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { format: 'jpg' }
        ]
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    ).end(fileBuffer)
  })
}

// Create issue with image upload
router.post('/', auth, upload.array('images', 5), [
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

    // Upload images to Cloudinary
    const imageUrls = []
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer)
          imageUrls.push(result.secure_url)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          return res.status(500).json({ message: 'Error uploading images' })
        }
      }
    }

    const issue = await DatabaseService.createIssue({
      title,
      description,
      category,
      status: 'reported',
      location_address: address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      images: imageUrls,
      reporter_id: req.user.id,
      upvotes: 0
    })

    res.status(201).json(issue)
  } catch (error) {
    console.error('Create issue error:', error)
    res.status(500).json({ message: 'Server error creating issue' })
  }
})

// Upvote issue
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const issue = await DatabaseService.toggleUpvote(req.params.id, req.user.id)
    res.json(issue)
  } catch (error) {
    console.error('Upvote error:', error)
    res.status(500).json({ message: 'Server error upvoting issue' })
  }
})

// Debug upvote status
router.get('/:id/upvote-status', auth, async (req, res) => {
  try {
    const issueId = req.params.id
    const userId = req.user.id

    // Check if user has upvoted this issue
    const { data: existingUpvote, error } = await supabase
      .from('upvotes')
      .select('id')
      .eq('issue_id', issueId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Get current upvote count
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .select('upvotes')
      .eq('id', issueId)
      .single()

    if (issueError) throw issueError

    res.json({
      issue_id: issueId,
      user_id: userId,
      has_upvoted: !!existingUpvote,
      current_upvotes: issue.upvotes,
      upvote_record: existingUpvote
    })
  } catch (error) {
    console.error('Debug upvote error:', error)
    res.status(500).json({ message: 'Error checking upvote status' })
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
    const issue = await DatabaseService.updateIssueStatus(req.params.id, status)
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
    const comment = await DatabaseService.addComment(req.params.id, req.user.id, text)
    res.json(comment)
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ message: 'Server error adding comment' })
  }
})

export default router

