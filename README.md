# File_Upload

File_Upload is an npm package developed to enable ultra-fast file uploads to various storage platforms, designed especially for scenarios with slow internet connectivity. It identifies and implements the most efficient file upload strategies, prioritizing speed and reliability.

## Overview

The solution incorporates a chunked data transfer mechanism, ensuring high efficiency through the Axios library for HTTP communication, FormData to manage multipart/form-data payloads, and the retry library for handling upload retries with sophistication. The project's cornerstone is the `upload-service.js` module which orchestrates the upload process, residing within the src directory.

## Features

- Ability to upload files in chunks for enhanced speed and resilience.
- Progress monitoring for uploads in real-time.
- Automated retry operations for chunks that fail to upload initially.
- Compatibility with an array of storage platforms, facilitated by flexible credential management.

## Getting started

### Requirements

- Node.js
- npm

### Quickstart

1. Clone the project repository.
2. In the project's root directory, execute `npm install` to fetch necessary dependencies.
3. Harness `uploadFile` function from `src/upload-service.js` in your application, specifying parameters like the stream of the file, the target URL, credential details, and callback for upload progress.

### License

Copyright (c) 2024.