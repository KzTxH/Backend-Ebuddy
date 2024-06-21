const { WebcastPushConnection } = require('tiktok-live-connector');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const AUDIO_DIR = path.join(__dirname, '../public/audio_files');
const VOICE_NAME = [`sally`,`erin`,`kristy`];
let Datas = [];
// , `emily`,`lindsey`,`monica`,`Bwyneth`,`carly`,

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
const readRandomChunk = async (description, deviceName, io) => {

  let rand = Math.floor(Math.random() * description.split('\n').length)
  console.log(rand);
  if (previousreadRandomChunk[deviceName] === rand) {
    console.log("chạy lại readRandomChunk");
    return readRandomChunk(description, deviceName, io);
  } else {
    previousreadRandomChunk[deviceName] = rand;
  }
  
  console.log("tiếp tục readRandomChunk");


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
        name:  `sally`, //VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)], 
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
    io.emit('newAudioFile', { deviceName, newFile: fileName +`.mp3`});
  } catch (err) {
    if(err.message.includes('no such file or directory')){
      return;
    } else{
      console.error('Error generating or saving audio file:', err);
      return readRandomChunk(description, deviceName, io);
    }
  }
};


const listenForEvents = (tiktokLiveConnection,description , deviceName, io) => {
  const listener = async (data, timeoutId) => {
    
    tiktokLiveConnection.removeAllListeners('member', (data) => listener(data, timeoutId));
    if(!data || data.nickname.startsWith("user")){
      return;
    }
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
        paragraphChunks: [insertFillerWords(welcome[Math.floor(Math.random() * welcome.length)])],
        voiceParams: {
          name: VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)], // [`sally`,`erin`,`kristy`];
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
      io.emit('newAudioFile', { deviceName, newFile: fileName + `.mp3` });
    } catch (err) {
      if(err.message.includes('no such file or directory')){
        return;
      } else{
        console.error('Error generating or saving audio file:', err);
        return listenForEvents(tiktokLiveConnection,description , deviceName, io);
      }
    }
  };

  console.log("setTimeout");

  let timeoutId = setTimeout(() => {
    console.log("runTimeout")
    tiktokLiveConnection.removeAllListeners('member', (data) => listener(data, timeoutId));
    sayhellotoeveryone(tiktokLiveConnection,description , deviceName, io);
    
  }, 5858);

  tiktokLiveConnection.on('member', (data) => listener(data, timeoutId));

};

const sayhellotoeveryone = (tiktokLiveConnection,description , deviceName, io) => {
  const listener = async (data, timeoutId) => {
    
    tiktokLiveConnection.removeAllListeners('roomUser', (data) => listener(data, timeoutId));
    if(!data){
      return;
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
          name: VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)], // [`sally`,`erin`,`kristy`];
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
      io.emit('newAudioFile', { deviceName, newFile: fileName + `.mp3` });
    } catch (err) {
      if(err.message.includes('no such file or directory')){
        return;
      } else{
        console.error('Error generating or saving audio file:', err);
        return sayhellotoeveryone(tiktokLiveConnection,description , deviceName, io);
      }
    }
  }
  console.log("setTimeout - sayhellotoeveryone");

  let timeoutId = setTimeout(() => {
    console.log("runTimeout - sayhellotoeveryone")
    tiktokLiveConnection.removeAllListeners('roomUser', (data) => listener(data, timeoutId));
    readRandomChunk(description, deviceName, io);
    
  }, 3000);

  tiktokLiveConnection.on('roomUser', (data) => listener(data, timeoutId));

}
const previousNicknamesshareEvent = {};
const shareEvent = async (data, deviceName, io) => {
  if(!data || data.nickname.startsWith("user")){
    return;
  }

  if (previousNicknamesshareEvent[deviceName] === data.nickname) {
    return;
  } else {
    previousNicknamesshareEvent[deviceName] = data.nickname;
  }


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
      paragraphChunks: [insertFillerWords(tksforshare[Math.floor(Math.random() * tksforshare.length)])],
      voiceParams: {
        name: VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)],
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
    io.emit('newAudioFile', { deviceName, newFile: fileName + `.mp3` });
  } catch (err) {
    if(err.message.includes('no such file or directory')){
      return;
    } else{
      console.error('Error generating or saving audio file:', err);
      return shareEvent((data, deviceName, io));
    }
  }
}

const previousNicknamesfollowEvent = {};
const followEvent = async (data, deviceName, io) => {
  if(!data || data.nickname.startsWith("user")){
    return;
  }

  if (previousNicknamesfollowEvent[deviceName] === data.nickname) {
    return;
  } else {
    previousNicknamesfollowEvent[deviceName] = data.nickname;
  }


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
      paragraphChunks: [insertFillerWords(tksforfollow[Math.floor(Math.random() * tksforfollow.length)])],
      voiceParams: {
        name: VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)],
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
    io.emit('newAudioFile', { deviceName, newFile: fileName + `.mp3` });
  } catch (err) {
    if(err.message.includes('no such file or directory')){
      return;
    } else{
      console.error('Error generating or saving audio file:', err);
      return followEvent((data, deviceName, io));
    }
  }
}

const previousNicknameslikeEvent = {};
const likeEvent = async (data, deviceName, io) => {
  if(!data || data.nickname.startsWith("user")){
    return;
  }

  if (previousNicknameslikeEvent[deviceName] === data.nickname) {
    return;
  } else {
    previousNicknameslikeEvent[deviceName] = data.nickname;
  }


  let tksforlike = [
    `Thank you so much for liking my livestream, ${data.nickname}! Your support means everything.`,
    `I'm really grateful for your like on my livestream, ${data.nickname}. Thank you!`,
    `Thanks for the like on my livestream, ${data.nickname}! It truly encourages me.`,
    `I appreciate you liking my livestream, ${data.nickname}. Your support is wonderful!`,
    `Thank you for liking my livestream, ${data.nickname}! It means a lot to me.`,
    `Thanks for showing love to my livestream, ${data.nickname}! Your support is invaluable.`,
    `I'm so happy you enjoyed my livestream, ${data.nickname}. Thanks for the like!`,
    `Thank you, ${data.nickname}, for liking my livestream! It really motivates me.`,
    `Your like on my livestream means the world to me, ${data.nickname}. Thank you!`,
    `I'm thrilled you liked my livestream, ${data.nickname}. Thank you so much for your support!`,
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
        name: VOICE_NAME[Math.floor(Math.random() * VOICE_NAME.length)],
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
    io.emit('newAudioFile', { deviceName, newFile: fileName + `.mp3` });
  } catch (err) {
    if(err.message.includes('no such file or directory')){
      return;
    } else{
      console.error('Error generating or saving audio file:', err);
      return likeEvent((data, deviceName, io));
    }
  }
}

const insertFillerWords = (text) => {
  const fillerWords = ["uhhh"];
  console.log("text");
  console.log(text);
  const words = text.split(" ");
  
  const newText = words.map((word, index) => {
    if (index > 3 && index < words.length - 1 && Math.random() < 0.2) {
      const filler = fillerWords[Math.floor(Math.random() * fillerWords.length)];
      return `${filler} ${word}`;
    }
    return word;
  }).join(" ");

  return newText;
}

module.exports = {
  connectToTikTokLive,
  readRandomChunk,
  listenForEvents,
  shareEvent,
  followEvent,
  likeEvent
};
