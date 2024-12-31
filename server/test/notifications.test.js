const assert = require('assert');

describe('Notification Test', () => {
  it('should fail to trigger AWS SES notification', () => {
    assert.strictEqual(1, 2, 'This test is intentionally failing to test AWS SES notifications');
  });
});
