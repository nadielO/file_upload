const axios = require('axios');
const FormData = require('form-data');
const { PassThrough } = require('stream');
const retry = require('retry');
const { determineOptimalChunkSize } = require('../utils/adaptiveChunkSize');
const UploadStatistics = require('../utils/uploadStatistics');
const { uploadToS3, uploadToGCS } = require('./storageIntegrations');

function getUploadFunction(platform) {
  const platformFunctions = { S3: uploadToS3, GCS: uploadToGCS };
  const functionSelected = platformFunctions[platform];
  if (!functionSelected) {
    const error = new Error(`No upload function found for platform: ${platform}`);
    console.error(error);
    throw error;
  }
  return functionSelected;
}

async function uploadFile(fileStream, destinationDetails, credentials, platform, onUploadProgress, retryOptions = { retries: 3, minTimeout: 1000, maxTimeout: 5000 }) {
  let chunkSize; // This will hold the adaptive chunk size.
  const stats = new UploadStatistics();
  stats.startTracking();

  stats.logPlatformUsage(platform, destinationDetails.fileName); // Log platform usage at the beginning
  
  try {
    chunkSize = await determineOptimalChunkSize(destinationDetails.url, credentials);
    console.log(`Initial optimal chunk size determined: ${chunkSize}`);
  } catch (error) {
    console.error(`Error determining initial optimal chunk size: ${error}`, error.stack);
    chunkSize = 1024 * 1024; // default to 1MB if there's an issue determining optimal size.
  }

  let position = 0;
  const uploadChunkFunction = getUploadFunction(platform);

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
            await uploadChunkFunction(chunk, destinationDetails, credentials);
            onUploadProgress(position);
            stats.logSuccess(platform, destinationDetails.fileName); // Log successful chunk upload

            if (position % 5 === 0) { // Recalibrate the chunk size every 5 chunks.
              try {
                chunkSize = await determineOptimalChunkSize(destinationDetails.url, credentials);
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
            stats.logFailure(platform, destinationDetails.fileName); // Log failure to upload chunk
            if (!operation.retry(uploadError)) {
              console.log(`Failed to upload chunk ${position} after several attempts.`);
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