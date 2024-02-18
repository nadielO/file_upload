const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const stream = require('stream');

const uploadToS3 = async (chunk, destinationDetails, credentials) => {
  AWS.config.update({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    region: credentials.region,
  });

  const s3 = new AWS.S3();
  const params = {
    Bucket: destinationDetails.bucket,
    Key: destinationDetails.fileName,
    Body: bufferToStream(chunk),
  };

  return s3.upload(params).promise();
};

const uploadToGCS = async (chunk, destinationDetails, credentials) => {
  const storage = new Storage({
    projectId: credentials.projectId,
    credentials: {
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey,
    },
  });

  const myBucket = storage.bucket(destinationDetails.bucket);
  const file = myBucket.file(destinationDetails.fileName);

  const writableStream = file.createWriteStream();
  const readableStream = bufferToStream(chunk);

  return new Promise((resolve, reject) => {
    readableStream.pipe(writableStream)
      .on('error', (error) => {
        console.error('Upload to GCS failed:', error);
        reject(error);
      })
      .on('finish', resolve);
  });
};

const bufferToStream = (buffer) => {
  const readable = new stream.PassThrough();
  readable.end(buffer);
  return readable;
};

module.exports = {
  uploadToS3,
  uploadToGCS,
};