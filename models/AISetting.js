// models/AISetting.js
const mongoose = require('mongoose');

const AISettingSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Add other fields as necessary
});

module.exports = mongoose.model('AISetting', AISettingSchema);
