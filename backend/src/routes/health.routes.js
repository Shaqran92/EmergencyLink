const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const mongoose = require('mongoose');
const config = require('../config/env');

/**
 * Health check route
 * GET /api/v1/health
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    return sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  })
);

/**
 * Comprehensive System Health & Diagnostic Route (README §7.17)
 * GET /api/v1/health/system
 */
router.get(
  '/system',
  asyncHandler(async (req, res) => {
    let pythonServiceStatus = 'unreachable';
    let pythonData = null;

    if (config.RECOMMENDATION_SERVICE_URL) {
      try {
        const resp = await fetch(`${config.RECOMMENDATION_SERVICE_URL}/health`, {
          signal: AbortSignal.timeout(2000)
        });
        if (resp.ok) {
          const body = await resp.json();
          pythonServiceStatus = 'healthy';
          pythonData = body.data || body;
        }
      } catch (err) {
        pythonServiceStatus = 'offline';
      }
    }

    const mem = process.memoryUsage();

    return sendSuccess(res, {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      environment: config.NODE_ENV,
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host || 'unknown',
        name: mongoose.connection.name || 'emergencylink',
      },
      aiMicroservice: {
        status: pythonServiceStatus,
        url: config.RECOMMENDATION_SERVICE_URL,
        mode: config.RECOMMENDATION_MODE,
        details: pythonData
      },
      externalIntegrations: {
        openRouteService: {
          configured: Boolean(config.OPENROUTESERVICE_API_KEY && config.OPENROUTESERVICE_API_KEY.length > 20),
          provider: 'OpenRouteService API'
        },
        mapbox: {
          configured: Boolean(config.MAPBOX_ACCESS_TOKEN && config.MAPBOX_ACCESS_TOKEN.length > 20),
          provider: 'Mapbox GL Streets'
        }
      },
      memory: {
        rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
        heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
        heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10
      }
    });
  })
);

module.exports = router;
