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
    this.platformLogs = [];
  }

  startTracking() {
    this.reset();
    this.startTime = Date.now();
  }

  logPlatformUsage(platform, fileName) {
    console.log(`Logging platform usage: ${platform}, File: ${fileName}`);
    this.platformLogs.push({ platform, fileName, startTime: new Date().toISOString()});
  }

  logSuccess(platform, fileName) {
    console.log(`Logging success for platform: ${platform}, File: ${fileName}`);
    this.successChunks += 1;
    this.logOutcome(true, platform, fileName);
  }

  logFailure(platform, fileName) {
    console.log(`Logging failure for platform: ${platform}, File: ${fileName}`);
    this.failedChunks += 1;
    this.logOutcome(false, platform, fileName);
  }

  logOutcome(success, platform, fileName) {
    const index = this.platformLogs.findIndex(entry => entry.platform === platform && entry.fileName === fileName);
    if (index > -1) {
      this.platformLogs[index].endTime = new Date().toISOString();
      this.platformLogs[index].outcome = success ? "Success" : "Failure";
    } else {
      console.error(`Failed to find log entry for platform: ${platform}, File: ${fileName}`);
    }
  }

  logRetry() {
    console.log(`Logging retry attempt`);
    this.retryCounts += 1;
  }

  generateSummary() {
    this.endTime = Date.now();
    const durationSeconds = (this.endTime - this.startTime) / 1000;
    console.log(`Generating upload summary`);
    return {
      totalChunks: this.totalChunks,
      successChunks: this.successChunks,
      failedChunks: this.failedChunks,
      retryCounts: this.retryCounts,
      durationSeconds: durationSeconds,
      successRate: ((this.successChunks / this.totalChunks) * 100).toFixed(2) + '%',
      failureRate: ((this.failedChunks / this.totalChunks) * 100).toFixed(2) + '%',
      averageRetries: (this.retryCounts / this.totalChunks).toFixed(2),
      platformLogs: this.platformLogs,
    };
  }

  incrementTotalChunks() {
    console.log(`Incrementing total chunks counter`);
    this.totalChunks += 1;
  }
}

module.exports = UploadStatistics;