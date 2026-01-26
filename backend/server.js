import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import authRoutes from './routes/auth.js';
import readingRoutes from './routes/reading.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Serve static JSON Quran files
app.use('/data/quran', express.static(path.join(__dirname, 'data/quran')));

// Auth routes
app.use('/api/auth', authRoutes);

// Reading/Streak routes
app.use('/api/reading', readingRoutes);

// Route to proxy Quran audio
app.get('/api/quran/audio/:ayahNumber', async (req, res) => {
  try {
    const { ayahNumber } = req.params;
    const { reciter } = req.query;
    
    console.log(`\n📢 Audio request received for ayah: ${ayahNumber}, reciter: ${reciter || 'default'}`);
    
    // Validate ayah number
    if (!ayahNumber || isNaN(ayahNumber)) {
      console.error(`❌ Invalid ayah number: ${ayahNumber}`);
      return res.status(400).json({ error: 'Invalid ayah number' });
    }

    let audioUrl = '';

    if (reciter === 'muhammadayyoub') {
      // Muhammad Ayyoub from Islamic Network CDN
      audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.muhammadayyoub/${ayahNumber}.mp3`;
      console.log(`🔗 Fetching Muhammad Ayyoub from CDN: ${audioUrl}`);
    } else {
      // Default reciter (Alafasy) from Islamic Network CDN
      audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`;
      console.log(`🔗 Fetching from CDN: ${audioUrl}`);
    }
    
    const response = await fetch(audioUrl);
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: `Failed to fetch audio: ${response.statusText}` });
    }

    // Set proper headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Get audio as buffer and send
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ Sending audio buffer: ${buffer.length} bytes`);
    res.send(buffer);
    
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch audio', message: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Audio proxy server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Quran Audio Proxy Server', endpoints: ['/api/health', '/api/quran/audio/:ayahNumber'] });
});

app.listen(PORT, () => {
  console.log(`🎵 Audio proxy server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/quran/audio/:ayahNumber`);
});
