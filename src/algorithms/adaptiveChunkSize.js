const axios = require('axios');
const FormData = require('form-data');

async function determineOptimalChunkSize(testUrl, credentials) {
  const sampleSize = 1024 * 100; 
  const sampleData = Buffer.alloc(sampleSize, '0');
  const startTime = Date.now();

  try {
    const formData = new FormData();
    formData.append('file', sampleData, 'test.bin');

    const config = {
      headers: {
        ...formData.getHeaders(),
        "Authorization": `Bearer ${credentials.token}`,
      },
    };

    await axios.post(testUrl, formData, config);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; 
    const speedBps = sampleSize / duration; 

    let optimalChunkSize = 1024 * 1024; 
    if (speedBps < 1024 * 1024) { 
      optimalChunkSize = 1024 * 512; 
    } 
    if (speedBps < 1024 * 512) {  
      optimalChunkSize = 1024 * 256; 
    }

    return optimalChunkSize;
  } catch (error) {
    console.error('Error determining upload speed. Using default chunk size.', error);
    return 1024 * 1024; 
  }
}

module.exports = { determineOptimalChunkSize };