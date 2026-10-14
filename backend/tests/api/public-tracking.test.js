const request = require('supertest');
const app = require('../../src/app');
const Emergency = require('../../src/models/Emergency');
const Referral = require('../../src/models/Referral');
const Assignment = require('../../src/models/Assignment');
const { hashTrackingToken } = require('../../src/utils/trackingToken');

jest.mock('../../src/models/Emergency');
jest.mock('../../src/models/Referral');
jest.mock('../../src/models/Assignment');

describe('Public case tracking access', () => {
  const trackingToken = 'private-tracking-credential';
  const caseId = 'EL-20261014-0001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not look up cases when the tracking credential is missing', async () => {
    const response = await request(app)
      .get(`/api/v1/public/portal/track/${caseId}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Case not found');
    expect(Emergency.findOne).not.toHaveBeenCalled();
  });

  test('rejects an incorrect tracking credential without exposing case details', async () => {
    const emergency = {
      caseId,
      trackingTokenHash: hashTrackingToken(trackingToken)
    };
    Emergency.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(emergency)
      })
    });

    const response = await request(app)
      .get(`/api/v1/public/portal/track/${caseId}`)
      .set('X-Tracking-Token', 'wrong-token');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Case not found');
    expect(response.body.data).toBeUndefined();
    expect(Referral.findOne).not.toHaveBeenCalled();
    expect(Assignment.findOne).not.toHaveBeenCalled();
  });

  test('returns only the matching case assignment after valid token verification', async () => {
    const emergency = {
      caseId,
      status: 'ambulance_assigned',
      trackingTokenHash: hashTrackingToken(trackingToken),
      pickupLocation: { lat: 31.5, lng: 74.3, address: 'Demo pickup' },
      summary: 'Must not be exposed',
      createdAt: new Date()
    };
    Emergency.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(emergency)
      })
    });
    const acceptedReferralQuery = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null)
    };
    Referral.findOne.mockReturnValue(acceptedReferralQuery);
    const assignment = {
      caseId,
      ambulanceId: {
        ambulanceId: 'AMB-CASE-01',
        status: 'en_route',
        lastKnownLocation: { lat: 31.51, lng: 74.31 }
      },
      destinationHospitalId: { name: 'Assigned destination', location: null }
    };
    const assignmentQuery = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(assignment)
    };
    Assignment.findOne.mockReturnValue(assignmentQuery);

    const response = await request(app)
      .get(`/api/v1/public/portal/track/${caseId}`)
      .set('X-Tracking-Token', trackingToken);

    expect(response.status).toBe(200);
    expect(Assignment.findOne).toHaveBeenCalledWith({ caseId });
    expect(response.body.data.assignedAmbulance.ambulanceId).toBe('AMB-CASE-01');
    expect(response.body.data.summary).toBeUndefined();
    expect(response.body.data.trackingTokenHash).toBeUndefined();
    expect(response.body.data.destinationHospital).toBeNull();
  });

  test('does not allow public ambulance telemetry updates', async () => {
    const response = await request(app)
      .patch('/api/v1/public/portal/ambulance-location/AMB-CASE-01')
      .send({ lat: 31.5, lng: 74.3 });

    expect(response.status).toBe(410);
    expect(response.body.error.code).toBe('ENDPOINT_REMOVED');
  });
});
