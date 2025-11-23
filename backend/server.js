import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Routes
import authRoutes from './routes/auth.js'
import issueRoutes from './routes/issues.js'
import userRoutes from './routes/users.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/issues', issueRoutes)
app.use('/api/users', userRoutes)

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'VoiceIt Backend is running!',
    timestamp: new Date().toISOString()
  })
})

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceit'
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err)
    console.log('💡 Using in-memory data storage instead...')
  })

const PORT = process.env.PORT || 5000

// Initialize data
import User from './models/User.js'
import Issue from './models/Issue.js'

const initializeData = async () => {
  try {
    await User.initAdmin()
    await Issue.createSampleData(User)
  } catch (error) {
    console.log('Data initialization:', error.message)
  }
}

// Call initialization
initializeData()

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
})