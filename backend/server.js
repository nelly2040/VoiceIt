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

// Models for data initialization
import User from './models/User.js'
import Issue from './models/Issue.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/issues', issueRoutes)
app.use('/api/users', userRoutes)

// Health check route
app.get('/api/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  res.json({ 
    message: 'VoiceIt Backend is running!',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  })
})

// MongoDB Connection with version compatibility
const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...')
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voiceit'
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables')
    }

    console.log('📝 Using database:', MONGODB_URI.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas')
    
    // MongoDB connection options with compatibility
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      // Remove version requirements for compatibility
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }

    await mongoose.connect(MONGODB_URI, options)
    console.log('✅ Connected to MongoDB successfully!')
    console.log('📊 MongoDB version:', mongoose.connection.client?.s?.serverApi?.version || 'Unknown')
    
    // Initialize sample data
    await initializeSampleData()
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
    
    if (error.message.includes('wire version')) {
      console.log('💡 MongoDB Version Compatibility Issue!')
      console.log('   Your MongoDB version is too old for the current driver.')
      console.log('')
      console.log('🔧 Quick Solutions:')
      console.log('   1. Use Docker (recommended):')
      console.log('      docker run -d -p 27017:27017 --name mongodb mongo:7.0')
      console.log('')
      console.log('   2. Install newer MongoDB:')
      console.log('      Follow instructions at: https://www.mongodb.com/docs/manual/installation/')
      console.log('')
      console.log('   3. Use MongoDB Atlas (cloud):')
      console.log('      - Go to MongoDB Atlas and fix IP whitelist')
      console.log('      - Update MONGODB_URI in .env file')
    }
    
    console.log('')
    console.log('🚨 Server cannot start without database connection')
    console.log('💡 Please fix the database connection and restart the server')
    process.exit(1)
  }
}

// Initialize sample data
const initializeSampleData = async () => {
  try {
    console.log('🔄 Checking and initializing sample data...')
    
    // Create admin user if doesn't exist
    const adminExists = await User.findOne({ email: 'adminvoiceit@gmail.com' })
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'adminvoiceit@gmail.com',
        password: '5678admin',
        role: 'admin'
      })
      console.log('✅ Admin user created: adminvoiceit@gmail.com / 5678admin')
    } else {
      console.log('✅ Admin user already exists')
    }

    // Create sample issues if none exist
    const issueCount = await Issue.countDocuments()
    if (issueCount === 0) {
      const adminUser = await User.findOne({ email: 'adminvoiceit@gmail.com' })
      if (adminUser) {
        const sampleIssues = [
          {
            title: 'Large pothole on Main Street',
            description: 'There is a large pothole that needs immediate attention.',
            category: 'pothole',
            status: 'reported',
            location: {
              address: '123 Main Street, Nairobi',
              coordinates: { lat: -1.2921, lng: 36.8219 }
            },
            reporter: adminUser._id,
            upvotes: 5
          },
          {
            title: 'Broken streetlight near park',
            description: 'Streetlight has been out for several days.',
            category: 'streetlight',
            status: 'in-progress',
            location: {
              address: '456 Park Road, Nairobi',
              coordinates: { lat: -1.2833, lng: 36.8167 }
            },
            reporter: adminUser._id,
            upvotes: 12
          }
        ]
        await Issue.insertMany(sampleIssues)
        console.log(`✅ ${sampleIssues.length} sample issues created`)
      }
    } else {
      console.log(`✅ Database has ${issueCount} existing issues`)
    }
    
    console.log('🎉 Data initialization complete!')
  } catch (error) {
    console.error('❌ Error initializing sample data:', error.message)
  }
}

// Connect to database
connectDB()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🌐 Frontend: http://localhost:${PORT}/api`)
})