const Device = require('../models/Device');
const AISetting = require('../models/AISetting');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { connectToTikTokLive } = require('../services/tiktokliveAPI');

const AUDIO_DIR = path.join(__dirname, '../public/audio_files');


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

    const deviceDir = path.join(AUDIO_DIR, deviceName);
    if (!fs.existsSync(deviceDir)) {
      fs.mkdirSync(deviceDir, { recursive: true });
    }

    const activeDevices = await Device.find({ isActive: true });
    const io = req.app.get('socketio');
    io.emit('updateActiveDevices', activeDevices);

    res.json(device);

    // Watch for changes in the device's directory
    // const deviceDir = path.join(AUDIO_DIR, deviceName);
    console.log(deviceDir)
    chokidar.watch(deviceDir).on('all', (event, filePath) => {
      const newFile = path.basename(filePath);
      if (event === 'add') {
        io.emit('newAudioFile', { deviceName, newFile });
      } else if (event === 'unlink') { // Handle file deletion
        io.emit('deleteAudioFile', { deviceName, newFile });
      }
      // Emit updateAudioFiles for any change
      const files = fs.readdirSync(deviceDir).filter(file => path.extname(file) === '.mp3');
      io.emit('updateAudioFiles', { deviceName, files });
    });

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

    const activeDevices = await Device.find({ isActive: true });
    const io = req.app.get('socketio');
    io.emit('updateActiveDevices', activeDevices);

    
    const deviceDir = path.join(AUDIO_DIR, deviceName);
    if (fs.existsSync(deviceDir)) {
      fs.rmSync(deviceDir, { recursive: true, force: true });
      console.log(`Directory ${deviceDir} has been removed`);
    } else {
      console.log(`Directory ${deviceDir} does not exist`);
    }

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
    try {
      await connectToTikTokLive(device.tiktokUsername);
    } catch (error) {
      console.error('Error during TikTok live connection:', error);
      throw new Error('TikTok live connection failed');
    }

    const activeDevices = await Device.find({ isActive: true }).populate('aiSetting');
    req.app.get('socketio').emit('updateActiveDevices', activeDevices);

    
    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};