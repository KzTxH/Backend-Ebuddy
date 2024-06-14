const Device = require('../models/Device');
const fs = require('fs');
const path = require('path');

const AUDIO_DIR = path.join(__dirname, '..', 'public', 'audio_files');

const createDeviceFolder = (deviceName) => {
  const deviceFolderPath = path.join(AUDIO_DIR, deviceName);
  if (!fs.existsSync(deviceFolderPath)) {
    fs.mkdirSync(deviceFolderPath, { recursive: true });
    console.log(`Directory created: ${deviceFolderPath}`);
  } else {
    console.log(`Directory already exists: ${deviceFolderPath}`);
  }
};

const deleteDeviceFolder = (deviceName) => {
  const deviceFolderPath = path.join(AUDIO_DIR, deviceName);
  if (fs.existsSync(deviceFolderPath)) {
    fs.rmdirSync(deviceFolderPath, { recursive: true });
    console.log(`Directory deleted: ${deviceFolderPath}`);
  } else {
    console.log(`Directory does not exist: ${deviceFolderPath}`);
  }
};

exports.activateDevice = async (req, res) => {
  const { deviceName, tiktokUsername } = req.body;

  try {
    if (!deviceName || !tiktokUsername) {
      return res.status(400).json({ msg: 'Device name and TikTok username are required' });
    }

    let device = await Device.findOne({ deviceName });

    if (!device) {
      device = new Device({ deviceName, tiktokUsername, isActive: true });
      await device.save();
    } else {
      device.tiktokUsername = tiktokUsername;
      device.isActive = true;
      await device.save();
    }

    // Create folder for the device
    createDeviceFolder(deviceName);

    const activeDevices = await Device.find({ isActive: true });
    req.app.get('socketio').emit('updateActiveDevices', activeDevices);

    res.json(device);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deactivateDevice = async (req, res) => {
  const { deviceName } = req.body;

  try {
    if (!deviceName) {
      return res.status(400).json({ msg: 'Device name is required' });
    }

    const device = await Device.findOne({ deviceName });

    if (!device) {
      return res.status(404).json({ msg: 'Device not found' });
    }

    device.isActive = false;
    await device.save();

    // Delete folder for the device
    deleteDeviceFolder(deviceName);

    const activeDevices = await Device.find({ isActive: true });
    req.app.get('socketio').emit('updateActiveDevices', activeDevices);

    res.json(device);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getActiveDevices = async (req, res) => {
  try {
    const devices = await Device.find({ isActive: true });
    res.json(devices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.linkAISettings = async (req, res) => {
  const { deviceId, aiSettingId } = req.body;

  try {
    let device = await Device.findById(deviceId);

    if (!device) {
      return res.status(404).json({ msg: 'Device not found' });
    }

    device.aiSetting = aiSettingId;
    await device.save();

    const activeDevices = await Device.find({ isActive: true });
    req.app.get('socketio').emit('updateActiveDevices', activeDevices);

    res.json(device);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};