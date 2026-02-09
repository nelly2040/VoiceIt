import jwt from 'jsonwebtoken'
import { DatabaseService } from '../services/database.js'

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' })
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check if the user ID is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(decoded.userId)) {
      return res.status(401).json({ message: 'Invalid user ID format' })
    }

    const user = await DatabaseService.findUserById(decoded.userId)
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' })
    }
    
    res.status(401).json({ message: 'Token is not valid' })
  }
}

export default auth