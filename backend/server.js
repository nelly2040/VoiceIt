import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
import userRoutes from './routes/users.js';

// Config - Import Supabase and Cloudinary config
import './config/supabase.js';
import './config/cloudinary.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://voiceitf.netlify.app',  // Added Netlify URL
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Database: Supabase PostgreSQL`);
  console.log(`🌐 Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Ready' : 'Not configured'}`);
  console.log(`🔐 Admin credentials: adminvoiceit@gmail.com / 5678admin`);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}