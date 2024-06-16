const Device = require('../models/Device');
const AISetting = require('../models/AISetting');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { connectToTikTokLive, readRandomChunk, listenForEvents } = require('../services/tiktokliveAPI');
const axios = require('axios');

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

    const io = req.app.get('socketio');

    try {
      const tiktokLiveConnection = await connectToTikTokLive(device.tiktokUsername);
      io.tiktokLiveConnections = io.tiktokLiveConnections || {};
      io.tiktokLiveConnections[deviceName] = tiktokLiveConnection;

      tiktokLiveConnection.on('member', async (data) => {
        
    
const text = `${data.uniqueId} joins the stream!`;
        const audioData = await generateAudio(text);
        await saveAudioFile(deviceName, audioData);
        io.emit('newAudioFile', { deviceName, newFile: audioData.fileName });
      });

      tiktokLiveConnection.on('roomUser', async (data) => {
        const text = `Total viewers: ${data.viewerCount}`;
        const audioData = await generateAudio(text);
        await saveAudioFile(deviceName, audioData);
        io.emit('newAudioFile', { deviceName, newFile: audioData.fileName });
      });

      await handleStreaming(aiSetting.description, deviceName, io);
    } catch (error) {
      if (error.message.includes('TikTok user not found')) {
        console.error('TikTok user not found:', error);
        return res.status(400).json({ message: 'Bạn đã nhập sai Tài Khoản Tiktok' });
      }
      console.error('Error during TikTok live connection:', error);
      return res.status(500).json({ message: 'TikTok live connection failed' });
    }

    res.json({ message: 'AI Settings linked successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteAudioFile = async (req, res) => {
  const { deviceName, fileName } = req.params;

  try {
    const filePath = path.join(AUDIO_DIR, deviceName, fileName);
    console.log(`Attempting to delete file: ${filePath}`); // Logging

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted audio file: ${filePath}`); // Logging
      return res.json({ message: 'Audio file deleted successfully' });
    } else {
      console.error(`File not found: ${filePath}`); // Logging
      return res.status(404).json({ message: 'Audio file not found' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.readRandomChunk = async (req, res) => {
  const { deviceName } = req.body;

  try {
    const device = await Device.findOne({ deviceName });
    const aiSetting = await AISetting.findById(device.aiSetting);

    const io = req.app.get('socketio');
    await readRandomChunk(aiSetting.description, deviceName, io);

    res.json({ message: 'Random chunk read successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.listenForEvents = async (req, res) => {
  const { deviceName } = req.body;

  try {
    const io = req.app.get('socketio');
    const tiktokLiveConnection = io.tiktokLiveConnections[deviceName];

    tiktokLiveConnection.on('member', async (data) => {
      const text = `${data.uniqueId} joins the stream!`;
      const audioData = await generateAudio(text);
      await saveAudioFile(deviceName, audioData);
      io.emit('newAudioFile', { deviceName, newFile: audioData.fileName });
    });

    tiktokLiveConnection.on('roomUser', async (data) => {
      const text = `Total viewers: ${data.viewerCount}`;
      const audioData = await generateAudio(text);
      await saveAudioFile(deviceName, audioData);
      io.emit('newAudioFile', { deviceName, newFile: audioData.fileName });
    });

    res.json({ message: 'Listening for events' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Function to handle streaming with random selection
const handleStreaming = async (description, deviceName, io) => {
  const runRandomTask = async () => {
    if (Math.random() < 0.5) {
      await readRandomChunk(description, deviceName, io);
    } else {
      await listenForEvents(deviceName, io);
    }
  };

  while (true) {
    await runRandomTask();
    await new Promise(resolve => setTimeout(resolve, 20000)); // Wait for 20 seconds before running the next task
  }
};

// Mock function to generate audio from text
const generateAudio = async (text) => {
  const response = await axios.post('https://audio.api.speechify.com/generateAudioFiles', {
    audioFormat: 'wav',
    paragraphChunks: text,
    voiceParams: {
      name: 'sally',
      engine: 'speechify',
      languageCode: 'en-US',
    },
  });

  return {
    fileName: `${Date.now()}.mp3`,
    audioStream: response.data.json.audioStream,
  };
};

// Mock function to save audio file
const saveAudioFile = async (deviceName, audioData) => {
  const filePath = path.join(AUDIO_DIR, deviceName, audioData.fileName);
  fs.writeFileSync(filePath, audioData.audioStream, { encoding: 'base64' });
};