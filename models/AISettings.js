const mongoose = require('mongoose');

const AISettingsSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  settings: {
    type: [String],
    required: true,
  },
});

module.exports = mongoose.model('AISettings', AISettingsSchema);
