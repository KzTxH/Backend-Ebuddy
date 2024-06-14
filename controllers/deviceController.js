const Device = require('../models/Device');
const AISetting = require('../models/AISetting');
const fs = require('fs');
const path = require('path');


// Activate a device
exports.activateDevice = async (req, res) => {
  const { deviceName, tiktokUsername } = req.body;

  try {
    let device = await Device.findOne({ deviceName });

    if (!device) {
      device = new Device({ deviceName, tiktokUsername, isActive: true });
      await device.save();
    } else {
      device.tiktokUsername = tiktokUsername;
      device.isActive = true;
      await device.save();
    }

    // Create directory for device if it doesn't exist
    const deviceDir = path.join(__dirname, '..', 'public', 'audio_files', deviceName);
    if (!fs.existsSync(deviceDir)) {
      fs.mkdirSync(deviceDir);
    }

    const activeDevices = await Device.find({ isActive: true });
    req.app.get('socketio').emit('updateActiveDevices', activeDevices);

    res.json(device);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Deactivate a device
exports.deactivateDevice = async (req, res) => {
  const { deviceName } = req.body;

  try {
    const device = await Device.findOne({ deviceName });

    if (!device) {
      return res.status(404).json({ msg: 'Device not found' });
    }

    device.isActive = false;
    await device.save();

    // Delete directory for device
    const deviceDir = path.join(__dirname, '..', 'public', 'audio_files', deviceName);
    if (fs.existsSync(deviceDir)) {
      fs.rmdirSync(deviceDir, { recursive: true });
    }

    const activeDevices = await Device.find({ isActive: true });
    req.app.get('socketio').emit('updateActiveDevices', activeDevices);

    res.json(device);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get list of active devices
exports.getActiveDevices = async (req, res) => {
  try {
    const devices = await Device.find({ isActive: true }).populate('aiSetting');
    res.json(devices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Link AI settings to a device
exports.linkAISettings = async (req, res) => {
  const { deviceName, aiSettingId } = req.body;

  if (!deviceName || !aiSettingId) {
    return res.status(400).json({ msg: 'Device name and AI setting ID are required' });
  }

  try {
    const device = await Device.findOne({ deviceName });
    if (!device) {
      return res.status(404).json({ msg: 'Device not found' });
    }

    const aiSetting = await AISetting.findById(aiSettingId);
    if (!aiSetting) {
      return res.status(404).json({ msg: 'AI Setting not found' });
    }

    device.aiSetting = aiSettingId;
    await device.save();

    const activeDevices = await Device.find({ isActive: true }).populate('aiSetting');
    req.app.get('socketio').emit('updateActiveDevices', activeDevices);

    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};