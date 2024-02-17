const axios = require('axios');
const FormData = require('form-data');
const { PassThrough } = require('stream');
const retry = require('retry');
try {
  const { determineOptimalChunkSize } = require('../utils/adaptiveChunkSize');
  const UploadStatistics = require('../utils/uploadStatistics');
} catch (error) {
  console.error('Failed to import modules. Ensure that the `adaptiveChunkSize.js` and `uploadStatistics.js` are correctly placed within the src/utils directory.', error.stack);
  throw error;
}

async function uploadFile(fileStream, destinationURL, credentials, onUploadProgress, retryOptions = { retries: 3, minTimeout: 1000, maxTimeout: 5000 }) {
  let chunkSize; // This will hold the adaptive chunk size.
  const stats = new UploadStatistics();
  stats.startTracking();

  try {
    chunkSize = await determineOptimalChunkSize(destinationURL, credentials);
    console.log(`Initial optimal chunk size determined: ${chunkSize}`);
  } catch (error) {
    console.error(`Error determining initial optimal chunk size: ${error}`, error.stack);
    chunkSize = 1024 * 1024; // default to 1MB if there's an issue determining optimal size.
  }
  
  let position = 0;

  async function uploadChunk(chunk) {
    const formData = new FormData();
    formData.append('file', chunk, {
      filename: `chunk_${position}.bin`,
      contentType: 'application/octet-stream',
    });

    const config = {
      headers: {
        ...formData.getHeaders(),
        "Authorization": `Bearer ${credentials.token}`,
      },
    };

    try {
      const response = await axios.post(destinationURL, formData, config);
      console.log(`Chunk ${position} uploaded successfully`);
      stats.logSuccess();
      return response;
    } catch (error) {
      console.error(`Upload of chunk ${position} failed with error: ${error}`, error.response ? error.response.data : error.stack);
      stats.logFailure();
      throw error;
    }
  }

  return new Promise((resolve, reject) => {
    fileStream.on('readable', async () => {
      let chunk;
      while (null !== (chunk = fileStream.read(chunkSize))) {
        const passThrough = new PassThrough();
        passThrough.end(chunk);

        const operation = retry.operation(retryOptions);

        operation.attempt(async function(currentAttempt) {
          console.log(`Attempting to upload chunk ${position + 1}. Attempt number: ${currentAttempt}`);
          try {
            position += 1;
            await uploadChunk(passThrough);
            onUploadProgress(position);

            if (position % 5 === 0) { // Recalibrate the chunk size every 5 chunks.
              try {
                chunkSize = await determineOptimalChunkSize(destinationURL, credentials);
                console.log(`Chunk size recalibrated to: ${chunkSize}`);
              } catch (recalibrationError) {
                console.error(`Error recalibrating chunk size: ${recalibrationError}`, recalibrationError.stack);
                // Continue with the current chunkSize if recalibration fails.
              }
            }

            if (fileStream.readableLength === 0) {
              console.log('All chunks have been uploaded successfully.');
              const summary = stats.generateSummary();
              console.log('Upload Summary:', summary);
              resolve();
            }
          } catch (uploadError) {
            console.error(`Failed to upload chunk ${position} after ${currentAttempt} attempts. Error: ${uploadError}`, uploadError.stack);
            if (!operation.retry(uploadError)) {
              console.log(`Failed to upload chunk ${position} after several attempts.`);
              stats.logFailure();
              reject(operation.mainError());
            } else {
              stats.logRetry();
            }
          }
        });
      }
    });

    fileStream.on('error', fileStreamError => {
      console.error('Error reading file stream', fileStreamError, fileStreamError.stack);
      reject(fileStreamError);
    });
  });
}

module.exports = { uploadFile };