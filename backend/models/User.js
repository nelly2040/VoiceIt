import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  reportedIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  }],
  upvotedIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  }]
}, {
  timestamps: true
})

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Create admin user if doesn't exist
userSchema.statics.initAdmin = async function() {
  try {
    const adminExists = await this.findOne({ email: 'adminvoiceit@gmail.com' })
    if (!adminExists) {
      await this.create({
        name: 'Admin User',
        email: 'adminvoiceit@gmail.com',
        password: '5678admin',
        role: 'admin'
      })
      console.log('✅ Admin user created: adminvoiceit@gmail.com / 5678admin')
    } else {
      console.log('✅ Admin user already exists')
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
  }
}

export default mongoose.model('User', userSchema)