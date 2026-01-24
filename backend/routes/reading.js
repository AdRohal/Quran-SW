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

// Middleware to verify token (optional - doesn't fail if no token)
const verifyTokenOptional = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.id;
    } catch (error) {
      // Token is invalid, but that's okay - user is just not logged in
      req.userId = null;
    }
  } else {
    req.userId = null;
  }
  next();
};

// Middleware to verify token (required)
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

// Record reading (optional auth - anonymous users won't record streak, but won't error)
router.post('/record-read', verifyTokenOptional, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    
    // If no user is logged in, return success but don't record
    if (!userId) {
      return res.json({
        message: 'Reading not recorded (user not logged in)',
        readRecord: null,
      });
    }

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

// Save memorized ayahs (optional auth - data only saved if logged in)
router.post('/save-memorization', verifyTokenOptional, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const { surahNumber, ayahStart, ayahEnd } = req.body;

    if (!surahNumber || !ayahStart || !ayahEnd) {
      return res.status(400).json({ error: 'Missing required fields: surahNumber, ayahStart, ayahEnd' });
    }

    // If no user is logged in, return success but don't save
    if (!userId) {
      return res.json({
        message: 'Memorization not saved (user not logged in)',
        memorization: null,
      });
    }

    // Check if memorization record already exists
    const existingResult = await client.query(
      `SELECT id, percentage FROM memorization_progress
       WHERE user_id = $1 AND surah_number = $2 AND ayah_start = $3 AND ayah_end = $4`,
      [userId, surahNumber, ayahStart, ayahEnd]
    );

    if (existingResult.rows.length > 0) {
      // Update existing record - mark as 100% memorized
      const result = await client.query(
        `UPDATE memorization_progress 
         SET percentage = 100, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND surah_number = $2 AND ayah_start = $3 AND ayah_end = $4
         RETURNING id, user_id, surah_number, ayah_start, ayah_end, percentage`,
        [userId, surahNumber, ayahStart, ayahEnd]
      );
      return res.json({
        message: 'Memorization updated successfully',
        memorization: result.rows[0],
      });
    } else {
      // Create new record
      const result = await client.query(
        `INSERT INTO memorization_progress (user_id, surah_number, ayah_start, ayah_end, percentage)
         VALUES ($1, $2, $3, $4, 100)
         RETURNING id, user_id, surah_number, ayah_start, ayah_end, percentage`,
        [userId, surahNumber, ayahStart, ayahEnd]
      );
      return res.json({
        message: 'Memorization saved successfully',
        memorization: result.rows[0],
      });
    }
  } catch (error) {
    console.error('Error saving memorization:', error);
    res.status(500).json({ error: 'Failed to save memorization' });
  } finally {
    client.release();
  }
});

// Save complete session memorization progress (range of ayahs)
router.post('/save-session-memorization', verifyTokenOptional, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const { surahNumber, passedAyahs } = req.body;

    if (!surahNumber || !passedAyahs || passedAyahs.length === 0) {
      return res.status(400).json({ error: 'Missing required fields: surahNumber, passedAyahs' });
    }

    // If no user is logged in, return success but don't save
    if (!userId) {
      return res.json({
        message: 'Session memorization not saved (user not logged in)',
        saved: false,
      });
    }

    // Save each passed ayah as 100% memorized
    const savedRecords = [];
    for (const ayahNumber of passedAyahs) {
      try {
        const result = await client.query(
          `INSERT INTO memorization_progress (user_id, surah_number, ayah_start, ayah_end, percentage)
           VALUES ($1, $2, $3, $4, 100)
           ON CONFLICT (user_id, surah_number, ayah_start, ayah_end) DO UPDATE
           SET percentage = 100, updated_at = CURRENT_TIMESTAMP
           RETURNING id, user_id, surah_number, ayah_start, ayah_end, percentage`,
          [userId, surahNumber, ayahNumber, ayahNumber]
        );
        savedRecords.push(result.rows[0]);
      } catch (error) {
        console.error(`Error saving ayah ${ayahNumber}:`, error);
      }
    }

    res.json({
      message: 'Session memorization saved successfully',
      saved: true,
      recordCount: savedRecords.length,
      records: savedRecords,
    });
  } catch (error) {
    console.error('Error saving session memorization:', error);
    res.status(500).json({ error: 'Failed to save session memorization' });
  } finally {
    client.release();
  }
});

// Get memorization progress for a surah (optional auth - returns data if logged in, empty if not)
router.get('/memorization/:surahNumber', verifyTokenOptional, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;
    const { surahNumber } = req.params;

    // If no user is logged in, return empty memorization data
    if (!userId) {
      return res.json({
        surahNumber: parseInt(surahNumber),
        totalPercentage: 0,
        memorizedAyahs: [],
      });
    }

    const result = await client.query(
      `SELECT id, user_id, surah_number, ayah_start, ayah_end, percentage
       FROM memorization_progress
       WHERE user_id = $1 AND surah_number = $2
       ORDER BY ayah_start ASC`,
      [userId, parseInt(surahNumber)]
    );

    // Calculate overall percentage for surah
    let totalPercentage = 0;
    if (result.rows.length > 0) {
      const avgPercentage = result.rows.reduce((sum, row) => sum + row.percentage, 0) / result.rows.length;
      totalPercentage = Math.round(avgPercentage);
    }

    res.json({
      surahNumber: parseInt(surahNumber),
      totalPercentage,
      memorizedAyahs: result.rows,
    });
  } catch (error) {
    console.error('Error fetching memorization progress:', error);
    res.status(500).json({ error: 'Failed to fetch memorization progress' });
  } finally {
    client.release();
  }
});

// Get count of completely memorized surahs (user)
router.get('/memorized-surahs-count', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.userId;

    // Get all Quran surahs count (114 total)
    const totalSurahsResult = await client.query(
      `SELECT COUNT(*) as total FROM surahs`
    );
    const totalSurahs = totalSurahsResult.rows[0].total;

    // For each surah, check if all its ayahs are memorized (100%)
    const memorizedResult = await client.query(
      `SELECT DISTINCT surah_number 
       FROM memorization_progress 
       WHERE user_id = $1 AND percentage = 100
       GROUP BY surah_number, surah_number
       ORDER BY surah_number`,
      [userId]
    );

    const memorizedSurahs = memorizedResult.rows.length;

    res.json({
      memorizedSurahs,
      totalSurahs,
    });
  } catch (error) {
    console.error('Error fetching memorized surahs count:', error);
    res.status(500).json({ error: 'Failed to fetch memorized surahs count' });
  } finally {
    client.release();
  }
});

export default router;

