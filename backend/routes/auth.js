import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { Pool } = pkg;
const router = express.Router();

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Initialize PostgreSQL connection pool using transaction pooler
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Test database connection
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// Signup endpoint
router.post('/signup', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password, fullName } = req.body;

    // Validate input
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const checkUser = await client.query('SELECT email FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const result = await client.query(
      'INSERT INTO users (email, password, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, bio, location, image',
      [email, hashedPassword, fullName]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        bio: newUser.bio,
        location: newUser.location,
        image: newUser.image ? newUser.image.toString('base64') : null,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  } finally {
    client.release();
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const client = await pool.connect();
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        bio: user.bio,
        location: user.location,
        image: user.image ? user.image.toString('base64') : null,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  } finally {
    client.release();
  }
});

// Get current user (requires token)
router.get('/me', async (req, res) => {
  const client = await pool.connect();
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const result = await client.query(
      'SELECT id, email, full_name, bio, location, image, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ 
      user: {
        ...user,
        image: user.image ? user.image.toString('base64') : null,
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Invalid token' });
  } finally {
    client.release();
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Update profile endpoint (requires token)
router.post('/update-profile', upload.single('image'), async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('=== UPDATE PROFILE REQUEST ===');
    console.log('Content-Type:', req.get('content-type'));
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    console.log('Request file:', req.file);
    console.log('================================');
    
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { full_name, email, bio } = req.body;

    console.log('Update profile request:', { full_name, email, bio });
    console.log('File received:', req.file ? `Yes - ${req.file.size} bytes` : 'No file');

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name) {
      updates.push(`full_name = $${paramCount}`);
      values.push(full_name);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (bio) {
      updates.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }

    if (req.file) {
      console.log('Adding image to update:', req.file.buffer.length, 'bytes');
      updates.push(`image = $${paramCount}`);
      values.push(req.file.buffer);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add user ID for WHERE clause
    const userIdParam = paramCount;
    values.push(decoded.id);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${userIdParam}
      RETURNING id, email, full_name, bio, location, image, created_at, updated_at
    `;

    console.log('Executing query with', values.length, 'parameters');
    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    console.log('Profile updated successfully for user:', user.email);
    console.log('Image saved:', user.image ? `Yes - ${user.image.length} bytes` : 'No image');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        bio: user.bio,
        location: user.location,
        image: user.image ? user.image.toString('base64') : null,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error during profile update' });
  } finally {
    client.release();
  }
});

export default router;
