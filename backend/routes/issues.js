import express from 'express'
import multer from 'multer'
import { body, validationResult } from 'express-validator'
import auth from '../middleware/auth.js'
import Issue from '../models/Issue.js'
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
          console.log('✅ Image uploaded to Cloudinary:', result.secure_url)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          return res.status(500).json({ message: 'Error uploading images' })
        }
      }
    }

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
      images: imageUrls,
      reporter: req.user._id
    })

    // Populate the reporter info
    await issue.populate('reporter', 'name email')
    
    console.log('✅ New issue created:', issue.title)
    res.status(201).json(issue)
  } catch (error) {
    console.error('Create issue error:', error)
    res.status(500).json({ 
      message: 'Server error creating issue',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Upvote issue
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
    
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    const hasUpvoted = issue.upvotedBy.includes(req.user._id)
    
    if (hasUpvoted) {
      // Remove upvote
      issue.upvotes = Math.max(0, issue.upvotes - 1)
      issue.upvotedBy = issue.upvotedBy.filter(
        userId => userId.toString() !== req.user._id.toString()
      )
    } else {
      // Add upvote
      issue.upvotes += 1
      issue.upvotedBy.push(req.user._id)
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
    issue.updatedAt = new Date()
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
      user: req.user._id,
      text,
      createdAt: new Date()
    })

    issue.updatedAt = new Date()
    await issue.save()
    await issue.populate('reporter', 'name email')
    await issue.populate('comments.user', 'name')
    
    res.json(issue)
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ message: 'Server error adding comment' })
  }
})

// Delete issue (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' })
    }

    const issue = await Issue.findById(req.params.id)
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' })
    }

    // Delete images from Cloudinary
    if (issue.images && issue.images.length > 0) {
      for (const imageUrl of issue.images) {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0]
          await cloudinary.uploader.destroy(`voiceit/issues/${publicId}`)
        } catch (cloudinaryError) {
          console.error('Error deleting image from Cloudinary:', cloudinaryError)
        }
      }
    }

    await Issue.findByIdAndDelete(req.params.id)
    res.json({ message: 'Issue deleted successfully' })
  } catch (error) {
    console.error('Delete issue error:', error)
    res.status(500).json({ message: 'Server error deleting issue' })
  }
})

export default router