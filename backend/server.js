import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
import userRoutes from './routes/users.js';

// Config and Services
import './config/supabase.js';
import './config/cloudinary.js';
import { InitService } from './services/init.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'https://voiceitf.netlify.app'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'VoiceIt Backend is running with Supabase!',
    timestamp: new Date().toISOString(),
    database: 'Supabase PostgreSQL',
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'Ready' : 'Not configured'
  });
});

// Define the port
const PORT = process.env.PORT || 10000;

// Initialize data on startup
const initializeApp = async () => {
  try {
    await InitService.initializeAdmin();
    await InitService.initializeSampleData();
  } catch (error) {
    console.log('Data initialization completed with warnings');
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: https://your-backend-url.onrender.com/api/health`);
    console.log(`🗄️  Database: Supabase PostgreSQL`);
    console.log(`🌐 Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Ready' : 'Not configured'}`);
    console.log(`🔐 Admin credentials: adminvoiceit@gmail.com / 5678admin`);
    console.log(`🌍 CORS enabled for: https://voiceitf.netlify.app`);
  });
}

initializeApp();