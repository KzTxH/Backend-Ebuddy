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
        } else if (err.message.includes('websocket upgrade') || err.message.includes('503')) {
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
  const randomIndex = Math.floor(Math.random() * descriptionChunks.length);
  const paragraphChunk = descriptionChunks[randomIndex];

  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'mp3',
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
    const fileName = Date.now();
    const filePath = path.join(AUDIO_DIR, deviceName, fileName +`.mp3`);

    fs.writeFileSync(filePath, audioBuffer);
    console.log(`Audio file saved at ${filePath}`);
    io.emit('newAudioFile', { deviceName, newFile: fileName +`.mp3`});
  } catch (err) {
    console.error('Error generating or saving audio file:', err);
    tiktokLiveConnection.on('member', listener);
    return;
  }
};

const listenForEvents = (tiktokLiveConnection, deviceName, io) => {
  console.log("here")
  const listener = async (data) => {
    tiktokLiveConnection.removeAllListeners('member', listener);

    let paragraphChunk = `${data.nickname} joins the stream!`;

    const options = {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
      },
      data: JSON.stringify({
        audioFormat: 'mp3',
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
      const fileName = Date.now();
      const filePath = path.join(AUDIO_DIR, deviceName, fileName + `.mp3`);

      fs.writeFileSync(filePath, audioBuffer);
      console.log(`Audio file saved at ${filePath}`);
      io.emit('newAudioFile', { deviceName, newFile: fileName + `.mp3` });
    } catch (err) {
      console.error('Error generating or saving audio file:', err);
      tiktokLiveConnection.on('member', listener);
      return;
    }
  };

  tiktokLiveConnection.on('member', listener);

  // setTimeout(() => {
  //   tiktokLiveConnection.removeAllListeners('member', listener);
  //   console.log("setTimeout")
  // }, 15000);
};

module.exports = {
  connectToTikTokLive,
  readRandomChunk,
  listenForEvents
};
