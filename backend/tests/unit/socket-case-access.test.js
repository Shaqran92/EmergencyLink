const Referral = require('../../src/models/Referral');
const Assignment = require('../../src/models/Assignment');
const { canSubscribeToCase } = require('../../src/sockets');

jest.mock('../../src/models/Referral');
jest.mock('../../src/models/Assignment');

describe('Socket.IO case room authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('allows coordinator, system administrator, and observer roles', async () => {
    await expect(canSubscribeToCase({ role: 'coordinator' }, 'CASE-1')).resolves.toBe(true);
    await expect(canSubscribeToCase({ role: 'system_admin' }, 'CASE-1')).resolves.toBe(true);
    await expect(canSubscribeToCase({ role: 'observer' }, 'CASE-1')).resolves.toBe(true);
    expect(Referral.exists).not.toHaveBeenCalled();
    expect(Assignment.exists).not.toHaveBeenCalled();
  });

  test('scopes hospital users to cases referred to their hospital', async () => {
    Referral.exists.mockResolvedValueOnce({ _id: 'referral-1' }).mockResolvedValueOnce(null);

    await expect(canSubscribeToCase(
      { role: 'hospital_staff', hospitalId: 'hospital-1' },
      'CASE-1'
    )).resolves.toBe(true);
    await expect(canSubscribeToCase(
      { role: 'hospital_admin', hospitalId: 'hospital-2' },
      'CASE-1'
    )).resolves.toBe(false);

    expect(Referral.exists).toHaveBeenNthCalledWith(1, {
      caseId: 'CASE-1',
      hospitalId: 'hospital-1'
    });
  });

  test('scopes ambulance staff to cases assigned to their vehicle', async () => {
    Assignment.exists.mockResolvedValueOnce({ _id: 'assignment-1' }).mockResolvedValueOnce(null);

    await expect(canSubscribeToCase(
      { role: 'ambulance_staff', ambulanceId: 'ambulance-1' },
      'CASE-1'
    )).resolves.toBe(true);
    await expect(canSubscribeToCase(
      { role: 'ambulance_staff', ambulanceId: 'ambulance-2' },
      'CASE-1'
    )).resolves.toBe(false);
  });

  test('denies roles without case visibility and users without an assigned scope', async () => {
    await expect(canSubscribeToCase({ role: 'coordinator' }, 'CASE-1')).resolves.toBe(true);
    await expect(canSubscribeToCase({ role: 'public_citizen' }, 'CASE-1')).resolves.toBe(false);
    await expect(canSubscribeToCase({ role: 'hospital_staff' }, 'CASE-1')).resolves.toBe(false);
    await expect(canSubscribeToCase({ role: 'ambulance_staff' }, 'CASE-1')).resolves.toBe(false);
  });
});
