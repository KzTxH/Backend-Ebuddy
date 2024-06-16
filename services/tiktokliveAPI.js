const { WebcastPushConnection } = require('tiktok-live-connector');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

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
        if (err.message.includes('user_not_found')) {
          console.error('User not found:', err);
          reject(new Error('TikTok user not found'));
        } else {
          console.error('Error connecting to TikTok live stream:', err);
          reject(err);
        }
      });
  });
};

const readRandomChunk = async (description, deviceName, io) => {
  const descriptionChunks = description.split('. ');
  const randomIndex = Math.floor(Math.random() * descriptionChunks.length);
  const paragraphChunk = descriptionChunks[randomIndex];

  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'wav',
      paragraphChunks: paragraphChunk,
      voiceParams: {
        name: 'sally',
        engine: 'speechify',
        languageCode: 'en-US',
      },
    }),
  };

  try {
    const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
    const audioStream = response.data.audioStream;
    const audioBuffer = Buffer.from(audioStream, 'base64');
    const filePath = path.join(AUDIO_DIR, deviceName, `${Date.now()}.mp3`);

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`Audio file saved at ${filePath}`);
    io.emit('newAudioFile', { deviceName, newFile: `${Date.now()}.mp3` });
  } catch (err) {
    console.error('Error generating or saving audio file:', err);
  }
};

const listenForEvents = (tiktokLiveConnection, deviceName, io) => {
  const events = ['member', 'roomUser'];

  const listener = async (event, data) => {
    let paragraphChunk = '';
    if (event === 'member') {
      paragraphChunk = `${data.uniqueId} joins the stream!`;
    } else if (event === 'roomUser') {
      paragraphChunk = `Current viewers: ${data.viewerCount}`;
    }

    const options = {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        audioFormat: 'wav',
        paragraphChunks: paragraphChunk,
        voiceParams: {
          name: 'sally',
          engine: 'speechify',
          languageCode: 'en-US',
        },
      }),
    };

    try {
      const response = await axios('https://audio.api.speechify.com/generateAudioFiles', options);
      const audioStream = response.data.audioStream;
      const audioBuffer = Buffer.from(audioStream, 'base64');
      const filePath = path.join(AUDIO_DIR, deviceName, `${Date.now()}.mp3`);

      fs.writeFileSync(filePath, audioBuffer);
      console.log(`Audio file saved at ${filePath}`);
      io.emit('newAudioFile', { deviceName, newFile: `${Date.now()}.mp3` });
    } catch (err) {
      console.error('Error generating or saving audio file:', err);
    }
  };

  events.forEach(event => {
    tiktokLiveConnection.on(event, data => listener(event, data));
  });

  setTimeout(() => {
    events.forEach(event => {
      tiktokLiveConnection.removeListener(event, data => listener(event, data));
    });
  }, 20000);
};

module.exports = {
  connectToTikTokLive,
  readRandomChunk,
  listenForEvents
};
