const {
  createTrackingToken,
  hashTrackingToken,
  verifyTrackingToken
} = require('../../src/utils/trackingToken');

describe('public tracking tokens', () => {
  test('generates a high-entropy token and verifies only its hash', () => {
    const token = createTrackingToken();
    const storedHash = hashTrackingToken(token);

    expect(token).toHaveLength(43);
    expect(storedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(storedHash).not.toContain(token);
    expect(verifyTrackingToken(token, storedHash)).toBe(true);
    expect(verifyTrackingToken(`${token}x`, storedHash)).toBe(false);
  });

  test('rejects missing or malformed tracking credentials', () => {
    expect(verifyTrackingToken('', 'a'.repeat(64))).toBe(false);
    expect(verifyTrackingToken('token', 'invalid')).toBe(false);
    expect(verifyTrackingToken(null, null)).toBe(false);
  });
});
