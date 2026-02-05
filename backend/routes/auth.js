import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { DatabaseService } from '../services/database.js'

const router = express.Router()

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  })
}

// Register
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body

    // REMOVED: Admin email restriction check

    // Check if user already exists
    const existingUser = await DatabaseService.findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Determine role - if it's the admin email, set as admin
    const role = email === 'adminvoiceit@gmail.com' ? 'admin' : 'user'

    // Create new user
    const user = await DatabaseService.createUser({
      name,
      email,
      password: hashedPassword,
      role: role
    })

    // Generate token
    const token = generateToken(user.id)

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ 
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    console.log('🔐 Login attempt for:', email)
    console.log('📧 Provided password:', password)

    // Find user
    const user = await DatabaseService.findUserByEmail(email)
    console.log('👤 User found:', user ? 'Yes' : 'No')
    
    if (!user) {
      console.log('❌ User not found')
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    console.log('🔑 Stored password hash:', user.password)
    console.log('🔑 Password length:', user.password.length)

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('✅ Password valid:', isPasswordValid)

    if (!isPasswordValid) {
      console.log('❌ Invalid password')
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Generate token
    const token = generateToken(user.id)
    console.log('🎫 Token generated for user:', user.id)

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await DatabaseService.findUserById(decoded.userId)
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(401).json({ message: 'Invalid token' })
  }
})

// Temporary debug route - remove after testing
router.post('/debug-admin', async (req, res) => {
  try {
    const user = await DatabaseService.findUserByEmail('adminvoiceit@gmail.com')
    
    if (!user) {
      return res.json({ 
        exists: false,
        message: 'Admin user not found in database' 
      })
    }

    // Test password with bcrypt
    const testPassword = '5678admin'
    const isPasswordValid = await bcrypt.compare(testPassword, user.password)
    
    res.json({
      exists: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        password_hash: user.password,
        password_length: user.password.length
      },
      password_test: {
        test_password: testPassword,
        is_valid: isPasswordValid
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Make sure this is at the end of the file
export default router


