import fetch from 'node-fetch';

async function test() {
  try {
    console.log('Testing node-fetch v3 arrayBuffer()...');
    const response = await fetch('https://cdn.islamic.network/quran/audio/128/ar.alafasy/20.mp3');
    
    if (!response.ok) {
      console.error('CDN response not ok:', response.status);
      return;
    }

    console.log('Getting arrayBuffer...');
    const arrayBuffer = await response.arrayBuffer();
    console.log('arrayBuffer type:', typeof arrayBuffer);
    console.log('arrayBuffer size:', arrayBuffer.byteLength);
    
    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer created, size:', buffer.length);
    console.log('✅ Success! The fix should work.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
