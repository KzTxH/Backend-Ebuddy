const { WebcastPushConnection } = require('tiktok-live-connector');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const AUDIO_DIR = path.join(__dirname, '../public/audio_files');
const VOICE_NAME = [`sally`,`erin`,`kristy`];
// `emily`,`lindsey`,`monica`,`Bwyneth`,`carly`,

const connectToTikTokLive = (username) => {
  return new Promise((resolve, reject) => {
    const tiktokLiveConnection = new WebcastPushConnection(username);

    tiktokLiveConnection.connect()
      .then(state => {
        console.log(`Connected to TikTok live stream of user ${username}`);
        resolve(tiktokLiveConnection);
      })
      .catch(err => {
        if (err.message.includes('user_not_found')) {
          console.error('User not found:', err);
          reject(new Error('TikTok user not found'));
        } else if (err.message.includes('websocket upgrade') || err.message.includes('503') || err.message.includes('ended')) {
          console.error('TikTok does not offer a websocket upgrade:', err);
          setTimeout(() => {
            connectToTikTokLive(username)
              .then(resolve)
              .catch(reject);
          }, 5000);
        } else {
          console.error('Error connecting to TikTok live stream:', err);
          reject(err);
        }
      });
  });
};

const readRandomChunk = async (description, deviceName, io) => {
  const descriptionChunks = description.split('\n');
  
  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'mp3',
      paragraphChunks: descriptionChunks[Math.floor(Math.random() * descriptionChunks.length)],
      voiceParams: {
        name: VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)],
        engine: 'speechify-gpttts',
        languageCode: 'en-US',
      },
    }),
  };

  try {
    const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
    const audioStream = response.data.audioStream;
    const audioBuffer = Buffer.from(audioStream, 'base64');
    const fileName = Date.now().toString();
    const filePath = path.join(AUDIO_DIR, deviceName, fileName +`.mp3`);

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`Audio file saved at ${filePath}`);
    io.emit('newAudioFile', { deviceName, newFile: fileName +`.mp3`});
  } catch (err) {
    console.error('Error generating or saving audio file:', err);
    return readRandomChunk(description, deviceName, io);
  }
};


const listenForEvents = (tiktokLiveConnection,description , deviceName, io) => {
  const listener = async (data, timeoutId) => {
    
    tiktokLiveConnection.removeAllListeners('member', (data) => listener(data, timeoutId));

    if(timeoutId){
      console.log("clearTimeout")
      clearTimeout(timeoutId);
    }
    let welcome = [
      `Welcome to the livestream, ${data.nickname}! We're thrilled to have you here.`,
      `Hello, ${data.nickname}, and welcome! We're excited to share this experience with you.`,
      `Hi there, ${data.nickname}! Thanks for joining our livestream today.`,
      `Welcome, ${data.nickname}! Get ready for an exciting session.`,
      `Hey, ${data.nickname}! Thanks for tuning in. We appreciate your presence.`,
      `Hello, ${data.nickname}! We're glad you could join us for this livestream.`,
      `Welcome to the show, ${data.nickname}! Sit back, relax, and enjoy.`,
      `Hi, ${data.nickname}! We're live and ready to start.`,
      `Welcome, ${data.nickname}! We're happy to have you here with us.`,
      `Hello, ${data.nickname}, and thank you for joining us today. Let's have a great time!`,
      `Hey, ${data.nickname}! Welcome to our live session. We're glad you're here.`,
      `Welcome to the livestream, ${data.nickname}! We're excited to connect with you.`,
      `Hi, ${data.nickname}! Thanks for being here. Let's get started!`,
      `Welcome, ${data.nickname}! We're thrilled to see you here.`,
      `Hi there, ${data.nickname}! Thanks for joining our live event.`,
      `Welcome to the stream, ${data.nickname}! We're excited to share this with you.`,
      `Hello, ${data.nickname}! Thanks for tuning in. Let's have some fun!`,
      `Welcome, ${data.nickname}! We're glad you're here to join us live.`,
      `Hi, ${data.nickname}! Welcome to the livestream. We're happy to have you here.`
    ]

    const options = {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        audioFormat: 'mp3',
        paragraphChunks: [welcome[Math.floor(Math.random() * welcome.length)]],
        voiceParams: {
          name: VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)],
          engine: 'speechify-gpttts',
          languageCode: 'en-US',
        },
      }),
    };

    try {
      const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
      const audioStream = response.data.audioStream;
      const audioBuffer = Buffer.from(audioStream, 'base64');
      const fileName = Date.now().toString();
      const filePath = path.join(AUDIO_DIR, deviceName, fileName + `.mp3`);

      fs.writeFileSync(filePath, audioBuffer);
      console.log(`Audio file saved at ${filePath}`);
      io.emit('newAudioFile', { deviceName, newFile: fileName + `.mp3` });
    } catch (err) {
      console.error('Error generating or saving audio file:', err);
      return listenForEvents(tiktokLiveConnection,description , deviceName, io);
    }
  };

  console.log("setTimeout");

  let timeoutId = setTimeout(() => {
    console.log("runTimeout")
    tiktokLiveConnection.removeAllListeners('member', (data) => listener(data, timeoutId));
    readRandomChunk(description, deviceName, io)
    
  }, 10000);

  tiktokLiveConnection.on('member', (data) => listener(data, timeoutId));

};

const shareEvent = async (data, deviceName, io) => {
  let tksforshare = [
    `Thank you so much for sharing the live stream, ${data.nickname}! We really appreciate your support.`,
    `We're grateful for your help in spreading the word, ${data.nickname}. Thanks for sharing the stream!`,
    `Thank you, ${data.nickname}, for sharing our live stream! Your support means a lot to us.`,
    `Thanks a ton for sharing the stream, ${data.nickname}! We're lucky to have supporters like you.`,
    `We appreciate you sharing the live stream, ${data.nickname}. Thank you for your support!`,
    `Thanks for helping us reach more people, ${data.nickname}! Your sharing makes a difference.`,
    `Thank you, ${data.nickname}, for spreading the word about our live stream. We appreciate it!`,
    `Thanks for the share, ${data.nickname}! Your support helps us grow.`,
    `We're grateful for your support, ${data.nickname}. Thank you for sharing our live stream!`,
    `Thank you so much for sharing, ${data.nickname}! Your support is invaluable to us.`
  ]
  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'mp3',
      paragraphChunks: [tksforshare[Math.floor(Math.random() * tksforshare.length)]],
      voiceParams: {
        name: VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)],
        engine: 'speechify-gpttts',
        languageCode: 'en-US',
      },
    }),
  };
  try {
    const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
    const audioStream = response.data.audioStream;
    const audioBuffer = Buffer.from(audioStream, 'base64');
    const fileName = Date.now().toString();
    const filePath = path.join(AUDIO_DIR, deviceName, fileName + `.mp3`);

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`Audio file saved at ${filePath}`);
    io.emit('newAudioFile', { deviceName, newFile: fileName + `.mp3` });
  } catch (err) {
    console.error('Error generating or saving audio file:', err);
    return shareEvent((data, deviceName, io));
  }
}


const followEvent = async (data, deviceName, io) => {
  let tksforfollow = [
    `Thank you so much for following me, ${data.nickname}! Your support means the world.`,
    `I'm thrilled to have you as a follower, ${data.nickname}. Thank you for joining!`,
    `Thanks for the follow, ${data.nickname}! I really appreciate your support.`,
    `Welcome to my community, ${data.nickname}! Thank you for following me.`,
    `Thank you for the follow, ${data.nickname}! I'm excited to share more with you.`,
    `I'm grateful for your support, ${data.nickname}. Thanks for following!`,
    `Thank you for becoming a follower, ${data.nickname}! It means a lot to me.`,
    `I appreciate you following me, ${data.nickname}. Thanks for your support!`,
    `Thanks for the follow, ${data.nickname}! Your support is greatly appreciated.`,
    `I'm happy to have you on board, ${data.nickname}. Thank you for following me!`
  ]
  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'mp3',
      paragraphChunks: [tksforfollow[Math.floor(Math.random() * tksforfollow.length)]],
      voiceParams: {
        name: VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)],
        engine: 'speechify-gpttts',
        languageCode: 'en-US',
      },
    }),
  };
  try {
    const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
    const audioStream = response.data.audioStream;
    const audioBuffer = Buffer.from(audioStream, 'base64');
    const fileName = Date.now().toString();
    const filePath = path.join(AUDIO_DIR, deviceName, fileName + `.mp3`);

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`Audio file saved at ${filePath}`);
    io.emit('newAudioFile', { deviceName, newFile: fileName + `.mp3` });
  } catch (err) {
    console.error('Error generating or saving audio file:', err);
    return shareEvent((data, deviceName, io));
  }
}

module.exports = {
  connectToTikTokLive,
  readRandomChunk,
  listenForEvents,
  shareEvent,
  followEvent
};
