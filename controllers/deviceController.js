const Device = require('../models/Device');
const AISetting = require('../models/AISetting');
const fs = require('fs');
const fsex = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');
const { connectToTikTokLive, readRandomChunk, listenForEvents, shareEvent, followEvent, likeEvent } = require('../services/tiktokliveAPI');

const AUDIO_DIR = path.join(__dirname, '../public/audio_files');

let tiktokLiveConnectionDatas = [];


// Activate a device
exports.activateDevice = async (req, res) => {
  const { deviceName, tiktokUsername, aiSettingId} = req.body;  // làm sau nếu deviceName đang được active thì không cho phép

  let device;

  try {

    let aiSetting = await AISetting.findById(aiSettingId);
    if (!aiSetting) {
      res.status(404).json({ msg: 'AI Setting not found' });
    } else{
      device = await Device.findOne({ deviceName });
      if (!device) {
        device = new Device({ deviceName, tiktokUsername, isActive: true, aiSettingId });
        await device.save();
      } else {
        device.tiktokUsername = tiktokUsername;
        device.isActive = true;
        device.aiSetting = aiSettingId;
        await device.save();
      }
    }
    // tạo thư mục
    const deviceDir = path.join(AUDIO_DIR, deviceName);
    if (!fs.existsSync(deviceDir)) {
      fs.mkdirSync(deviceDir, { recursive: true });
    }

    // gửi cho client cập nhật thiết bị đang hoạt động
    const io = req.app.get('socketio');
    io.emit('updateActiveDevices');

    // tạo connect đến stream tiktok
    await connectTIKTOK(res, device.tiktokUsername, aiSetting, device, req.app.get('socketio'));

  } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
  }
};

const connectTIKTOK = async (res, tiktokUsername, aiSetting, device, io) => {
  try{
    let tiktokConnection = await connectToTikTokLive(tiktokUsername);
    
    tiktokConnection.on('share', (data) => {
      shareEvent(data, device.deviceName, io);
    })
    tiktokConnection.on('follow', (data) => {
      followEvent(data, device.deviceName, io);
    })
    tiktokConnection.on('like', (data) => {
      likeEvent(data, device.deviceName, io);
    })

    tiktokLiveConnectionDatas.push({
      "tiktokLiveConnection": tiktokConnection,
      "aiSetting": aiSetting,
      "device": device
    });



    res.send("Kết Nối Thành Công");
  } catch(err){
    if(err.message.includes("user_not_found")){
      console.error("Bạn đã nhập sai Tài Khoản Tiktok");
      res.status(404).send('Bạn đã nhập sai Tài Khoản Tiktok');
    } else if(err.message.includes("LIVE has ended")){
      console.error("Phiên Live Đã Kết Thúc");
      return connectTIKTOK(res, tiktokUsername, aiSetting, device, io)
    } else if(err.message.includes("websocket upgrade")){
      console.error("TikTok does not offer a websocket upgrade");
      return connectTIKTOK(res, tiktokUsername, aiSetting, device, io)
    } else if(err.message.includes("LIVE has ended")){
      console.error("Phiên Live Đã Kết Thúc");
      return connectTIKTOK(res, tiktokUsername, aiSetting, device, io)
    } else{
      console.error(err);
      res.status(500).send('Server error');
    }
  }
}

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

    for (let i = 0; i < tiktokLiveConnectionDatas.length; i++) {
      if (tiktokLiveConnectionDatas[i].device.deviceName === deviceName) {
        
        tiktokLiveConnectionDatas[i].tiktokLiveConnection.removeAllListeners('share', (data) => {

          shareEvent(data, tiktokLiveConnectionDatas[i].tiktokLiveConnection.device.deviceName, io);
        });

        tiktokLiveConnectionDatas[i].tiktokLiveConnection.removeAllListeners('follow', (data) => {

          followEvent(data, tiktokLiveConnectionDatas[i].tiktokLiveConnection.device.deviceName, io);
        });

        tiktokLiveConnectionDatas[i].tiktokLiveConnection.removeAllListeners('like', (data) => {

          likeEvent(data, tiktokLiveConnectionDatas[i].tiktokLiveConnection.device.deviceName, io);
        });


          tiktokLiveConnectionDatas.splice(i, 1);
          i--; //
      }
  }

    res.json(device);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

// Get list of active devices
exports.getActiveDevices = async (req, res) => {
  try {
    const devices = await Device.find({ isActive: true }).populate('aiSetting');
    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.voiceAI = async (req, res) => {
  const { deviceName } = req.body;

  const io = req.app.get('socketio');
  let data = null;
  for(let tiktokLiveConnectionData of tiktokLiveConnectionDatas){
    
    if(tiktokLiveConnectionData.device.deviceName == deviceName){
      data = tiktokLiveConnectionData;
    }
  }

  try {
    if(data.aiSetting){
      await handleStreaming(data.tiktokLiveConnection, data.aiSetting.description, data.device.deviceName, io);
    }
    res.json({ deviceName });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.deleteAudioFile = async (req, res) => {
  const { deviceName, fileName } = req.params;

    const filePath = path.join(AUDIO_DIR, deviceName, fileName);
    fs.stat(filePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          // File không tồn tại
          return res.status(404).json({ message: 'File not found' });
        }
        // Lỗi khác
        return res.status(500).json({ message: 'Error checking file', error: err.message });
      }
  
      // Xóa file nếu tồn tại
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file: ${err}`);
          return res.status(500).json({ message: 'Error deleting file', error: err.message });
        }
        res.status(200).json({ message: 'File deleted successfully' });
      });
    });
    
};

// Function to handle streaming with random selection
const handleStreaming = async (tiktokLiveConnection, description, deviceName, io) => {
  if (Math.random() < 0.28) {
    await readRandomChunk(description, deviceName, io);
  } else {
    await listenForEvents(tiktokLiveConnection, description, deviceName, io);
  }
};