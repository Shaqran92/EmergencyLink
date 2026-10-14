function queueEmailNotification(notificationType, send) {
  if (process.env.NODE_ENV === 'test' && process.env.ENABLE_TEST_EMAIL_QUEUE !== 'true') {
    return Promise.resolve({ skipped: true, reason: 'email_queue_disabled_in_test' });
  }

  setImmediate(() => {
    Promise.resolve()
      .then(send)
      .catch((error) => {
        console.error(`[EmailNotification] Failed to send ${notificationType}.`, {
          error: error.message
        });
      });
  });

  return Promise.resolve({ queued: true });
}

module.exports = queueEmailNotification;
