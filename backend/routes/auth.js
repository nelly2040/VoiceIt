import express from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import mongoose from 'mongoose'
import User from '../models/User.js'

const router = express.Router()

// In-memory storage fallback
let memoryUsers = []

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'voiceit-secret-key-2024', {
    expiresIn: '30d'
  })
}

// Check if MongoDB is connected
const isMongoDBConnected = () => {
  return mongoose.connection.readyState === 1
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

    // Check if using MongoDB or fallback
    if (isMongoDBConnected()) {
      // MongoDB registration
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' })
      }

      const user = await User.create({ name, email, password })
      const token = generateToken(user._id)

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    } else {
      // In-memory registration (fallback)
      const existingUser = memoryUsers.find(user => user.email === email)
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' })
      }

      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password: password, // In real app, hash this password
        role: 'user'
      }

      memoryUsers.push(newUser)

      const token = generateToken(newUser.id)

      res.status(201).json({
        message: 'User registered successfully (using fallback storage)',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      })
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' })
    }
    
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

    if (isMongoDBConnected()) {
      // MongoDB login
      const user = await User.findOne({ email })
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      const isPasswordValid = await user.correctPassword(password)
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      const token = generateToken(user._id)

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    } else {
      // In-memory login (fallback)
      const user = memoryUsers.find(u => u.email === email)
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      // Simple password check for fallback (in real app, use bcrypt)
      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      const token = generateToken(user.id)

      res.json({
        message: 'Login successful (using fallback storage)',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

export default router