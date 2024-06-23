// models/Device.js
const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceName: {
    type: String,
    required: true
  },
  tiktokUsername: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  aiSetting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AISetting'
  },
  voiceSetting: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Device', DeviceSchema);
