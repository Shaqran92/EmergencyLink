/**
 * @file routing.service.js
 * @description Routing and ETA service with real OpenRouteService integration and Haversine fallback.
 */

const config = require('../config/env');

/**
 * Calculate straight-line Haversine distance in kilometers
 * Supports either:
 * - haversineDistance({lat, lng}, {lat, lng})
 * - haversineDistance(lat1, lon1, lat2, lon2)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  let pLat1 = lat1;
  let pLon1 = lon1;
  let pLat2 = lat2;
  let pLon2 = lon2;

  if (typeof lat1 === 'object' && lat1 !== null) {
    pLat1 = lat1.lat ?? lat1.latitude ?? 0;
    pLon1 = lat1.lng ?? lat1.lon ?? lat1.longitude ?? 0;
    pLat2 = lon1?.lat ?? lon1?.latitude ?? 0;
    pLon2 = lon1?.lng ?? lon1?.lon ?? lon1?.longitude ?? 0;
  }

  const R = 6371;
  const dLat = ((pLat2 - pLat1) * Math.PI) / 180;
  const dLon = ((pLon2 - pLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((pLat1 * Math.PI) / 180) *
      Math.cos((pLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get route distance and travel duration between two coordinates
 * Uses OpenRouteService if API key is configured, otherwise uses Haversine urban estimate.
 *
 * @param {{lat: number, lng: number}} start
 * @param {{lat: number, lng: number}} end
 * @returns {Promise<{distanceKm: number, durationMinutes: number, etaMinRange: number, etaMaxRange: number, provider: string}>}
 */
async function calculateRoute(start, end) {
  const apiKey = config.OPENROUTESERVICE_API_KEY;

  if (apiKey && apiKey.length > 20 && start && end && start.lat && start.lng && end.lat && end.lng) {
    try {
      const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat]
          ]
        }),
        signal: AbortSignal.timeout(4000)
      });

      if (response.ok) {
        const data = await response.json();
        const route = data.routes?.[0]?.summary;
        if (route) {
          const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
          const durationMinutes = Math.max(1, Math.round(route.duration / 60));
          const etaMinRange = Math.max(1, Math.round(durationMinutes * 0.85));
          const etaMaxRange = Math.round(durationMinutes * 1.35);

          return {
            distanceKm,
            durationMinutes,
            etaMinRange,
            etaMaxRange,
            provider: 'OpenRouteService'
          };
        }
      }
    } catch (err) {
      // Fall through to Haversine fallback
    }
  }

  // Haversine fallback (40 km/h urban average with 1.3 detour factor)
  const straightLine = haversineDistance(start?.lat || 0, start?.lng || 0, end?.lat || 0, end?.lng || 0);
  const roadDistance = straightLine * 1.3;
  const durationMinutes = Math.max(2, Math.round((roadDistance / 40) * 60));

  return {
    distanceKm: Math.round(roadDistance * 10) / 10,
    durationMinutes,
    etaMinRange: Math.max(1, Math.round(durationMinutes * 0.8)),
    etaMaxRange: Math.round(durationMinutes * 1.4),
    provider: 'Haversine Urban Model'
  };
}

module.exports = {
  calculateRoute,
  haversineDistance
};
