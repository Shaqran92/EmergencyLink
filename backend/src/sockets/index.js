/**
 * @file sockets/index.js
 * @description Real-time WebSocket server setup using Socket.IO with JWT authentication and room subscriptions.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Assignment = require('../models/Assignment');

let ioInstance = null;

async function canSubscribeToCase(user, caseId) {
  if (!user) return false;
  if (['coordinator', 'system_admin', 'observer'].includes(user.role)) {
    return true;
  }

  if (['hospital_staff', 'hospital_admin'].includes(user.role) && user.hospitalId) {
    return Boolean(await Referral.exists({ caseId, hospitalId: user.hospitalId }));
  }

  if (user.role === 'ambulance_staff' && user.ambulanceId) {
    return Boolean(await Assignment.exists({ caseId, ambulanceId: user.ambulanceId }));
  }

  return false;
}

/**
 * Initialize Socket.IO with HTTP server instance
 * @param {import('http').Server} server
 * @returns {Server}
 */
const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: config.CLIENT_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        // Allow unauthenticated guest / public citizen socket connection
        socket.user = null;
        socket.isGuest = true;
        return next();
      }

      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const userId = decoded.id || decoded.userId || decoded._id;

        if (userId) {
          const user = await User.findById(userId).select('-passwordHash');
          if (user && user.accountStatus === 'active') {
            socket.user = user;
            return next();
          }
        }
      } catch (tokenErr) {
        // In case of invalid or expired token, gracefully fall back to guest
      }

      socket.user = null;
      socket.isGuest = true;
      next();
    } catch (err) {
      socket.user = null;
      socket.isGuest = true;
      next();
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const user = socket.user;

    // Auto-join rooms based on user role for authenticated staff
    if (user) {
      if (user.role === 'coordinator' || user.role === 'system_admin' || user.role === 'observer') {
        socket.join('role:coordinator');
      }

      if (user.hospitalId && (user.role === 'hospital_staff' || user.role === 'hospital_admin')) {
        const hospitalRoom = `hospital:${user.hospitalId.toString()}`;
        socket.join(hospitalRoom);
      }

      if (user.ambulanceId && user.role === 'ambulance_staff') {
        const ambulanceRoom = `ambulance:${user.ambulanceId.toString()}`;
        socket.join(ambulanceRoom);
      }
    }

    // Dynamic case subscription
    socket.on('join:case', async (caseId) => {
      if (typeof caseId !== 'string' || caseId.trim().length === 0 || caseId.length > 100) {
        socket.emit('case:access_denied');
        return;
      }

      try {
        const normalizedCaseId = caseId.trim();
        if (socket.user) {
          if (!(await canSubscribeToCase(socket.user, normalizedCaseId))) {
            socket.emit('case:access_denied');
            return;
          }
        }
        await socket.join(`case:${normalizedCaseId}`);
      } catch (error) {
        console.error('[Socket] Failed to authorize case subscription.', {
          error: error.message
        });
        socket.emit('case:access_denied');
      }
    });

    socket.on('leave:case', (caseId) => {
      if (typeof caseId === 'string' && caseId.trim().length > 0) {
        socket.leave(`case:${caseId.trim()}`);
      }
    });

    socket.on('disconnect', (reason) => {
      // Disconnection handled cleanly
    });
  });

  ioInstance = io;
  return io;
};

/**
 * Access the initialized Socket.IO instance
 * @returns {Server|null}
 */
const getIO = () => {
  return ioInstance;
};

module.exports = setupSocket;
module.exports.setupSocket = setupSocket;
module.exports.getIO = getIO;
module.exports.canSubscribeToCase = canSubscribeToCase;
