import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
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
  const adminExists = await this.findOne({ email: 'adminvoiceit@gmail.com' })
  if (!adminExists) {
    await this.create({
      name: 'Admin User',
      email: 'adminvoiceit@gmail.com',
      password: '5678admin',
      role: 'admin'
    })
    console.log('✅ Admin user created successfully')
  }
}

export default mongoose.model('User', userSchema)