const crypto = require('crypto');

function createTrackingToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashTrackingToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyTrackingToken(token, storedHash) {
  if (typeof token !== 'string' || !token || typeof storedHash !== 'string' || !/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const suppliedHash = Buffer.from(hashTrackingToken(token), 'hex');
  const expectedHash = Buffer.from(storedHash, 'hex');
  return crypto.timingSafeEqual(suppliedHash, expectedHash);
}

module.exports = {
  createTrackingToken,
  hashTrackingToken,
  verifyTrackingToken
};
