import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

app.use(cors());

app.get('/api/quran/audio/:ayahNumber', async (req, res) => {
  try {
    const { ayahNumber } = req.params;
    console.log(`\n📢 Audio request received for ayah: ${ayahNumber}`);
    
    if (!ayahNumber || isNaN(ayahNumber)) {
      console.error(`❌ Invalid ayah number: ${ayahNumber}`);
      return res.status(400).json({ error: 'Invalid ayah number' });
    }

    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`;
    console.log(`🔗 Fetching from CDN: ${audioUrl}`);
    
    const response = await fetch(audioUrl);
    console.log(`📡 CDN Response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ CDN Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: `Failed to fetch audio: ${response.statusText}` });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    console.log('⏳ Converting to buffer...');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`✅ Sending audio buffer: ${buffer.length} bytes`);
    
    res.send(buffer);
    console.log('✅ Response sent successfully');
    
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch audio', message: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🎵 Server running on http://localhost:${PORT}`);
});
