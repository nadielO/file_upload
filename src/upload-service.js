const axios = require('axios');
const FormData = require('form-data');
const { PassThrough } = require('stream');
const retry = require('retry');

const CHUNK_SIZE = 1024 * 1024; // 1MB; adjust this value based on your needs

/**
 * Uploads a file in chunks to a designated URL using multipart/form-data.
 * Progress is monitored, and retries are attempted for failed uploads.
 * 
 * @param {Stream} fileStream - Readable stream of the file to upload.
 * @param {string} destinationURL - The URL where the file will be uploaded.
 * @param {Object} credentials - Credentials required by the target storage platform.
 * @param {Function} onUploadProgress - Function called to report upload progress.
 * @param {Object} retryOptions - Configuration options for retry behavior.
 * @returns {Promise} - Promise that resolves when the upload is complete.
 */
async function uploadFile(fileStream, destinationURL, credentials, onUploadProgress, retryOptions = { retries: 3, minTimeout: 1000, maxTimeout: 5000 }) {
  let position = 0;
  let totalChunks = 0;

  fileStream.on('data', (chunk) => {
    totalChunks += 1;
  });

  async function uploadChunk(chunk) {
    const formData = new FormData();
    formData.append('file', chunk, {
      filename: `chunk_${position}.bin`,
      contentType: 'application/octet-stream',
    });

    const config = {
      headers: {
        ...formData.getHeaders(),
        "Authorization": `Bearer ${credentials.token}`, // Adjust as necessary
      },
    };

    try {
      const response = await axios.post(destinationURL, formData, config);
      console.log(`Chunk ${position} uploaded successfully`);
      return response;
    } catch (error) {
      console.error(`Upload of chunk ${position} failed with error: ${error}`, error.response ? error.response.data : error);
      throw error;
    }
  }

  return new Promise((resolve, reject) => {
    fileStream.on('readable', () => {
      let chunk;
      while (null !== (chunk = fileStream.read(CHUNK_SIZE))) {
        const passThrough = new PassThrough();
        passThrough.end(chunk);

        const operation = retry.operation(retryOptions);

        operation.attempt(async function(currentAttempt) {
          console.log(`Attempting to upload chunk ${position + 1}. Attempt number: ${currentAttempt}`);
          try {
            position += 1;
            await uploadChunk(passThrough);
            onUploadProgress(position);

            if (fileStream.readableLength === 0) {
              console.log('All chunks have been uploaded successfully.');
              resolve();
            }
          } catch (error) {
            console.error(`Failed to upload chunk ${position} after ${currentAttempt} attempts. Error: ${error}`, error);
            if (!operation.retry(error)) {
              console.log(`Failed to upload chunk ${position} after several attempts.`);
              reject(operation.mainError());
            }
          }
        });
      }
    });

    fileStream.on('error', err => {
      console.error('Error reading file stream', err);
      reject(err);
    });
  });
}

module.exports = { uploadFile };