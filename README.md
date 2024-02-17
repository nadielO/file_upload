# File_Upload

File_Upload is an npm package developed to enable ultra-fast file uploads to various storage platforms, designed especially for scenarios with slow internet connectivity. It prioritizes speed and reliability in file transfer by employing a chunked data transfer mechanism alongside advanced features like progress monitoring and automatic retry for failed uploads.

## Overview

The package leverages Axios for HTTP communication, FormData for managing multipart/form-data payloads, and a custom retry mechanism to handle upload retries efficiently. The ‘src' directory contains the core functionality in ‘upload-service.js’, which orchestrates the upload process. Furthermore, the adaptive chunk size algorithm in ‘adaptiveChunkSize.js’ dynamically adjusts upload chunk sizes to optimize speed and reliability under varying network conditions.

## Features

- High-speed file uploads, optimized for slow networks.
- Chunked file uploads for improved reliability.
- Real-time progress monitoring.
- Sophisticated retry logic for handling upload failures.
- Automatic adjustment of upload chunk sizes for optimal performance.

## Getting started

### Requirements

- Node.js
- npm

### Quickstart

1. Clone the project repository to your local environment.
2. Navigate to the project directory and run `npm install` to install the required dependencies.
3. Utilize the `uploadFile` function provided in `src/upload-service.js`, specifying the necessary parameters such as file stream, destination URL, credential details, and an upload progress callback.

### License

Copyright (c) 2024.