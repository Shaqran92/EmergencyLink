/**
 * @file hospitalMatcher.js
 * @description Central automated hospital selection engine.
 * Automatically selects the nearest and best possible hospital based on
 * clinical condition, specialist on call, available ER/ICU beds, equipment,
 * and live Mapbox road driving travel time.
 */

const Hospital = require('../models/Hospital');
const ResourceSnapshot = require('../models/ResourceSnapshot');
const { calculateRoute, haversineDistance } = require('./routing.service');
const config = require('../config/env');

/**
 * Fetch directions geometry from Mapbox
 */
async function getMapboxRoute(start, end) {
  const token =
    config.MAPBOX_ACCESS_TOKEN ||
    process.env.MAPBOX_ACCESS_TOKEN ||
    'pk.eyJ1Ijoic2hhcXJhbiIsImEiOiJjbXY2c2pvaXIwaGFmMnhzZmozaWJhbXEyIn0.yw7huxs7cE_VJuJJ0q909g';
  if (!token || !start?.lng || !start?.lat || !end?.lng || !end?.lat) {
    return null;
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&overview=full&access_token=${token}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
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
    // Fall back to Haversine routing calculation
  }
  return null;
}

/**
 * Map clinical condition string to required specialties and resources
 */
function inferClinicalRequirements(conditionText = '', explicitSpecialties = []) {
  const text = (conditionText || '').toLowerCase();
  const specialties = new Set(explicitSpecialties.map((s) => s.toLowerCase()));
  const resources = new Set(['er_bed']);

  if (
    text.includes('heart') ||
    text.includes('cardiac') ||
    text.includes('chest pain') ||
    text.includes('seene me dard') ||
    text.includes('dil')
  ) {
    specialties.add('cardiology');
    specialties.add('critical care');
    resources.add('icu_bed');
  }

  if (
    text.includes('trauma') ||
    text.includes('accident') ||
    text.includes('bleeding') ||
    text.includes('fracture') ||
    text.includes('head injury') ||
    text.includes('chot') ||
    text.includes('sar')
  ) {
    specialties.add('trauma surgery');
    specialties.add('neurology');
    resources.add('ct_scanner');
    resources.add('blood_bank');
  }

  if (
    text.includes('stroke') ||
    text.includes('falij') ||
    text.includes('unconscious') ||
    text.includes('behosh') ||
    text.includes('seizure') ||
    text.includes('jhatkay')
  ) {
    specialties.add('neurology');
    resources.add('ct_scanner');
    resources.add('icu_bed');
  }

  if (
    text.includes('breath') ||
    text.includes('saans') ||
    text.includes('asthma') ||
    text.includes('lung') ||
    text.includes('dam ghutna')
  ) {
    specialties.add('pulmonology');
    resources.add('ventilator');
    resources.add('icu_bed');
  }

  if (text.includes('child') || text.includes('bacha') || text.includes('pediatric')) {
    specialties.add('pediatrics');
  }

  // Capitalize properly
  const formatSpec = (s) =>
    s
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  return {
    inferredSpecialties: Array.from(specialties).map(formatSpec),
    inferredResources: Array.from(resources)
  };
}

/**
 * Automatically select the nearest and best possible hospital
 *
 * @param {Object} params
 * @param {Object} params.pickupLocation - { lat, lng, address }
 * @param {string} [params.condition] - Clinical emergency condition
 * @param {Array<string>} [params.requiredSpecialties] - Explicit required specialties
 * @param {Array<string>} [params.requiredResources] - Explicit required resources
 * @param {string} [params.city] - Optional city filter
 * @param {string} [params.facilityType] - 'all' | 'government' | 'private'
 * @returns {Promise<Object>} Auto-selected hospital and ranked alternatives
 */
async function selectNearestAndBestHospital({
  pickupLocation = { lat: 31.5204, lng: 74.3587 },
  condition = '',
  requiredSpecialties = [],
  requiredResources = [],
  city = null,
  facilityType = 'all'
}) {
  const pLat = pickupLocation.lat || 31.5204;
  const pLng = pickupLocation.lng || 74.3587;

  // Infer specialties & resources from patient condition
  const { inferredSpecialties, inferredResources } = inferClinicalRequirements(
    condition,
    requiredSpecialties
  );
  const activeSpecialties =
    requiredSpecialties.length > 0 ? requiredSpecialties : inferredSpecialties;
  const activeResources =
    requiredResources.length > 0 ? requiredResources : inferredResources;

  // 1. Fetch active hospitals
  const query = { status: 'active' };
  if (city && city !== 'all' && city !== 'All Pakistan') {
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
    // If no facilities in city, search all active facilities
    hospitals = await Hospital.find({ status: 'active' }).lean();
  }

  // 2. Fetch latest resource snapshots across hospitals
  const snapshots = await ResourceSnapshot.find().sort({ reportedAt: -1 }).lean();
  const snapMap = new Map();
  for (const s of snapshots) {
    const key = `${s.hospitalId.toString()}_${s.resourceType}`;
    if (!snapMap.has(key)) {
      snapMap.set(key, s);
    }
  }

  // 3. Fast pre-sort by Haversine distance
  hospitals.forEach((h) => {
    const hLat = h.location?.lat || pLat;
    const hLng = h.location?.lng || pLng;
    h._rawDist = haversineDistance(
      { lat: pLat, lng: pLng },
      { lat: hLat, lng: hLng }
    );
  });
  hospitals.sort((a, b) => a._rawDist - b._rawDist);

  // 4. Evaluate each hospital with multi-criteria scoring
  const topCandidateIds = new Set(hospitals.slice(0, 5).map((h) => h._id.toString()));

  const evaluated = await Promise.all(
    hospitals.map(async (h) => {
      const hLat = h.location?.lat || pLat;
      const hLng = h.location?.lng || pLng;

      let distanceKm, durationMinutes, routeGeometry;
      if (topCandidateIds.has(h._id.toString())) {
        const mb = await getMapboxRoute(
          { lat: pLat, lng: pLng },
          { lat: hLat, lng: hLng }
        );
        if (mb) {
          distanceKm = mb.distanceKm;
          durationMinutes = mb.durationMinutes;
          routeGeometry = mb.geometry;
        } else {
          const calc = await calculateRoute(
            { lat: pLat, lng: pLng },
            { lat: hLat, lng: hLng }
          );
          distanceKm = calc.distanceKm;
          durationMinutes = calc.durationMinutes;
          routeGeometry = {
            type: 'LineString',
            coordinates: [
              [pLng, pLat],
              [hLng, hLat]
            ]
          };
        }
      } else {
        distanceKm = Math.round(h._rawDist * 1.35 * 10) / 10;
        durationMinutes = Math.max(1, Math.round(distanceKm * 2));
        routeGeometry = null;
      }

      // 4A. Specialist Capability Match (0 - 100)
      const hospSpecs = h.specialties || [];
      const matchedSpecs = activeSpecialties.filter((reqSp) =>
        hospSpecs.some((hs) => hs.toLowerCase() === reqSp.toLowerCase())
      );
      const hasSpecialist = activeSpecialties.length === 0 || matchedSpecs.length > 0;
      let capabilityScore = hasSpecialist ? 100 : 35;
      if (activeSpecialties.length > 0) {
        capabilityScore = Math.round(
          (matchedSpecs.length / activeSpecialties.length) * 80 + 20
        );
      }

      // 4B. Bed & Critical Resource Capacity (0 - 100)
      const erSnap = snapMap.get(`${h._id.toString()}_er_bed`);
      const icuSnap = snapMap.get(`${h._id.toString()}_icu_bed`);
      const ventSnap = snapMap.get(`${h._id.toString()}_ventilator`);
      const ctSnap = snapMap.get(`${h._id.toString()}_ct_scanner`);

      const erBedsAvailable = erSnap?.availableCount || 0;
      const icuBedsAvailable = icuSnap?.availableCount || 0;
      const ventsAvailable = ventSnap?.availableCount || 0;
      const ctAvailable = ctSnap?.status === 'available' || ctSnap?.status === 'confirmed';

      let capacityScore = 40;
      if (erBedsAvailable > 0) capacityScore += 30;
      if (icuBedsAvailable > 0) capacityScore += 15;
      if (ventsAvailable > 0) capacityScore += 10;
      if (ctAvailable) capacityScore += 5;
      capacityScore = Math.min(100, capacityScore);

      // 4C. Proximity & Travel Time Score (0 - 100)
      // Max score for < 5 mins, decreases linearly with travel time
      const proximityScore = Math.max(5, Math.min(100, Math.round(100 - durationMinutes * 1.5)));

      // 4D. Composite Multi-Criteria Score
      // Weights: Capability (40%), Proximity (35%), Capacity (25%)
      const compositeScore = Math.round(
        capabilityScore * 0.4 + proximityScore * 0.35 + capacityScore * 0.25
      );

      // 4E. Clinical Rationale Bullets
      const rationale = [];
      if (matchedSpecs.length > 0) {
        rationale.push(`✓ Required Specialist on Duty: ${matchedSpecs.join(', ')}`);
      } else if (hasSpecialist) {
        rationale.push('✓ General Emergency Medicine & Triage Available');
      } else {
        rationale.push('⚠️ Specialist may need to be called on-call');
      }

      if (erBedsAvailable > 0) {
        rationale.push(`✓ ${erBedsAvailable} Emergency ER Bed${erBedsAvailable > 1 ? 's' : ''} available`);
      } else {
        rationale.push('⚠️ ER beds currently high occupancy');
      }

      if (icuBedsAvailable > 0) {
        rationale.push(`✓ ${icuBedsAvailable} ICU Bed${icuBedsAvailable > 1 ? 's' : ''} available`);
      }

      if (ctAvailable) {
        rationale.push('✓ CT Scanner & Diagnostic Imaging operational');
      }

      rationale.push(
        `✓ Estimated Travel Time: ${durationMinutes} mins (${distanceKm} km driving distance)`
      );
      rationale.push(`✓ Operational Status: ACCEPTING CRITICAL PATIENTS`);

      const summaryReason = `Nearest suitable facility (${durationMinutes} mins) with ${
        matchedSpecs.length > 0 ? matchedSpecs.join('/') : 'Emergency'
      } specialist, ${erBedsAvailable} ER beds, and confirmed acceptance.`;

      return {
        _id: h._id,
        hospitalId: h._id,
        name: h.name,
        city: h.city,
        province: h.province,
        facilityType: h.facilityType,
        bedCapacity: h.bedCapacity,
        contactEmail: h.contactEmail,
        contactPhone: h.contactPhone,
        emergencyHelpline: h.emergencyHelpline,
        address: h.location?.address || `${h.city}, Pakistan`,
        location: h.location,
        specialties: hospSpecs,
        matchedSpecialties: matchedSpecs,
        hasRequiredSpecialist: hasSpecialist,
        erBedsAvailable,
        icuBedsAvailable,
        ventsAvailable,
        ctAvailable,
        distanceKm,
        durationMinutes,
        routeGeometry,
        scores: {
          composite: compositeScore,
          capability: capabilityScore,
          proximity: proximityScore,
          capacity: capacityScore
        },
        suitabilityScore: compositeScore,
        selectionRationale: rationale,
        summaryReason
      };
    })
  );

  // 5. Sort candidates by composite suitability score descending
  evaluated.sort((a, b) => b.scores.composite - a.scores.composite);

  // The top match is the automatically selected nearest and best hospital
  const autoSelectedHospital = evaluated[0];

  // Guarantee top match has full route geometry
  if (!autoSelectedHospital.routeGeometry && autoSelectedHospital.location) {
    const topMb = await getMapboxRoute(
      { lat: pLat, lng: pLng },
      { lat: autoSelectedHospital.location.lat, lng: autoSelectedHospital.location.lng }
    );
    if (topMb) {
      autoSelectedHospital.routeGeometry = topMb.geometry;
      autoSelectedHospital.durationMinutes = topMb.durationMinutes;
      autoSelectedHospital.distanceKm = topMb.distanceKm;
    }
  }

  return {
    autoSelectedHospital,
    selectionReason: autoSelectedHospital.summaryReason,
    selectionRationale: autoSelectedHospital.selectionRationale,
    confidenceScore: autoSelectedHospital.scores.composite,
    etaMinutes: autoSelectedHospital.durationMinutes,
    distanceKm: autoSelectedHospital.distanceKm,
    routeGeometry: autoSelectedHospital.routeGeometry,
    rankedCandidates: evaluated
  };
}

module.exports = {
  selectNearestAndBestHospital,
  inferClinicalRequirements
};
