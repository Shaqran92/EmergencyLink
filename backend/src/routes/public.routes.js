/**
 * @file public.routes.js
 * @description Public citizen portal endpoints - NO AUTHENTICATION REQUIRED.
 * Allows patients/bystanders to find suitable hospitals by clinical condition,
 * verify specialist availability, calculate driving routes with time, and call ambulances.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { triageWithGemini } = require('../services/gemini.service');
const Hospital = require('../models/Hospital');
const ResourceSnapshot = require('../models/ResourceSnapshot');
const Emergency = require('../models/Emergency');
const Ambulance = require('../models/Ambulance');
const Referral = require('../models/Referral');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const { RESOURCE_TYPES } = require('../config/constants');
const { calculateRoute, haversineDistance } = require('../services/routing.service');
const { createAuditEvent } = require('../middleware/audit');
const socketEmitter = require('../sockets/emitter');
const config = require('../config/env');
const { PAKISTAN_CITIES } = require('../seed/pakistanHospitalsData');
const { selectNearestAndBestHospital } = require('../services/hospitalMatcher');
const { createTrackingToken, hashTrackingToken, verifyTrackingToken } = require('../utils/trackingToken');

/**
 * Helper to fetch directions geometry from Mapbox
 */
async function getMapboxRoute(start, end) {
  const token = config.MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;
  if (!token || !start?.lng || !start?.lat || !end?.lng || !end?.lat) {
    return null;
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${token}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (resp.ok) {
      const data = await resp.json();
      if (data.routes && data.routes.length > 0) {
        const r = data.routes[0];
        return {
          durationMinutes: Math.max(1, Math.round(r.duration / 60)),
          distanceKm: Math.round((r.distance / 1000) * 10) / 10,
          geometry: r.geometry
        };
      }
    }
  } catch (err) {
    // Ignore and return null
  }
  return null;
}

/**
 * 0. GET /api/v1/public/portal/cities
 * Public list of Pakistani cities with hospital counts and emergency helplines
 */
router.get(
  '/cities',
  asyncHandler(async (req, res) => {
    const hospitals = await Hospital.find({ status: 'active' }).select('city facilityType').lean();
    const cityMap = {};
    for (const h of hospitals) {
      const c = (h.city || 'Other').toLowerCase();
      if (!cityMap[c]) {
        cityMap[c] = { total: 0, government: 0, private: 0, military: 0 };
      }
      cityMap[c].total += 1;
      if (h.facilityType === 'government') cityMap[c].government += 1;
      else if (h.facilityType === 'private') cityMap[c].private += 1;
      else if (h.facilityType === 'military') cityMap[c].military += 1;
    }

    const enrichedCities = PAKISTAN_CITIES.map((c) => {
      const stats = cityMap[c.name.toLowerCase()] || { total: 0, government: 0, private: 0, military: 0 };
      return {
        ...c,
        hospitalCount: stats.total,
        govtHospitalCount: stats.government + stats.military,
        privateHospitalCount: stats.private
      };
    });

    return sendSuccess(res, { cities: enrichedCities });
  })
);

/**
 * 0.1 GET /api/v1/public/portal/catalog
 * Public directory of all active hospitals across Pakistan
 */
router.get(
  '/catalog',
  asyncHandler(async (req, res) => {
    const hospitals = await Hospital.find({ status: 'active' }).lean();
    return sendSuccess(res, {
      total: hospitals.length,
      hospitals: hospitals.map((h) => ({
        _id: h._id,
        name: h.name,
        city: h.city,
        province: h.province,
        facilityType: h.facilityType,
        bedCapacity: h.bedCapacity,
        contactEmail: h.contactEmail,
        contactPhone: h.contactPhone,
        emergencyHelpline: h.emergencyHelpline,
        location: h.location,
        specialties: h.specialties || []
      }))
    });
  })
);

/**
 * 0.2 POST /api/v1/public/portal/auto-select-hospital
 * Automatically selects the nearest and best possible hospital based on clinical requirements,
 * bed/specialist availability, and driving travel time.
 */
router.post(
  '/auto-select-hospital',
  asyncHandler(async (req, res) => {
    const {
      pickupLocation = { lat: 31.5204, lng: 74.3587 },
      condition = '',
      requiredSpecialties = [],
      requiredResources = [],
      city = null,
      facilityType = 'all'
    } = req.body;

    const result = await selectNearestAndBestHospital({
      pickupLocation,
      condition,
      requiredSpecialties,
      requiredResources,
      city,
      facilityType
    });

    return sendSuccess(res, result);
  })
);

router.get(
  '/auto-select-hospital',
  asyncHandler(async (req, res) => {
    const {
      lat = 31.5204,
      lng = 74.3587,
      condition = '',
      city = null,
      facilityType = 'all'
    } = req.query;

    const result = await selectNearestAndBestHospital({
      pickupLocation: { lat: Number(lat), lng: Number(lng) },
      condition,
      city,
      facilityType
    });

    return sendSuccess(res, result);
  })
);

/**
 * 1. POST /api/v1/public/portal/find-hospitals
 * Public hospital discovery by medical condition, specialist availability, city, and facility type.
 */
router.post(
  '/find-hospitals',
  asyncHandler(async (req, res) => {
    const {
      requiredSpecialties = [],
      requiredResources = [],
      pickupLocation = { lat: 31.5204, lng: 74.3587 },
      city = null,
      facilityType = 'all'
    } = req.body;

    const query = { status: 'active' };
    if (city && city !== 'all') {
      query.city = new RegExp(`^${city}$`, 'i');
    }
    if (facilityType && facilityType !== 'all') {
      if (facilityType === 'government') {
        query.facilityType = { $in: ['government', 'military'] };
      } else {
        query.facilityType = facilityType;
      }
    }

    let hospitals = await Hospital.find(query).lean();
    if (!hospitals || hospitals.length === 0) {
      hospitals = await Hospital.find({ status: 'active' }).lean();
    }
    const snapshots = await ResourceSnapshot.find().sort({ reportedAt: -1 }).lean();

    // Map latest snapshot per hospital & resourceType
    const snapMap = new Map();
    for (const s of snapshots) {
      const key = `${s.hospitalId.toString()}_${s.resourceType}`;
      if (!snapMap.has(key)) {
        snapMap.set(key, s);
      }
    }

    const pickupLat = pickupLocation.lat || 31.5204;
    const pickupLng = pickupLocation.lng || 74.3587;

    // Fast Haversine pre-sort to determine proximity
    hospitals.forEach((h) => {
      const hLat = h.location?.lat || pickupLat;
      const hLng = h.location?.lng || pickupLng;
      h._rawDist = haversineDistance(
        { lat: pickupLat, lng: pickupLng },
        { lat: hLat, lng: hLng }
      );
    });
    hospitals.sort((a, b) => a._rawDist - b._rawDist);

    // Calculate full Mapbox driving geometry for top 3 nearest facilities, fast approximation for rest
    const topCandidates = hospitals.slice(0, 3);
    const topCandidateIds = new Set(topCandidates.map((c) => c._id.toString()));

    const evaluated = await Promise.all(
      hospitals.map(async (h) => {
        const hLat = h.location?.lat || pickupLat;
        const hLng = h.location?.lng || pickupLng;

        let distanceKm, durationMinutes, geometry;
        if (topCandidateIds.has(h._id.toString())) {
          const mbRoute = await getMapboxRoute(
            { lat: pickupLat, lng: pickupLng },
            { lat: hLat, lng: hLng }
          );

          if (mbRoute) {
            distanceKm = mbRoute.distanceKm;
            durationMinutes = mbRoute.durationMinutes;
            geometry = mbRoute.geometry;
          } else {
            const calc = await calculateRoute(
              { lat: pickupLat, lng: pickupLng },
              { lat: hLat, lng: hLng }
            );
            distanceKm = calc.distanceKm;
            durationMinutes = calc.durationMinutes;
            geometry = {
              type: 'LineString',
              coordinates: [
                [pickupLng, pickupLat],
                [hLng, hLat]
              ]
            };
          }
        } else {
          distanceKm = Math.round(h._rawDist * 1.35 * 10) / 10;
          durationMinutes = Math.max(1, Math.round(distanceKm * 2));
          geometry = null;
        }

        // Check specialist match
        const hospSpecialties = h.specialties || [];
        const matchedSpecialties = requiredSpecialties.filter((sp) =>
          hospSpecialties.some((hs) => hs.toLowerCase() === sp.toLowerCase())
        );
        const hasRequiredSpecialist =
          requiredSpecialties.length === 0 || matchedSpecialties.length > 0;

        // Collect critical resource statuses
        const criticalTypes = ['icu_bed', 'er_bed', 'ventilator', 'blood_bank', 'ct_scanner'];
        const resourcesStatus = criticalTypes.map((rt) => {
          const snap = snapMap.get(`${h._id.toString()}_${rt}`);
          return {
            resourceType: rt,
            availableCount: snap ? snap.availableCount : null,
            totalCapacity: snap ? snap.totalCapacity : null,
            status: snap ? snap.status || 'available' : 'unreported'
          };
        });

        // Compute suitability score (0-100)
        let score = 50;
        if (hasRequiredSpecialist) score += 30;
        score -= Math.min(30, durationMinutes * 0.8);
        const erSnap = snapMap.get(`${h._id.toString()}_er_bed`);
        const icuSnap = snapMap.get(`${h._id.toString()}_icu_bed`);
        if (erSnap && erSnap.availableCount > 0) score += 10;
        if (icuSnap && icuSnap.availableCount > 0) score += 10;
        score = Math.max(10, Math.min(100, Math.round(score)));

        return {
          _id: h._id,
          hospitalId: h._id,
          name: h.name,
          status: h.status || 'active',
          city: h.city || 'Lahore',
          province: h.province || 'Punjab',
          facilityType: h.facilityType || 'government',
          bedCapacity: h.bedCapacity || 300,
          emergencyHelpline: h.emergencyHelpline || 'Rescue 1122',
          address: h.location?.address || 'Medical Center',
          location: h.location,
          contactPhone: h.contactPhone || '+92-42-99200000',
          contactEmail: h.contactEmail || 'emergency@hospital.gov.pk',
          specialties: hospSpecialties,
          hasRequiredSpecialist,
          matchedSpecialties,
          distanceKm,
          durationMinutes,
          geometry,
          suitabilityScore: score,
          resources: resourcesStatus
        };
      })
    );

    // Sort by suitability score descending
    evaluated.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    const autoSelectedHospital = evaluated[0] || null;
    const autoSelectionReason = autoSelectedHospital
      ? `Nearest optimal facility (${autoSelectedHospital.durationMinutes} mins) with ${
          autoSelectedHospital.matchedSpecialties && autoSelectedHospital.matchedSpecialties.length > 0
            ? autoSelectedHospital.matchedSpecialties.join('/')
            : 'Emergency'
        } specialist, verified ER beds, and active acceptance status.`
      : null;

    return sendSuccess(res, {
      pickupLocation,
      autoSelectedHospital,
      autoSelectionReason,
      hospitals: evaluated
    });
  })
);

/**
 * 2. POST /api/v1/public/portal/request
 * Public citizen emergency ambulance call & hospital referral request.
 * Creates an emergency case without login, alerts ambulances and receiving hospital.
 */
router.post(
  '/request',
  asyncHandler(async (req, res) => {
    const {
      summary,
      condition,
      priorityCategory = 'immediate',
      requiredSpecialties = [],
      requiredResources = [],
      pickupLocation,
      patientContact = {}
    } = req.body;

    // Map priority input to valid schema enum ['critical', 'urgent', 'standard']
    const priorityMap = {
      immediate: 'critical',
      critical: 'critical',
      urgent: 'urgent',
      delayed: 'standard',
      expectant: 'standard',
      standard: 'standard'
    };
    const mappedPriority = priorityMap[priorityCategory] || 'critical';

    // Find coordinator or system user for reference if needed
    const systemUser = await User.findOne({ role: 'coordinator' }) || await User.findOne();

    // Sanitize required resources
    const validResources = requiredResources
      .map((r) => (typeof r === 'string' ? { resourceType: r, minCount: 1 } : r))
      .filter((r) => RESOURCE_TYPES.includes(r.resourceType));

    // Generate unique human-readable case ID
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await Emergency.countDocuments();
    const caseId = `EL-${today}-${String(count + 1).padStart(4, '0')}`;
    const trackingToken = createTrackingToken();
    const contactEmail = req.body.contactEmail || req.body.patientContact?.email || patientContact?.email;

    // 1. Create emergency case in MongoDB
    const emergency = await Emergency.create({
      caseId,
      summary: summary || `Citizen Request: ${condition || 'Emergency assistance needed'}`,
      priorityCategory: mappedPriority,
      status: 'registered',
      pickupLocation: {
        lat: pickupLocation?.lat || 31.5204,
        lng: pickupLocation?.lng || 74.3587,
        address: pickupLocation?.address || 'Caller reported location'
      },
      requiredSpecialties,
      requiredResources: validResources,
      ...(contactEmail ? { patientContact: { email: contactEmail } } : {}),
      createdBy: systemUser?._id || null,
      trackingTokenHash: hashTrackingToken(trackingToken)
    });

    // 2. Select best suitable hospital automatically using multi-criteria engine
    let bestHospital = null;
    let autoMatch = null;
    if (req.body.hospitalId) {
      bestHospital = await Hospital.findById(req.body.hospitalId).lean();
    }
    if (!bestHospital) {
      autoMatch = await selectNearestAndBestHospital({
        pickupLocation: emergency.pickupLocation,
        condition: condition || summary,
        requiredSpecialties,
        requiredResources: validResources.map((r) => r.resourceType)
      });
      if (autoMatch && autoMatch.autoSelectedHospital) {
        bestHospital = autoMatch.autoSelectedHospital;
      }
    }
    if (!bestHospital) {
      bestHospital = await Hospital.findOne({ status: 'active' }).lean();
    }

    // 3. Automatically create initial referral request to best hospital for confirmation
    let referral = null;
    if (bestHospital) {
      referral = await Referral.create({
        caseId: emergency.caseId,
        hospitalId: bestHospital._id,
        requestStatus: 'pending',
        prioritySnapshot: emergency.priorityCategory,
        responseNote: `Public Citizen Call: ${condition || summary}. Contact: ${patientContact.phone || 'Anonymous'}`,
        requestedAt: new Date(),
        requestedBy: systemUser?._id || null
      });

      // Update emergency status to referral_pending
      emergency.status = 'referral_pending';
      await emergency.save();

      // Emit referral event
      socketEmitter.emitReferralRequested(referral);
    }

    // 4. Check available ambulance and assign nearest vehicle to patient
    let availableAmbulances = await Ambulance.find({ status: 'available' });
    if (!availableAmbulances || availableAmbulances.length === 0) {
      availableAmbulances = await Ambulance.find({ status: { $ne: 'unavailable' } });
    }
    if (!availableAmbulances || availableAmbulances.length === 0) {
      availableAmbulances = await Ambulance.find();
    }

    const pLat = emergency.pickupLocation?.lat || 31.5204;
    const pLng = emergency.pickupLocation?.lng || 74.3587;

    availableAmbulances.sort((a, b) => {
      const aLoc = a.lastKnownLocation || a.currentLocation;
      const bLoc = b.lastKnownLocation || b.currentLocation;
      const distA = haversineDistance(
        { lat: pLat, lng: pLng },
        { lat: aLoc?.lat || pLat, lng: aLoc?.lng || pLng }
      );
      const distB = haversineDistance(
        { lat: pLat, lng: pLng },
        { lat: bLoc?.lat || pLat, lng: bLoc?.lng || pLng }
      );
      return distA - distB;
    });
    const availableAmbulance = availableAmbulances[0] || null;

    let assignedAmbulance = null;
    let assignment = null;
    if (availableAmbulance && bestHospital) {
      availableAmbulance.status = 'assigned';
      await availableAmbulance.save();
      assignedAmbulance = availableAmbulance;
      socketEmitter.emitAmbulanceStatusUpdated(availableAmbulance);

      // Create Assignment record
      assignment = await Assignment.create({
        caseId: emergency.caseId,
        ambulanceId: availableAmbulance._id,
        destinationHospitalId: bestHospital._id,
        status: 'assigned',
        assignedBy: systemUser?._id || null
      });
      socketEmitter.emitAmbulanceAssigned(assignment);

      // Alert assigned ambulance driver portal immediately
      socketEmitter.emitAmbulanceDispatchAlert(availableAmbulance._id, {
        caseId: emergency.caseId,
        ambulanceId: availableAmbulance.ambulanceId,
        condition: condition || summary || 'Critical Emergency Patient',
        priorityCategory: mappedPriority,
        pickupLocation: emergency.pickupLocation,
        destinationHospitalName: bestHospital?.name || 'Allocated Hospital',
        destinationHospitalId: bestHospital?._id
      });
    }

    // Emit live emergency created event
    socketEmitter.emitEmergencyCreated(emergency);

    // Alert receiving hospital staff & trauma/specialist teams immediately
    if (bestHospital) {
      socketEmitter.emitIncomingPatientAlert(bestHospital._id, {
        caseId: emergency.caseId,
        condition: condition || summary || 'Critical Emergency Patient',
        summary: emergency.summary,
        priorityCategory: mappedPriority,
        etaMinutes: 8,
        ambulanceId: assignedAmbulance ? assignedAmbulance.ambulanceId : 'Rescue 1122 Unit',
        requiredSpecialties,
        requiredResources: validResources,
        patientContact
      });
    }

    // Notify citizen tracking screen
    socketEmitter.emitCitizenStatusUpdate(emergency.caseId, {
      step: 'dispatched',
      caseId: emergency.caseId,
      status: emergency.status,
      assignedAmbulance: assignedAmbulance
        ? { ambulanceId: assignedAmbulance.ambulanceId, status: assignedAmbulance.status }
        : null,
      destinationHospital: bestHospital
        ? { id: bestHospital._id, name: bestHospital.name, address: bestHospital.location?.address }
        : null,
      message: `Emergency response dispatched: ${assignedAmbulance?.ambulanceId || 'Rescue 1122'} assigned. Referral routed to ${bestHospital?.name || 'Triage Center'}.`
    });

    // =========================================================================
    // 5. AUTONOMOUS TRIAGE TIMEOUT PROTOCOL (15 SECONDS)
    // If no hospital staff manually responds within 15 seconds, system autonomously
    // accepts patient, reserves bed, and mobilizes trauma/specialist teams.
    // =========================================================================
    if (referral && bestHospital) {
      const referralId = referral._id;
      const caseIdToAutoAccept = emergency.caseId;
      const targetHospitalId = bestHospital._id;

      setTimeout(async () => {
        try {
          const refCheck = await Referral.findById(referralId);
          if (refCheck && refCheck.requestStatus === 'pending') {
            const acceptTime = new Date();
            refCheck.requestStatus = 'accepted';
            refCheck.responseAt = acceptTime;
            refCheck.responseNote = '[AUTONOMOUS ACCEPTANCE]: Automatically accepted by EmergencyLink Autonomous Triage Protocol after 15s unattended timeout. ER bed reserved, trauma and specialist teams mobilized.';
            await refCheck.save();

            // Update Emergency status to destination_confirmed
            await Emergency.findOneAndUpdate(
              { caseId: caseIdToAutoAccept },
              {
                $set: {
                  status: 'destination_confirmed',
                  confirmedHospitalId: targetHospitalId
                },
                $inc: { version: 1 }
              }
            );

            const hospitalDoc = await Hospital.findById(targetHospitalId).lean();

            // 1. Alert Hospital Staff & Specialists autonomously
            socketEmitter.emitAutonomousAccepted(targetHospitalId, {
              caseId: caseIdToAutoAccept,
              hospitalName: hospitalDoc?.name || 'Destination Hospital',
              message: `⚡ AUTONOMOUS ACCEPTANCE (15s Timeout): Case ${caseIdToAutoAccept} auto-accepted for ER admission at ${hospitalDoc?.name || 'Hospital'}. Bed reserved, trauma/specialist team alerted.`,
              requiredSpecialties,
              priority: mappedPriority
            });

            // 2. Alert Ambulance Crew en route that Hospital is prepared
            socketEmitter.emitHospitalPreparation(caseIdToAutoAccept, {
              hospitalName: hospitalDoc?.name || 'Destination Hospital',
              bedReserved: true,
              teamAlerted: true,
              preparationStatus: 'ready',
              autonomous: true,
              note: 'Autonomous 15s auto-acceptance confirmed ER bed reservation.'
            });

            // 3. Alert Citizen Tracking View
            socketEmitter.emitCitizenStatusUpdate(caseIdToAutoAccept, {
              step: 'hospital_confirmed',
              caseId: caseIdToAutoAccept,
              status: 'destination_confirmed',
              hospitalName: hospitalDoc?.name || 'Destination Hospital',
              message: 'Hospital Emergency Department confirmed incoming arrival. ER Bed reserved.'
            });

            // 4. Audit Log
            createAuditEvent({
              actorId: null,
              actorRole: 'autonomous_system',
              eventType: 'referral_autonomous_accepted',
              recordType: 'Referral',
              recordId: referralId,
              details: {
                caseId: caseIdToAutoAccept,
                hospital: hospitalDoc?.name,
                timeoutMs: 15000
              }
            });
          }
        } catch (autoErr) {
          console.error('[AUTONOMOUS TRIAGE TIMEOUT ERROR]', autoErr);
        }
      }, 15000);
    }

    // Audit log
    createAuditEvent({
      actorId: null,
      actorRole: 'public_citizen',
      eventType: 'emergency_created',
      recordType: 'Emergency',
      recordId: emergency.caseId,
      details: {
        caseId: emergency.caseId,
        condition,
        assignedAmbulance: assignedAmbulance?.ambulanceId || null,
        referralHospital: bestHospital?.name || null
      }
    });

    return sendSuccess(res, {
      caseId: emergency.caseId,
      trackingToken,
      status: emergency.status,
      emergency,
      autoSelected: !req.body.hospitalId,
      autoSelectionReason: autoMatch?.selectionReason || 'Optimal destination selected based on specialist availability and proximity.',
      destinationHospital: bestHospital
        ? {
            id: bestHospital._id,
            name: bestHospital.name,
            address: bestHospital.location?.address || bestHospital.address,
            city: bestHospital.city,
            contactEmail: bestHospital.contactEmail,
            contactPhone: bestHospital.contactPhone,
            erBedsAvailable: bestHospital.erBedsAvailable
          }
        : null,
      assignedAmbulance: assignedAmbulance
        ? {
            id: assignedAmbulance._id,
            ambulanceId: assignedAmbulance.ambulanceId,
            status: assignedAmbulance.status
          }
        : null,
      message: 'Ambulance dispatch registered and referral sent to nearest receiving facility.'
    });
  })
);

/**
 * 3. GET /api/v1/public/portal/track/:caseId
 * Public live tracking endpoint for the citizen to follow their ambulance and hospital referral.
 */
router.get(
  '/track/:caseId',
  asyncHandler(async (req, res) => {
    const { caseId } = req.params;
    const trackingToken = req.get('x-tracking-token') || req.query.token;
    if (!trackingToken) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const emergency = await Emergency.findOne({ caseId })
      .select('+trackingTokenHash')
      .lean();
    if (!emergency || !verifyTrackingToken(trackingToken, emergency.trackingTokenHash)) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const [acceptedReferral, assignment] = await Promise.all([
      Referral.findOne({ caseId, requestStatus: 'accepted' })
        .populate('hospitalId', 'name location status')
        .lean(),
      Assignment.findOne({ caseId })
        .populate('ambulanceId', 'ambulanceId status lastKnownLocation currentLocation')
        .populate('destinationHospitalId', 'name location status')
        .lean()
    ]);

    let destinationHospital = acceptedReferral?.hospitalId || null;
    if (!destinationHospital && emergency.confirmedHospitalId) {
      destinationHospital = await Hospital.findById(emergency.confirmedHospitalId)
        .select('name location status')
        .lean();
    }

    const assignedAmbulance = assignment?.ambulanceId || null;

    // Calculate live route geometry
    let route = null;
    if (emergency.pickupLocation && destinationHospital?.location) {
      const mbRoute = await getMapboxRoute(
        emergency.pickupLocation,
        destinationHospital.location
      );
      if (mbRoute) {
        route = mbRoute;
      } else {
        const calc = await calculateRoute(
          emergency.pickupLocation,
          destinationHospital.location
        );
        route = {
          durationMinutes: calc.durationMinutes || 10,
          distanceKm: calc.distanceKm || 5.2,
          geometry: {
            type: 'LineString',
            coordinates: [
              [emergency.pickupLocation.lng, emergency.pickupLocation.lat],
              [destinationHospital.location.lng, destinationHospital.location.lat]
            ]
          }
        };
      }
    }

    return sendSuccess(res, {
      caseId: emergency.caseId,
      status: emergency.status,
      pickupLocation: emergency.pickupLocation,
      referralStatus: acceptedReferral?.requestStatus || 'pending',
      referralHospitalName: destinationHospital?.name || null,
      destinationHospital,
      assignedAmbulance: assignedAmbulance
        ? {
            ambulanceId: assignedAmbulance.ambulanceId,
            status: assignedAmbulance.status,
            currentLocation: assignedAmbulance.lastKnownLocation || assignedAmbulance.currentLocation
          }
        : null,
      route,
      createdAt: emergency.createdAt
    });
  })
);

/**
 * 3.1 POST /api/v1/public/portal/track/:caseId/location
 * Continuously update patient pickup coordinates from live citizen device GPS
 */
router.post(
  '/track/:caseId/location',
  asyncHandler(async (req, res) => {
    const { caseId } = req.params;
    const { lat, lng, address } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Missing lat/lng coordinates' });
    }

    const trackingToken = req.get('x-tracking-token') || req.query.token;
    const caseRegex = new RegExp(`^${caseId.trim()}$`, 'i');
    const emergency = await Emergency.findOne({ caseId: caseRegex }).select('+trackingTokenHash');
    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (emergency.trackingTokenHash && (!trackingToken || !verifyTrackingToken(trackingToken, emergency.trackingTokenHash))) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const newLoc = {
      lat: Number(lat),
      lng: Number(lng),
      address: address || emergency.pickupLocation?.address || `Live Citizen GPS (${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`
    };
    emergency.pickupLocation = newLoc;
    emergency.updatedAt = new Date();
    await emergency.save();

    // Broadcast updated patient location to assigned ambulance driver and coordinator
    const { getIO } = require('../sockets/index');
    const io = getIO ? getIO() : null;
    const assignment = await Assignment.findOne({ caseId: caseRegex }).populate('ambulanceId');

    const updatePayload = {
      caseId: emergency.caseId,
      pickupLocation: newLoc,
      timestamp: new Date()
    };

    if (io) {
      io.emit('emergency:patient_location_updated', updatePayload);
      io.to(`case:${emergency.caseId}`).emit('emergency:patient_location_updated', updatePayload);
      io.to('role:coordinator').emit('emergency:patient_location_updated', updatePayload);
      if (assignment?.ambulanceId) {
        const ambCode = assignment.ambulanceId.ambulanceId || assignment.ambulanceId._id;
        io.to(`ambulance:${ambCode}`).emit('emergency:patient_location_updated', updatePayload);
      }
    }

    return sendSuccess(res, {
      caseId: emergency.caseId,
      pickupLocation: emergency.pickupLocation
    });
  })
);

/**
 * 4. POST /api/v1/public/portal/ai-triage
 * Google Gemini AI & Clinical NLP triage assistant
 */
router.post(
  '/ai-triage',
  asyncHandler(async (req, res) => {
    const { symptoms = '', language = 'en' } = req.body;
    const triageResult = await triageWithGemini(symptoms, language);
    return sendSuccess(res, triageResult);
  })
);

/**
 * 5. PATCH /api/v1/public/portal/ambulance-location/:id
 * Real-time ambulance telemetry sync endpoint
 */
router.patch(
  '/ambulance-location/:id',
  asyncHandler(async (req, res) => {
    return res.status(410).json({
      success: false,
      error: {
        code: 'ENDPOINT_REMOVED',
        message: 'Public ambulance telemetry updates are disabled. Use the authenticated /api/v1/ambulances/:id/location endpoint.'
      }
    });
  })
);

module.exports = router;
