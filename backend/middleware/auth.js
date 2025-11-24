import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'voiceit-secret-key-2024')
    
    // MongoDB authentication only
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid - user not found' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error.message)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    
    if (error.name === 'CastError') {
      return res.status(401).json({ message: 'Invalid user ID format' })
    }
    
    res.status(401).json({ message: 'Token is not valid' })
  }
}

export default auth