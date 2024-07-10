const Device = require('../models/Device');
const AISetting = require('../models/AISetting');
const fs = require('fs');
const fsex = require('fs-extra');
const path = require('path');
const { connectToTikTokLive, readRandomChunk, listenForEvents, sayHelloToEveryone, shareEvent, followEvent, likeEvent } = require('../services/tiktokliveAPI');


const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe');

const AUDIO_DIR = path.join(__dirname, '../public/audio_files');

let tiktokLiveConnectionDatas = [];


// Activate a device
exports.activateDevice = async (req, res) => {
  const { deviceName, tiktokUsername, aiSettingId, selectedVoiceSetting} = req.body;  // làm sau nếu deviceName đang được active thì không cho phép
  let device;
  try {

    let aiSetting = await AISetting.findById(aiSettingId);
    if (!aiSetting) {
      res.status(404).json({ msg: 'AI Setting not found' });
    } else{
      device = await Device.findOne({ deviceName });
      if (!device) {
        device = new Device({ deviceName, tiktokUsername, isActive: true, aiSettingId, selectedVoiceSetting});
        await device.save();
      } else {
        device.tiktokUsername = tiktokUsername;
        device.isActive = true;
        device.aiSetting = aiSettingId;
        device.aiSetting = aiSettingId;
        device.voiceSetting = selectedVoiceSetting;
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
      shareEvent(data, device, io);
    })
    tiktokConnection.on('follow', (data) => {
      followEvent(data, device, io);
    })
    tiktokConnection.on('like', (data) => {
      likeEvent(data, device, io);
    })

    tiktokLiveConnectionDatas.push({
      "tiktokLiveConnection": tiktokConnection,
      "aiSetting": aiSetting,
      "device": device,
      "isfisrt": true
    });

    setTimeout(()=> {
      for (let i = 0; i < tiktokLiveConnectionDatas.length; i++) {
        if(tiktokLiveConnectionDatas[i].device.deviceName == device.deviceName){
          tiktokLiveConnectionDatas[i].isfisrt = false;
        }
      }
    }, 300000)


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
          shareEvent(data, tiktokLiveConnectionDatas[i].tiktokLiveConnection.device, io);
        });

        tiktokLiveConnectionDatas[i].tiktokLiveConnection.removeAllListeners('follow', (data) => {
          followEvent(data, tiktokLiveConnectionDatas[i].tiktokLiveConnection.device, io);
        });

        tiktokLiveConnectionDatas[i].tiktokLiveConnection.removeAllListeners('like', (data) => {
          likeEvent(data, tiktokLiveConnectionDatas[i].tiktokLiveConnection.device, io);
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
    console.log("data.isfisrt");
    console.log(data.isfisrt);
    if(data.isfisrt){
      if (Math.random() <= 0.5) {
        await listenForEvents(data.tiktokLiveConnection, data.aiSetting, data.device, io);
      } else{
        await sayHelloToEveryone(data.tiktokLiveConnection, data.aiSetting, data.device, io);
      }
    } else {
      await handleStreaming(data.tiktokLiveConnection, data.aiSetting, data.device, io);
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
const handleStreaming = async (tiktokLiveConnection, aiSetting, device, io) => {
  let rand = Math.random();
  if (rand > 0 && rand <= 0.5) {
    await readRandomChunk(aiSetting, device, io);
  } else if (rand > 0.5 && rand <= 0.65) {
    await sayHelloToEveryone(tiktokLiveConnection, aiSetting, device, io);
  } else {
    await listenForEvents(tiktokLiveConnection, aiSetting, device, io);
  }
};