/**
 * @file sockets/emitter.js
 * @description Real-time WebSocket event emitters targeting role and case-specific rooms.
 */

const { getIO } = require('./index');

/**
 * Emit event when a new emergency is registered
 * @param {Object} emergency
 */
const emitEmergencyCreated = (emergency) => {
  const io = getIO();
  if (!io) return;

  const payload = {
    id: emergency._id,
    caseId: emergency.caseId,
    status: emergency.status,
    priorityCategory: emergency.priorityCategory,
    timestamp: emergency.createdAt || new Date()
  };

  io.to('role:coordinator').emit('emergency:created', payload);
};

/**
 * Emit event when emergency lifecycle status changes
 * @param {Object} emergency
 */
const emitEmergencyStatusUpdated = (emergency) => {
  const io = getIO();
  if (!io) return;

  const payload = {
    id: emergency._id,
    caseId: emergency.caseId,
    status: emergency.status,
    confirmedHospitalId: emergency.confirmedHospitalId ? emergency.confirmedHospitalId.toString() : null,
    timestamp: new Date()
  };

  io.to('role:coordinator').emit('emergency:status_updated', payload);

  if (emergency.caseId) {
    io.to(`case:${emergency.caseId}`).emit('emergency:status_updated', payload);
  }

  if (emergency.confirmedHospitalId) {
    const hospitalIdStr = emergency.confirmedHospitalId.toString();
    io.to(`hospital:${hospitalIdStr}`).emit('emergency:status_updated', payload);
  }
};

/**
 * Emit event when hospital resources are updated
 * @param {string} hospitalId
 * @param {Array<Object>|Object} resources
 */
const emitResourceUpdated = (hospitalId, resources) => {
  const io = getIO();
  if (!io) return;

  const payload = {
    hospitalId: hospitalId.toString(),
    resources,
    timestamp: new Date()
  };

  io.to('role:coordinator').emit('resource:updated', payload);
  io.to(`hospital:${hospitalId.toString()}`).emit('resource:updated', payload);
};

/**
 * Emit event when a hospital resource becomes stale
 * @param {string} hospitalId
 * @param {Object} resource
 */
const emitResourceStale = (hospitalId, resource) => {
  const io = getIO();
  if (!io) return;

  const payload = {
    hospitalId: hospitalId.toString(),
    resourceType: resource.resourceType,
    ageMinutes: resource.ageMinutes,
    status: resource.status || 'stale',
    timestamp: new Date()
  };

  io.to('role:coordinator').emit('resource:stale', payload);
  io.to(`hospital:${hospitalId.toString()}`).emit('resource:stale', payload);
};

/**
 * Emit event when a referral request is issued to a hospital
 * @param {Object} referral
 */
const emitReferralRequested = (referral) => {
  const io = getIO();
  if (!io) return;

  const hospitalIdStr = referral.hospitalId?._id
    ? referral.hospitalId._id.toString()
    : referral.hospitalId?.toString();

  const payload = {
    id: referral._id,
    caseId: referral.caseId,
    hospitalId: hospitalIdStr,
    requestStatus: referral.requestStatus,
    requestedAt: referral.requestedAt || new Date()
  };

  if (hospitalIdStr) {
    io.to(`hospital:${hospitalIdStr}`).emit('referral:requested', payload);
  }
  io.to('role:coordinator').emit('referral:requested', payload);
};

/**
 * Emit event when a hospital responds to a referral
 * @param {Object} referral
 */
const emitReferralResponded = (referral) => {
  const io = getIO();
  if (!io) return;

  const payload = {
    id: referral._id,
    caseId: referral.caseId,
    hospitalId: referral.hospitalId?._id ? referral.hospitalId._id.toString() : referral.hospitalId?.toString(),
    requestStatus: referral.requestStatus,
    responseAt: referral.responseAt || new Date()
  };

  io.to('role:coordinator').emit('referral:responded', payload);

  if (referral.caseId) {
    io.to(`case:${referral.caseId}`).emit('referral:responded', payload);
  }
};

/**
 * Emit event when ambulance status or telemetry updates
 * @param {Object} ambulance
 */
const emitAmbulanceStatusUpdated = (ambulance) => {
  const io = getIO();
  if (!io) return;

  const ambulanceIdStr = ambulance.ambulanceId || ambulance._id.toString();
  const payload = {
    id: ambulance._id,
    ambulanceId: ambulance.ambulanceId,
    status: ambulance.status,
    lastKnownLocation: ambulance.lastKnownLocation || null,
    currentLocation: ambulance.lastKnownLocation || null,
    timestamp: new Date()
  };

  io.emit('ambulance:status_updated', payload);
  io.emit('ambulance:location_updated', payload);
  io.to('role:coordinator').emit('ambulance:status_updated', payload);
  io.to(`ambulance:${ambulanceIdStr}`).emit('ambulance:status_updated', payload);
};

/**
 * Emit event when offline sync conflict occurs
 * @param {Object} conflict
 */
const emitSyncConflict = (conflict) => {
  const io = getIO();
  if (!io) return;

  const payload = {
    id: conflict._id,
    clientEventId: conflict.clientEventId,
    type: conflict.type,
    conflictStatus: conflict.conflictStatus || 'needs_review',
    timestamp: new Date()
  };

  io.to('role:coordinator').emit('sync:conflict', payload);
};

/**
 * Emit event when ambulance is assigned to an emergency
 * @param {Object} assignment
 */
const emitAmbulanceAssigned = (assignment) => {
  const io = getIO();
  if (!io) return;

  const payload = {
    id: assignment._id,
    caseId: assignment.caseId,
    ambulanceId: assignment.ambulanceId ? assignment.ambulanceId.toString() : null,
    destinationHospitalId: assignment.destinationHospitalId ? assignment.destinationHospitalId.toString() : null,
    status: assignment.status,
    timestamp: new Date()
  };

  io.to('role:coordinator').emit('ambulance:assigned', payload);
  if (assignment.ambulanceId) {
    io.to(`ambulance:${assignment.ambulanceId.toString()}`).emit('ambulance:assigned', payload);
  }
};

/**
 * Emit event when a critical patient is incoming to a hospital
 * Alerts receiving hospital staff, trauma team, neuro/cardiac specialists, and coordinators.
 * @param {string} hospitalId
 * @param {Object} alertData
 */
const emitIncomingPatientAlert = (hospitalId, alertData) => {
  const io = getIO();
  if (!io) return;

  const hospitalIdStr = hospitalId?.toString();
  const payload = {
    caseId: alertData.caseId,
    hospitalId: hospitalIdStr,
    condition: alertData.condition || alertData.summary || 'Critical Patient',
    priority: alertData.priorityCategory || alertData.priority || 'critical',
    etaMinutes: alertData.etaMinutes || 10,
    ambulanceId: alertData.ambulanceId || 'Rescue 1122',
    requiredSpecialties: alertData.requiredSpecialties || [],
    requiredResources: alertData.requiredResources || [],
    patientContact: alertData.patientContact || null,
    preparationStatus: 'action_required',
    timestamp: new Date()
  };

  if (hospitalIdStr) {
    io.to(`hospital:${hospitalIdStr}`).emit('emergency:incoming_patient', payload);
  }
  io.to('role:hospital_staff').emit('emergency:incoming_patient', payload);
  io.to('role:hospital_admin').emit('emergency:incoming_patient', payload);
  io.to('role:coordinator').emit('emergency:incoming_patient', payload);
  io.emit('emergency:incoming_patient', payload);
};

/**
 * Emit event when receiving hospital acknowledges and prepares emergency team / reserves bed
 * Notifies the ambulance driver en route that the hospital is ready and bed is reserved.
 * @param {string} caseId
 * @param {Object} data
 */
const emitHospitalPreparation = (caseId, data) => {
  const io = getIO();
  if (!io) return;

  const payload = {
    caseId,
    hospitalName: data.hospitalName || 'Destination Hospital',
    bedReserved: data.bedReserved !== undefined ? data.bedReserved : true,
    teamAlerted: data.teamAlerted !== undefined ? data.teamAlerted : true,
    preparationStatus: data.preparationStatus || 'ready',
    note: data.note || 'ER trauma team on standby and bed reserved.',
    timestamp: new Date()
  };

  io.to(`case:${caseId}`).emit('emergency:hospital_prepared', payload);
  io.to('role:ambulance_staff').emit('emergency:hospital_prepared', payload);
  io.to('role:coordinator').emit('emergency:hospital_prepared', payload);
  io.emit('emergency:hospital_prepared', payload);
};

/**
 * Emit event to ambulance crew when an emergency mission is assigned
 * @param {string} ambulanceId
 * @param {Object} alertData
 */
const emitAmbulanceDispatchAlert = (ambulanceId, alertData) => {
  const io = getIO();
  if (!io) return;

  const ambulanceIdStr = ambulanceId?.toString();
  const payload = {
    caseId: alertData.caseId,
    ambulanceId: alertData.ambulanceId || ambulanceIdStr,
    condition: alertData.condition || 'Emergency Mission',
    priorityCategory: alertData.priorityCategory || 'critical',
    pickupLocation: alertData.pickupLocation,
    destinationHospitalName: alertData.destinationHospitalName || 'Allocated Hospital',
    destinationHospitalId: alertData.destinationHospitalId,
    timestamp: new Date()
  };

  if (ambulanceIdStr) {
    io.to(`ambulance:${ambulanceIdStr}`).emit('emergency:ambulance_dispatched', payload);
  }
  io.to('role:ambulance_staff').emit('emergency:ambulance_dispatched', payload);
  io.to('role:coordinator').emit('emergency:ambulance_dispatched', payload);
  io.emit('emergency:ambulance_dispatched', payload);
};

/**
 * Emit event when autonomous triage protocol auto-accepts referral after 15s unattended timeout
 * @param {string} hospitalId
 * @param {Object} data
 */
const emitAutonomousAccepted = (hospitalId, data) => {
  const io = getIO();
  if (!io) return;

  const hospitalIdStr = hospitalId?.toString();
  const payload = {
    caseId: data.caseId,
    hospitalId: hospitalIdStr,
    hospitalName: data.hospitalName || 'Destination Hospital',
    message: data.message || `Autonomous 15s acceptance: Case ${data.caseId} auto-accepted for ER admission.`,
    bedReserved: true,
    teamAlerted: true,
    requiredSpecialties: data.requiredSpecialties || [],
    priority: data.priority || 'critical',
    timestamp: new Date()
  };

  if (hospitalIdStr) {
    io.to(`hospital:${hospitalIdStr}`).emit('emergency:autonomous_accepted', payload);
  }
  io.to('role:hospital_staff').emit('emergency:autonomous_accepted', payload);
  io.to('role:hospital_admin').emit('emergency:autonomous_accepted', payload);
  io.to('role:coordinator').emit('emergency:autonomous_accepted', payload);
  io.emit('emergency:autonomous_accepted', payload);
};

/**
 * Emit event to citizen tracking screen with real-time status updates
 * @param {string} caseId
 * @param {Object} data
 */
const emitCitizenStatusUpdate = (caseId, data) => {
  const io = getIO();
  if (!io) return;

  const payload = {
    caseId,
    ...data,
    timestamp: new Date()
  };

  io.to(`case:${caseId}`).emit('emergency:citizen_update', payload);
  io.emit('emergency:citizen_update', payload);
};

module.exports = {
  emitEmergencyCreated,
  emitEmergencyStatusUpdated,
  emitResourceUpdated,
  emitResourceStale,
  emitReferralRequested,
  emitReferralResponded,
  emitAmbulanceStatusUpdated,
  emitAmbulanceAssigned,
  emitSyncConflict,
  emitIncomingPatientAlert,
  emitHospitalPreparation,
  emitAmbulanceDispatchAlert,
  emitAutonomousAccepted,
  emitCitizenStatusUpdate
};

