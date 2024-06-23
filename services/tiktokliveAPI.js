const { WebcastPushConnection } = require('tiktok-live-connector');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath('C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe');

const AUDIO_DIR = path.join(__dirname, '../public/audio_files');

const connectToTikTokLive = (username) => {
  return new Promise((resolve, reject) => {
    const tiktokLiveConnection = new WebcastPushConnection(username);

    tiktokLiveConnection.connect()
      .then(state => {
        console.log(`Connected to TikTok live stream of user ${username}`);
        resolve(tiktokLiveConnection);
      })
      .catch(err => {
        reject(new Error(err.message));
      });
  });
};


const previousreadRandomChunk = {};
const readRandomChunk = async (aiSetting, device, io) => {
  let description = aiSetting.description;
  let deviceName = device.deviceName;

  let rand = Math.floor(Math.random() * description.split('\n').length)
  
  if (previousreadRandomChunk[deviceName] === rand) {
    return readRandomChunk(aiSetting, device, io);
  } else {
    previousreadRandomChunk[deviceName] = rand;
  }

  const descriptionChunks = description.split('\n');
  const descriptionChunk = insertFillerWords(descriptionChunks[rand]);
  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'mp3',
      paragraphChunks: [descriptionChunk],
      voiceParams: {
        name:  device.voiceSetting,
        engine: 'speechify',
        languageCode: 'en-US',
      },
    }),
  };

  try {
    const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
    const audioStream = response.data.audioStream;
    const audioBuffer = Buffer.from(audioStream, 'base64');
    const fileName = `readRandomChunk-` + Date.now().toString();
    const filePath = path.join(AUDIO_DIR, deviceName, fileName +`.mp3`);

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`Audio file saved at ${filePath}`);

    const newfilePath = path.join(AUDIO_DIR, deviceName, fileName +`-new.mp3`);
    await processAudio(filePath, newfilePath);
        // xóa 
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
          }
        });
    io.emit('newAudioFile', { deviceName, newFile: fileName + `-new.mp3`});
  } catch (err) {
    console.error('Error generating or saving audio file:', err);
    return readRandomChunk(aiSetting, device, io);
  }
};


const listenForEvents = (tiktokLiveConnection, aiSetting, device, io) => {
  let deviceName = device.deviceName;

  const listener = async (data, timeoutId) => {
    
    tiktokLiveConnection.removeAllListeners('member', (data) => listener(data, timeoutId));
    if(!data || !data.nickname || data.nickname.startsWith("user")){
      return listenForEvents(tiktokLiveConnection, aiSetting, device, io);
    }
    if(timeoutId){
      console.log("clearTimeout")
      clearTimeout(timeoutId);
    }

    let nickname = removeNumbersAndSpecialChars(data.nickname);
    if(!nickname){
      return listenForEvents(tiktokLiveConnection, aiSetting, device, io);
    }

    let welcome = [
      `Welcome to the livestream, ${nickname}! We're thrilled to have you here.`,
      `Hello, ${nickname}, and welcome! We're excited to share this experience with you.`,
      `Hi there, ${nickname}! Thanks for joining our livestream today.`,
      `Welcome, ${nickname}! Get ready for an exciting session.`,
      `Hey, ${nickname}! Thanks for tuning in. We appreciate your presence.`,
      `Hello, ${nickname}! We're glad you could join us for this livestream.`,
      `Welcome to the show, ${nickname}! Sit back, relax, and enjoy.`,
      `Hi, ${nickname}! We're live and ready to start.`,
      `Welcome, ${nickname}! We're happy to have you here with us.`,
      `Hello, ${nickname}, and thank you for joining us today. Let's have a great time!`,
      `Hey, ${nickname}! Welcome to our live session. We're glad you're here.`,
      `Welcome to the livestream, ${nickname}! We're excited to connect with you.`,
      `Hi, ${nickname}! Thanks for being here. Let's get started!`,
      `Welcome, ${nickname}! We're thrilled to see you here.`,
      `Hi there, ${nickname}! Thanks for joining our live event.`,
      `Welcome to the stream, ${nickname}! We're excited to share this with you.`,
      `Hello, ${nickname}! Thanks for tuning in. Let's have some fun!`,
      `Welcome, ${nickname}! We're glad you're here to join us live.`,
      `Hi, ${nickname}! Welcome to the livestream. We're happy to have you here.`
    ]

    const options = {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        audioFormat: 'mp3',
        paragraphChunks: [insertFillerWords(welcome[Math.floor(Math.random() * welcome.length)])],
        voiceParams: {
          name: device.voiceSetting,
          engine: 'speechify',
          languageCode: 'en-US',
        },
      }),
    };

    try {
      const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
      const audioStream = response.data.audioStream;
      const audioBuffer = Buffer.from(audioStream, 'base64');
      const fileName = `listenForEvents-` + Date.now().toString();
      const filePath = path.join(AUDIO_DIR, deviceName, fileName + `.mp3`);

      fs.writeFileSync(filePath, audioBuffer);
      console.log(`Audio file saved at ${filePath}`);

      const newfilePath = path.join(AUDIO_DIR, deviceName, fileName +`-new.mp3`);
      await processAudio(filePath, newfilePath);
          // xóa 
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${err}`);
            }
          });
      io.emit('newAudioFile', { deviceName, newFile: fileName + `-new.mp3`});
    } catch (err) {
      console.error('Error generating or saving audio file:', err);
      return listenForEvents(tiktokLiveConnection, aiSetting, device, io);
    }
  };

  console.log("setTimeout");

  let timeoutId = setTimeout(() => {
    console.log("runTimeout")
    tiktokLiveConnection.removeAllListeners('member', (data) => listener(data, timeoutId));
    readRandomChunk(aiSetting, device, io);
  }, (Math.floor(Math.random() * (10 - 3 + 1) ) + 3)*1000);

  tiktokLiveConnection.on('member', (data) => listener(data, timeoutId));

};

const sayHelloToEveryone = (tiktokLiveConnection, aiSetting, device, io) => {
  let deviceName = device.deviceName;
  const listener = async (data, timeoutId) => {
    tiktokLiveConnection.removeAllListeners('roomUser', (data) => listener(data, timeoutId));
    if(!data || !data.viewerCount || data.viewerCount < 2){
      return readRandomChunk(aiSetting, device, io);
    }
    if(timeoutId){
      console.log("clearTimeout")
      clearTimeout(timeoutId);
    }

    let sayhellotoeveryone = [
      `Hello to all ${data.viewerCount} of you joining the live stream today! We're so glad you're here.`,
      `Hi everyone! We've got ${data.viewerCount} people tuning in right now. Welcome!`,
      `Welcome to all ${data.viewerCount} participants in the live stream! We're excited to have you here.`,
      `Hello and welcome to the ${data.viewerCount} of you watching live! Let's make this session great.`,
      `Hi there! It's wonderful to see ${data.viewerCount} of you joining the live stream today.`,
      `Welcome to all ${data.viewerCount} viewers! We're thrilled to have you with us.`,
      `Hello to all ${data.viewerCount} of you! Thank you for being part of our live stream.`,
      `Hi everyone! We have ${data.viewerCount} participants watching live right now. Welcome!`,
      `Welcome to our live stream! It's fantastic to see ${data.viewerCount} of you here today.`,
      `Hello and thank you to the ${data.viewerCount} people joining us live! We're so excited to share this moment with you.`
    ]

    const options = {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        audioFormat: 'mp3',
        paragraphChunks: [insertFillerWords(sayhellotoeveryone[Math.floor(Math.random() * sayhellotoeveryone.length)])],
        voiceParams: {
          name: device.voiceSetting,
          engine: 'speechify',
          languageCode: 'en-US',
        },
      }),
    };

    try {
      const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
      const audioStream = response.data.audioStream;
      const audioBuffer = Buffer.from(audioStream, 'base64');
      const fileName = `sayhellotoeveryone-` + Date.now().toString();
      const filePath = path.join(AUDIO_DIR, deviceName, fileName + `.mp3`);

      fs.writeFileSync(filePath, audioBuffer);
      console.log(`Audio file saved at ${filePath}`);

      const newfilePath = path.join(AUDIO_DIR, deviceName, fileName +`-new.mp3`);
      await processAudio(filePath, newfilePath);
          // xóa 
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${err}`);
            }
          });
      io.emit('newAudioFile', { deviceName, newFile: fileName + `-new.mp3`});
    } catch (err) {
      console.error('Error generating or saving audio file:', err);
      return sayHelloToEveryone(tiktokLiveConnection, aiSetting, device, io);
    }
  }
  console.log("setTimeout - sayhellotoeveryone");

  let timeoutId = setTimeout(() => {
    console.log("runTimeout - sayhellotoeveryone")
    tiktokLiveConnection.removeAllListeners('roomUser', (data) => listener(data, timeoutId));
    readRandomChunk(aiSetting, device, io);
    
  }, (Math.floor(Math.random() * (5 - 3 + 1) ) + 3)*1000);

  tiktokLiveConnection.on('roomUser', (data) => listener(data, timeoutId));

}
const previousNicknamesshareEvent = {};
const shareEvent = async (data, device, io) => {

  let deviceName = device.deviceName;
  if(!data || !data.nickname || data.nickname.startsWith("user")){
    return;
  }

  if (previousNicknamesshareEvent[deviceName] === data.nickname) {
    return;
  } else {
    previousNicknamesshareEvent[deviceName] = data.nickname;
  }

  let nickname = removeNumbersAndSpecialChars(data.nickname);
    if(!nickname){
      return;
    }


  let tksforshare = [
    `Thank you so much for sharing the live stream, ${nickname}! We really appreciate your support.`,
    `We're grateful for your help in spreading the word, ${nickname}. Thanks for sharing the stream!`,
    `Thank you, ${nickname}, for sharing our live stream! Your support means a lot to us.`,
    `Thanks a ton for sharing the stream, ${nickname}! We're lucky to have supporters like you.`,
    `We appreciate you sharing the live stream, ${nickname}. Thank you for your support!`,
    `Thanks for helping us reach more people, ${nickname}! Your sharing makes a difference.`,
    `Thank you, ${nickname}, for spreading the word about our live stream. We appreciate it!`,
    `Thanks for the share, ${nickname}! Your support helps us grow.`,
    `We're grateful for your support, ${nickname}. Thank you for sharing our live stream!`,
    `Thank you so much for sharing, ${nickname}! Your support is invaluable to us.`
  ]
  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'mp3',
      paragraphChunks: [insertFillerWords(tksforshare[Math.floor(Math.random() * tksforshare.length)])],
      voiceParams: {
        name: device.voiceSetting,
        engine: 'speechify',
        languageCode: 'en-US',
      },
    }),
  };
  try {
    const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
    const audioStream = response.data.audioStream;
    const audioBuffer = Buffer.from(audioStream, 'base64');
    const fileName = `shareEvent-` + Date.now().toString();
    const filePath = path.join(AUDIO_DIR, deviceName, fileName + `.mp3`);

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`Audio file saved at ${filePath}`);

    const newfilePath = path.join(AUDIO_DIR, deviceName, fileName +`-new.mp3`);
    await processAudio(filePath, newfilePath);
        // xóa 
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
          }
        });
    io.emit('newAudioFile', { deviceName, newFile: fileName + `-new.mp3`});
  } catch (err) {
    console.error('Error generating or saving audio file:', err);
    return;
  }
}

const previousNicknamesfollowEvent = {};
const followEvent = async (data, device, io) => {

  let deviceName = device.deviceName;

  if(!data || !data.nickname || data.nickname.startsWith("user")){
    return;
  }

  if (previousNicknamesfollowEvent[deviceName] === data.nickname) {
    return;
  } else {
    previousNicknamesfollowEvent[deviceName] = data.nickname;
  }

  let nickname = removeNumbersAndSpecialChars(data.nickname);
  if(!nickname){
    return;
  }


  let tksforfollow = [
    `Thank you so much for following me, ${nickname}! Your support means the world.`,
    `I'm thrilled to have you as a follower, ${nickname}. Thank you for joining!`,
    `Thanks for the follow, ${nickname}! I really appreciate your support.`,
    `Welcome to my community, ${nickname}! Thank you for following me.`,
    `Thank you for the follow, ${nickname}! I'm excited to share more with you.`,
    `I'm grateful for your support, ${nickname}. Thanks for following!`,
    `Thank you for becoming a follower, ${nickname}! It means a lot to me.`,
    `I appreciate you following me, ${nickname}. Thanks for your support!`,
    `Thanks for the follow, ${nickname}! Your support is greatly appreciated.`,
    `I'm happy to have you on board, ${nickname}. Thank you for following me!`
  ]
  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'mp3',
      paragraphChunks: [insertFillerWords(tksforfollow[Math.floor(Math.random() * tksforfollow.length)])],
      voiceParams: {
        name: device.voiceSetting,
        engine: 'speechify',
        languageCode: 'en-US',
      },
    }),
  };
  try {
    const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
    const audioStream = response.data.audioStream;
    const audioBuffer = Buffer.from(audioStream, 'base64');
    const fileName = `followEvent-` + Date.now().toString();
    const filePath = path.join(AUDIO_DIR, deviceName, fileName + `.mp3`);

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`Audio file saved at ${filePath}`);

    const newfilePath = path.join(AUDIO_DIR, deviceName, fileName +`-new.mp3`);
    await processAudio(filePath, newfilePath);
        // xóa 
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
          }
        });
    io.emit('newAudioFile', { deviceName, newFile: fileName + `-new.mp3`});
  } catch (err) {
    console.error('Error generating or saving audio file:', err);
    return;
  }
}

const previousNicknameslikeEvent = {};
const likeEvent = async (data, device, io) => {

  let deviceName = device.deviceName;

  if(!data || !data.nickname || data.nickname.startsWith("user")){
    return;
  }

  if (previousNicknameslikeEvent[deviceName] === data.nickname) {
    return;
  } else {
    previousNicknameslikeEvent[deviceName] = data.nickname;
  }

  let nickname = removeNumbersAndSpecialChars(data.nickname);
  if(!nickname){
    return;
  }

  let tksforlike = [
    `Thank you so much for liking my livestream, ${nickname}! Your support means everything.`,
    `I'm really grateful for your like on my livestream, ${nickname}. Thank you!`,
    `Thanks for the like on my livestream, ${nickname}! It truly encourages me.`,
    `I appreciate you liking my livestream, ${nickname}. Your support is wonderful!`,
    `Thank you for liking my livestream, ${nickname}! It means a lot to me.`,
    `Thanks for showing love to my livestream, ${nickname}! Your support is invaluable.`,
    `I'm so happy you enjoyed my livestream, ${nickname}. Thanks for the like!`,
    `Thank you, ${nickname}, for liking my livestream! It really motivates me.`,
    `Your like on my livestream means the world to me, ${nickname}. Thank you!`,
    `I'm thrilled you liked my livestream, ${nickname}. Thank you so much for your support!`,
  ]
  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'mp3',
      paragraphChunks: [insertFillerWords(tksforlike[Math.floor(Math.random() * tksforlike.length)])],
      voiceParams: {
        name: device.voiceSetting,
        engine: 'speechify', 
        languageCode: 'en-US',
      },
    }),
  };
  try {
    const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
    const audioStream = response.data.audioStream;
    const audioBuffer = Buffer.from(audioStream, 'base64');
    const fileName = `likeEvent-` + Date.now().toString();
    const filePath = path.join(AUDIO_DIR, deviceName, fileName + `.mp3`);

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`Audio file saved at ${filePath}`);

    const newfilePath = path.join(AUDIO_DIR, deviceName, fileName +`-new.mp3`);
    await processAudio(filePath, newfilePath);
        // xóa 
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err}`);
          }
        });
    io.emit('newAudioFile', { deviceName, newFile: fileName + `-new.mp3`});
  } catch (err) {
    console.error('Error generating or saving audio file:', err);
    return;
  }
}

const insertFillerWords = (text) => {
  const fillerWords = ["uhhh,", "-", ";", "..."];
  const words = text.split(" ");
  
  const newText = words.map((word, index) => {
    if (index > 5 && index < words.length - 3 && Math.random() < 0.1) {
      const filler = fillerWords[Math.floor(Math.random() * fillerWords.length)];
      return `${filler} ${word}`;
    }
    return word;
  }).join(" ");

  console.log(newText);

  return newText;
}

const processAudio = (inputFilePath, outputFilePath) => {
  const pitch = getRandomValue(1.0, 1.15); // Giá trị ngẫu nhiên cho pitch
  const volume = getRandomValue(0.8, 1.5); // Giá trị ngẫu nhiên cho loudness
  const tempo = getRandomValue(1.0, 1.2); // Giá trị ngẫu nhiên cho rhythm
  const highpass = getRandomValue(400, 500); // Giá trị ngẫu nhiên cho highpass filter (timbre)
  const lowpass = getRandomValue(3000, 4000); // Giá trị ngẫu nhiên cho lowpass filter (timbre)
  const tremolo = getRandomValue(0.1, 0.5); // Giá trị ngẫu nhiên cho tremolo

  console.log(pitch)
  console.log(volume)
  console.log(tempo)
  console.log(highpass)
  console.log(lowpass)
  console.log(tremolo)

  return new Promise((resolve, reject) => {
    ffmpeg(inputFilePath)
      .audioFilters([
        `asetrate=44100*${pitch},aresample=44100`, // Thay đổi pitch và giữ nguyên tempo
        `volume=${volume}`, // Thay đổi loudness
        `atempo=${tempo}`, // Thay đổi rhythm
        `highpass=f=${highpass}`, // Thay đổi timbre với highpass filter
        `lowpass=f=${lowpass}`, // Thay đổi timbre với lowpass filter
        `tremolo=5:${tremolo}`, // Microvariations: thêm hiệu ứng tremolo
        // `chorus=0.4:0.5:40:0.2:0.25:1.3` // Thêm hiệu ứng chorus để làm phong phú âm thanh
      ])
      .output(outputFilePath)
      .on('end', () => {
        resolve(outputFilePath);
      })
      .on('error', (err) => {
        reject(err);
      })
      .run();
  });
};


function getRandomValue(min, max) {
  return Math.random() * (max - min) + min;
}

function removeNumbersAndSpecialChars(str) {
  // Loại bỏ các ký tự số và ký tự đặc biệt
  return str.replace(/[^a-zA-ZÀ-ỹ\s]/g, '')
              .replace(/\s+/g, ' ');
}

module.exports = {
  connectToTikTokLive,
  readRandomChunk,
  listenForEvents,
  shareEvent,
  followEvent,
  likeEvent,
  sayHelloToEveryone
};
