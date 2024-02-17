class UploadStatistics {
  constructor() {
    this.reset();
  }

  reset() {
    this.startTime = Date.now();
    this.endTime = null;
    this.totalChunks = 0;
    this.successChunks = 0;
    this.failedChunks = 0;
    this.retryCounts = 0;
  }

  startTracking() {
    this.reset();
    this.startTime = Date.now();
  }

  logSuccess() {
    this.successChunks += 1;
  }

  logFailure() {
    this.failedChunks += 1;
  }

  logRetry() {
    this.retryCounts += 1;
  }

  generateSummary() {
    this.endTime = Date.now();
    const durationSeconds = (this.endTime - this.startTime) / 1000;
    return {
      totalChunks: this.totalChunks,
      successChunks: this.successChunks,
      failedChunks: this.failedChunks,
      retryCounts: this.retryCounts,
      durationSeconds: durationSeconds,
      successRate: ((this.successChunks / this.totalChunks) * 100).toFixed(2) + '%',
      failureRate: ((this.failedChunks / this.totalChunks) * 100).toFixed(2) + '%',
      averageRetries: (this.retryCounts / this.totalChunks).toFixed(2),
    };
  }

  incrementTotalChunks() {
    this.totalChunks += 1;
  }
}

module.exports = UploadStatistics;