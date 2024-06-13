const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceName: {
    type: String,
    required: true,
    unique: true,
  },
  tiktokUsername: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model('Device', DeviceSchema);
