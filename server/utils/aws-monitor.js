const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { getAwsConfig } = require('../config/aws');

class AwsMonitor {
  constructor() {
    this.cloudWatchClient = new CloudWatchClient({
      ...getAwsConfig(),
      maxAttempts: 3,
    });
    this.namespace = 'Lagomo';
    this.errorBuffer = [];
    this.flushInterval = 60000; // 1 minute

    // Start periodic flushing
    this.startPeriodicFlush();
  }

  async trackError(error, service, operation) {
    const errorMetric = {
      timestamp: new Date(),
      service,
      operation,
      errorCode: error.code || 'Unknown',
      errorMessage: error.message,
      requestId: error.$metadata?.requestId,
    };

    this.errorBuffer.push(errorMetric);

    // If buffer gets too large, flush immediately
    if (this.errorBuffer.length >= 20) {
      await this.flushMetrics();
    }
  }

  async flushMetrics() {
    if (this.errorBuffer.length === 0) return;

    const metrics = this.errorBuffer.map(error => ({
      MetricName: 'AwsErrors',
      Timestamp: error.timestamp,
      Value: 1,
      Unit: 'Count',
      Dimensions: [
        { Name: 'Service', Value: error.service },
        { Name: 'Operation', Value: error.operation },
        { Name: 'ErrorCode', Value: error.errorCode },
      ],
    }));

    try {
      await this.cloudWatchClient.send(new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: metrics,
      }));

      // Clear the buffer after successful flush
      this.errorBuffer = [];
    } catch (error) {
      console.error('Failed to flush AWS metrics:', error);
      // Keep the metrics in buffer to retry later
    }
  }

  startPeriodicFlush() {
    setInterval(() => {
      this.flushMetrics().catch(error => {
        console.error('Periodic metric flush failed:', error);
      });
    }, this.flushInterval);
  }

  // Cleanup for graceful shutdown
  async shutdown() {
    await this.flushMetrics();
    clearInterval(this.flushInterval);
  }
}

// Singleton instance
const awsMonitor = new AwsMonitor();

module.exports = awsMonitor;
