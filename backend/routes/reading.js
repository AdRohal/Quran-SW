import express from 'express';
import jwt from 'jsonwebtoken';
import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { Pool } = pkg;
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Record reading (when user reads Ayah 1 or any ayah with mic)
router.post('/record-read', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    console.log(`Recording read for user ${userId} on ${today}`);

    // Insert or update reading streak for today
    const result = await client.query(
      `INSERT INTO reading_streak (user_id, read_date, is_read)
       VALUES ($1, $2, true)
       ON CONFLICT (user_id, read_date) DO UPDATE SET is_read = true
       RETURNING id, read_date, is_read`,
      [userId, today]
    );

    console.log('Read recorded successfully');
    res.json({
      message: 'Read recorded successfully',
      readRecord: result.rows[0],
    });
  } catch (error) {
    console.error('Error recording read:', error);
    res.status(500).json({ error: 'Failed to record read' });
  } finally {
    client.release();
  }
});

// Get current streak count
router.get('/streak', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;

    // Get all reading dates ordered by most recent
    const result = await client.query(
      `SELECT read_date FROM reading_streak 
       WHERE user_id = $1 AND is_read = true
       ORDER BY read_date DESC`,
      [userId]
    );

    console.log(`Fetching streak for user ${userId}`);

    if (result.rows.length === 0) {
      return res.json({
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
      });
    }

    // Calculate current streak (consecutive days from today backwards)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let checkDate = new Date(today);
    
    for (const row of result.rows) {
      const readDate = new Date(row.read_date);
      readDate.setHours(0, 0, 0, 0);
      
      const timeDiff = Math.abs(checkDate - readDate);
      const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 0 || dayDiff === 1) {
        currentStreak++;
        checkDate = new Date(readDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 1;
    let tempStreak = 1;
    
    for (let i = 0; i < result.rows.length - 1; i++) {
      const currentDate = new Date(result.rows[i].read_date);
      const nextDate = new Date(result.rows[i + 1].read_date);
      
      currentDate.setHours(0, 0, 0, 0);
      nextDate.setHours(0, 0, 0, 0);
      
      const timeDiff = Math.abs(currentDate - nextDate);
      const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    res.json({
      currentStreak,
      longestStreak,
      lastReadDate: result.rows[0].read_date,
    });
  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).json({ error: 'Failed to fetch streak' });
  } finally {
    client.release();
  }
});

export default router;
