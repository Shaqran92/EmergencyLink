const express = require('express');
const router = express.Router();
const ambulanceController = require('../controllers/ambulance.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireAmbulanceScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const socketEmitter = require('../sockets/emitter');
const { updateStatusSchema, createAmbulanceSchema } = require('../validation/ambulance.schema');

/**
 * @route   GET /api/ambulances
 * @desc    List all ambulances with base hospitals
 * @access  Private (Authenticated)
 */
router.get('/', authenticate, ambulanceController.list);

router.post(
  '/',
  authenticate,
  requireRole('coordinator', 'system_admin'),
  validate(createAmbulanceSchema),
  ambulanceController.create
);

/**
 * @route   PATCH /api/ambulances/:id/status
 * @desc    Update ambulance status and location
 * @access  Private (coordinator, ambulance_staff, system_admin)
 */
router.patch(
  '/:id/status',
  authenticate,
  requireRole('coordinator', 'ambulance_staff', 'system_admin'),
  requireAmbulanceScope(),
  validate(updateStatusSchema),
  ambulanceController.updateStatus
);

router.patch(
  '/:id/location',
  authenticate,
  requireRole('coordinator', 'ambulance_staff', 'system_admin'),
  async (req, res, next) => {
    try {
      const { lat, lng } = req.body;
      const Ambulance = require('../models/Ambulance');
      const Assignment = require('../models/Assignment');
      const mongoose = require('mongoose');
      const isId = mongoose.Types.ObjectId.isValid(req.params.id);
      const ambulance = await Ambulance.findOne(
        isId ? { $or: [{ _id: req.params.id }, { ambulanceId: req.params.id }] } : { ambulanceId: req.params.id }
      );
      if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });
      const coord = { lat: Number(lat), lng: Number(lng) };
      ambulance.lastKnownLocation = coord;
      ambulance.currentLocation = coord;
      ambulance.lastUpdatedAt = new Date();
      await ambulance.save();

      socketEmitter.emitAmbulanceStatusUpdated(ambulance);

      // Broadcast live movement telemetry to active case room and to citizen tracking screen
      const activeAssignment = await Assignment.findOne({
        $or: [{ ambulanceId: ambulance._id }, { ambulanceId: ambulance.ambulanceId }],
        status: { $in: ['assigned', 'en_route', 'at_scene', 'transporting'] }
      });
      if (activeAssignment && activeAssignment.caseId) {
        socketEmitter.emitCitizenStatusUpdate(activeAssignment.caseId, {
          caseId: activeAssignment.caseId,
          step: 'ambulance_moving',
          assignedAmbulance: {
            ambulanceId: ambulance.ambulanceId,
            status: ambulance.status,
            currentLocation: coord
          },
          message: `Ambulance ${ambulance.ambulanceId} live GPS: (${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)})`
        });
      }

      return res.json({ success: true, data: ambulance });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   POST /api/ambulances/:id/auto-select-destination
 * @desc    Automatically select nearest & best hospital for ambulance based on patient condition
 * @access  Private (coordinator, ambulance_staff, system_admin)
 */
router.post(
  '/:id/auto-select-destination',
  authenticate,
  requireRole('coordinator', 'ambulance_staff', 'system_admin'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { condition = '', requiredSpecialties = [], currentLocation, caseId } = req.body;
      const Ambulance = require('../models/Ambulance');
      const Emergency = require('../models/Emergency');
      const Assignment = require('../models/Assignment');
      const socketEmitter = require('../sockets/emitter');
      const { selectNearestAndBestHospital } = require('../services/hospitalMatcher');

      const isMongoId = require('mongoose').Types.ObjectId.isValid(id);
      const ambulance = await Ambulance.findOne(
        isMongoId ? { $or: [{ _id: id }, { ambulanceId: id }] } : { ambulanceId: id }
      );
      if (!ambulance) return res.status(404).json({ success: false, message: 'Ambulance not found' });

      const pickupLoc = currentLocation || ambulance.lastKnownLocation || ambulance.currentLocation || { lat: 31.5204, lng: 74.3587 };

      const matchResult = await selectNearestAndBestHospital({
        pickupLocation: pickupLoc,
        condition,
        requiredSpecialties
      });

      const bestHospital = matchResult.autoSelectedHospital;

      if (caseId && bestHospital) {
        const emergency = await Emergency.findOne({ caseId });
        if (emergency) {
          emergency.confirmedHospitalId = bestHospital._id;
          if (condition) emergency.summary = `Emergency: ${condition}`;
          await emergency.save();
        }

        const assignment = await Assignment.findOne({ caseId });
        if (assignment) {
          assignment.destinationHospitalId = bestHospital._id;
          await assignment.save();
        }

        socketEmitter.emitIncomingPatientAlert(bestHospital._id, {
          caseId,
          condition: condition || 'Critical Emergency',
          summary: emergency ? emergency.summary : condition,
          priorityCategory: emergency ? emergency.priorityCategory : 'critical',
          etaMinutes: matchResult.etaMinutes,
          ambulanceId: ambulance.ambulanceId,
          requiredSpecialties
        });

        socketEmitter.emitHospitalPreparation(caseId, {
          hospitalName: bestHospital.name,
          bedReserved: true,
          teamAlerted: true,
          preparationStatus: 'ready',
          autonomous: true,
          note: `Destination confirmed by Automated Hospital Selector: ${matchResult.selectionReason}`
        });
      }

      return res.json({
        success: true,
        data: {
          ambulanceId: ambulance.ambulanceId,
          caseId: caseId || null,
          autoSelectedHospital: bestHospital,
          selectionReason: matchResult.selectionReason,
          selectionRationale: matchResult.selectionRationale,
          confidenceScore: matchResult.confidenceScore,
          etaMinutes: matchResult.etaMinutes,
          distanceKm: matchResult.distanceKm,
          routeGeometry: matchResult.routeGeometry,
          rankedCandidates: matchResult.rankedCandidates
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
