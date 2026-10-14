/**
 * @file Ambulance.js
 * @description Mongoose model for emergency ambulance fleet tracking in EmergencyLink.
 */

const mongoose = require('mongoose');
const { AMBULANCE_STATUSES } = require('../config/constants');

const ambulanceSchema = new mongoose.Schema(
  {
    ambulanceId: {
      type: String,
      unique: true,
      required: [true, 'Ambulance ID is required'],
      trim: true
    },
    baseHospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      default: null
    },
    status: {
      type: String,
      enum: {
        values: AMBULANCE_STATUSES,
        message: '{VALUE} is not a valid ambulance status'
      },
      default: 'available',
      index: true
    },
    lastKnownLocation: {
      lat: {
        type: Number,
        default: null
      },
      lng: {
        type: Number,
        default: null
      }
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Explicit indexes
ambulanceSchema.index({ ambulanceId: 1 }, { unique: true });
ambulanceSchema.index({ status: 1 });

// Virtual alias for currentLocation
ambulanceSchema.virtual('currentLocation').get(function () {
  return this.lastKnownLocation;
}).set(function (loc) {
  this.lastKnownLocation = loc;
});

// Transform output JSON to remove __v and include virtuals
ambulanceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});
ambulanceSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

const Ambulance = mongoose.model('Ambulance', ambulanceSchema);

module.exports = Ambulance;
