const dotenv = require('dotenv');
dotenv.config();

const storageConfig = {
  AWS_S3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET_NAME,
  },
  Google_Cloud_Storage: {
    projectId: process.env.GCS_PROJECT_ID,
    clientEmail: process.env.GCS_CLIENT_EMAIL,
    privateKey: process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    bucket: process.env.GCS_BUCKET_NAME,
  },
  uniqueFileIdentifier: function(platform, originalFileName){
    const timestamp = new Date().getTime();
    return `${platform}_${timestamp}_${originalFileName}`;
  }
};

module.exports = storageConfig;