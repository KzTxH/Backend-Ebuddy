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
    if(err.message.includes("no such file or directory")){
      console.error('no such file or directory');
      return;
    } else {
      console.error('Error generating or saving audio file:', err);
      return readRandomChunk(aiSetting, device, io);
    }
  }
};

const keugoilikesharefollow = async (aiSetting, device, io) => {
  let deviceName = device.deviceName;

  let likesharefollow = [
    "If you like what you see, hit that like button to show your support and help us reach more people!",
    "Show some love and double-tap the screen! Every like helps us create more amazing content for you.",
    "Tap the heart if you're enjoying the stream! It lets us know that you want to see more of this kind of content.",
    "Hit like if you're having fun! Your support means the world to us and keeps the fun going.",
    "Like this live if you want more content like this! Your feedback helps us improve and create better streams.",
    "Double-tap if you think this is awesome! We appreciate every single like and your support.",
    "Send those hearts my way if you're loving this! It encourages us to keep bringing you great content.",
    "Tap like to support the stream! Every like counts and helps us grow our community.",
    "Give a thumbs up if you're excited! Your enthusiasm keeps us motivated to deliver the best streams.",
    "Hit the heart if you agree! Let's see those likes roll in if you're with us!",
    "Share this live with your friends! Let them join the fun and enjoy the content together with us.",
    "Spread the word, hit that share button! Help us reach a wider audience by sharing this stream.",
    "Let your friends know by sharing this stream! The more, the merrier, and we appreciate your support.",
    "Share this live to help us grow! Your shares help us reach new viewers and expand our community.",
    "Send this live to someone who would love it! Let's spread the joy and make someone's day better.",
    "Sharing is caring, hit that share button! Show your support by helping us reach more people.",
    "Help us reach more people by sharing! Your shares are invaluable in helping us grow.",
    "Tag your friends and share this live! Let's make this stream a huge hit together.",
    "Let's make this viral, share the stream! With your help, we can reach new heights.",
    "Share if you want more awesome content! Your shares help us understand what you love.",
    "Follow me for more amazing streams! Don't miss out on our future content and updates.",
    "Don't miss out, hit that follow button! Stay connected with us and be the first to know about new streams.",
    "Follow to stay updated with our latest content! We're always bringing new and exciting content for you.",
    "Join the community, follow now! Be a part of our journey and enjoy exclusive content.",
    "Make sure to follow for more fun! We're just getting started and there's so much more to come.",
    "Hit follow if you enjoyed this! Stay tuned for more great content and updates.",
    "Stay tuned by following me! Don't miss any of our exciting streams and announcements.",
    "Click follow and never miss an update! Keep up with our latest news and streams.",
    "Follow for daily entertainment! We have something new and exciting for you every day.",
    "Follow me to keep the good times rolling! We're all about fun and you don't want to miss out.",
    "Check out the products in my cart! Click to explore and find something you love.",
    "Click on the cart to see more details! Discover great deals and exclusive products.",
    "Don't miss these deals, click the cart! Get the best products at amazing prices.",
    "Add to cart for exclusive discounts! Take advantage of our special offers just for you.",
    "Click the cart to buy now! Don't wait, these deals won't last long.",
    "Tap the cart to shop our collection! Find the perfect item for you or someone special.",
    "Find your favorites by clicking the cart! Explore our curated selection of top products.",
    "Click the cart for more awesome products! We're offering some amazing items you don't want to miss.",
    "Ready to shop? Click the cart! Start your shopping spree with just one click.",
    "Check out what's in the cart! We have some great items waiting for you.",
    "Leave a comment if you have any questions! We're here to help and would love to hear from you.",
    "Let me know your thoughts in the comments! Your feedback is important to us.",
    "Send me a message for more info! We're happy to provide any additional details you need.",
    "Join the discussion in the comments! Let's have a great conversation together.",
    "Comment below with your favorite item! We'd love to know what caught your eye.",
    "Ask me anything in the comments! We're here to answer your questions and chat with you.",
    "Drop a comment if you like this! Your interaction helps us know what content you enjoy.",
    "Tell me what you think in the comments! We value your opinion and want to hear from you.",
    "Engage with me by commenting below! Let's create a lively and fun community together.",
    "Share your thoughts in the comments! We're looking forward to reading your messages.",
    "Show your support by liking and sharing! Every action you take helps us grow.",
    "Follow and share to spread the love! Help us reach more people and create a larger community.",
    "Like, share, and follow for more! Stay connected and be part of our journey.",
    "Don't forget to like, share, and follow! We appreciate every bit of your support.",
    "Support the stream by hitting like and share! Your actions make a big difference.",
    "Like, share, and follow if you're enjoying this! Your support means the world to us.",
    "Show your support by clicking like and share! It helps us create more great content for you.",
    "Follow for more and share with your friends! Let's grow our community together.",
    "Hit like, follow, and share to support us! We appreciate every bit of your engagement.",
    "Thanks for watching! Like, share, and follow for more amazing streams.",
    "Tap the heart if you love this product! Show your support and let us know you like it.",
    "Share this with friends who need this! Help them find something great and useful.",
    "Follow for more deals like this one! Don't miss out on our special offers.",
    "Click the cart to grab this deal! Take advantage of this amazing offer before it's gone.",
    "Comment below if you have any questions about the product! We're here to help.",
    "Like this if you think it's a great deal! Your likes help us know what you enjoy.",
    "Share this with someone who would love it! Spread the joy and let others know.",
    "Follow me for more product reviews! Stay updated with our latest recommendations.",
    "Check out the cart for more amazing items! We have some great products waiting for you.",
    "Tell me in the comments what you think! We value your feedback and want to hear from you.",
    "Hit like if you think this is a must-have! Your likes show us what products you love.",
    "Share this if you know someone who needs it! Help them find something useful and amazing.",
    "Follow to stay updated on our latest products! Don't miss out on new arrivals.",
    "Click the cart to make it yours! Get this product before it's too late.",
    "Drop a comment if you want to see more like this! Your feedback helps us create better content.",
    "Double-tap if you're excited about this! Show your enthusiasm and support.",
    "Share this with your shopping buddies! Let them know about this great find.",
    "Follow for more exclusive content! Stay connected with us for the latest updates.",
    "Tap the cart to see more! Discover our full collection of amazing products.",
    "Comment your thoughts below! We love hearing from you and appreciate your feedback.",
    "Like if you love this now! Your likes help us know what content you enjoy.",
    "Share quickly to let others know! Spread the word and help us reach more people.",
    "Follow immediately for instant updates! Stay connected and be the first to know.",
    "Click the cart before it's gone! Don't miss out on this amazing deal.",
    "Comment now to join the conversation! We love hearing from you.",
    "Hit like if you don't want to miss out! Your support keeps us going.",
    "Share before it's too late! Help others find this amazing content.",
    "Follow right now for more fun! Stay updated with our latest streams.",
    "Click the cart to get it first! Be the first to grab this great product.",
    "Comment fast to be part of the trend! Join the conversation and let us know your thoughts.",
    "Like for a special surprise! Your support means the world to us.",
    "Share to unlock a special offer! Help us spread the word and get something special in return.",
    "Follow for exclusive discounts! Stay updated with our latest offers.",
    "Click the cart for a limited-time deal! Don't miss out on these amazing prices.",
    "Comment to receive a discount code! We're offering special deals just for you.",
    "Hit like to see more special offers! Your support helps us create better content.",
    "Share for a chance to win a prize! Spread the word and get a chance to win.",
    "Follow to get notified about our sales! Don't miss out on our special promotions.",
    "Tap the cart for a special promotion! Take advantage of our exclusive offers.",
    "Comment to participate in our giveaway! Join the fun and get a chance to win amazing prizes."
  ];

  const options = {
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
    },
    data: JSON.stringify({
      audioFormat: 'mp3',
      paragraphChunks: [insertFillerWords(likesharefollow[Math.floor(Math.random() * likesharefollow.length)])],
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
    const fileName = `keugoilikesharefollow-` + Date.now().toString();
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
    if(err.message.includes("no such file or directory")){
      console.error('no such file or directory');
      return;
    } else {
      console.error('Error generating or saving audio file:', err);
      return readRandomChunk(aiSetting, device, io);
    }
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
      `Welcome to the live stream, ${nickname}! We're glad to have you here.`,
      `Hey ${nickname}, thanks for joining the live stream!`,
      `Hi ${nickname}! Welcome to our live stream. Enjoy the show!`,
      `Great to see you here, ${nickname}! Thanks for tuning in.`,
      `Hello ${nickname}, welcome to the live stream!`,
      `Thanks for joining us, ${nickname}! We're happy to have you.`,
      `Welcome aboard, ${nickname}! Enjoy the live stream.`,
      `Hi ${nickname}, thanks for being here!`,
      `It's awesome to see you, ${nickname}! Welcome to the live stream.`,
      `Hey ${nickname}, welcome and thanks for joining!`,
      `Hi there, ${nickname}! Glad you could make it.`,
      `Welcome to the stream, ${nickname}! Enjoy!`,
      `Thanks for joining, ${nickname}! We're excited to have you here.`,
      `Hi ${nickname}! Thanks for tuning in.`,
      `Hello ${nickname}, welcome!`,
      `Hey ${nickname}, thanks for being part of our live stream!`,
      `Great to have you here, ${nickname}!`,
      `Welcome ${nickname}! Enjoy the live stream.`,
      `Thanks for joining, ${nickname}!`,
      `Hello ${nickname}! Thanks for being here.`,
      `Hey ${nickname}, welcome to our live stream!`,
      `Hi ${nickname}! Enjoy the show.`,
      `Welcome to the stream, ${nickname}! We're glad to have you.`,
      `Thanks for being here, ${nickname}!`,
      `Hi ${nickname}, welcome and enjoy!`,
      `Hey ${nickname}, thanks for joining us!`,
      `Hello ${nickname}, glad you could join us.`,
      `Welcome, ${nickname}!`,
      `Thanks for tuning in, ${nickname}!`,
      `Hey ${nickname}, welcome to the live stream!`,
      `Hi ${nickname}, thanks for being here with us.`,
      `It's great to see you, ${nickname}!`,
      `Welcome to the show, ${nickname}!`,
      `Hello ${nickname}, thanks for joining!`,
      `Hey ${nickname}, enjoy the stream!`,
      `Hi ${nickname}, welcome aboard!`,
      `Thanks for being part of the live stream, ${nickname}!`,
      `Welcome to our live stream, ${nickname}!`,
      `Hey ${nickname}, glad you could make it!`,
      `Hello ${nickname}, enjoy the show!`,
      `Thanks for joining in, ${nickname}!`,
      `Hi ${nickname}, welcome to the live stream!`,
      `Hey ${nickname}, we're happy to have you here!`,
      `Hello ${nickname}, thanks for tuning in!`,
      `Welcome, ${nickname}! Enjoy the live stream.`,
      `Hi ${nickname}, thanks for being a part of our stream!`,
      `Hey ${nickname}, welcome and enjoy!`,
      `Thanks for joining us today, ${nickname}!`,
      `Hi ${nickname}, we're glad to see you here!`,
      `Welcome to the stream, ${nickname}!`
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
      if(err.message.includes("no such file or directory")){
        console.error('no such file or directory');
        return;
      } else {
        console.error('Error generating or saving audio file:', err);
        return listenForEvents(tiktokLiveConnection, aiSetting, device, io);
      }
    }
  };

  console.log("setTimeout");

  let timeoutId = setTimeout(() => {
    console.log("runTimeout")
    tiktokLiveConnection.removeAllListeners('member', (data) => listener(data, timeoutId));
    keugoilikesharefollow(aiSetting, device, io);
    // readRandomChunk(aiSetting, device, io)
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
      if(err.message.includes("no such file or directory")){
        console.error('no such file or directory');
        return;
      } else {
        console.error('Error generating or saving audio file:', err);
        return sayHelloToEveryone(tiktokLiveConnection, aiSetting, device, io);
      }
    }
  }
  console.log("setTimeout - sayhellotoeveryone");

  let timeoutId = setTimeout(() => {
    console.log("runTimeout - sayhellotoeveryone")
    tiktokLiveConnection.removeAllListeners('roomUser', (data) => listener(data, timeoutId));
    keugoilikesharefollow(aiSetting, device, io);
    // readRandomChunk(aiSetting, device, io)
    
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
    `Your share means the world to us, ${nickname}! Thank you!`,
    `We appreciate your support and for sharing our content, ${nickname}!`,
    `Thank you for spreading the word by sharing our live stream, ${nickname}!`,
    `Your share helps us grow, ${nickname}. Thank you!`,
    `We couldn't do this without your support, ${nickname}. Thank you for sharing!`,
    `Thanks a lot for sharing our live stream with your friends, ${nickname}!`,
    `Your share is greatly appreciated, ${nickname}. Thank you!`,
    `Thank you for helping us reach more people by sharing, ${nickname}!`,
    `We're grateful for your share, ${nickname}. Thank you!`,
    `Thank you for being a part of our community and sharing our live stream, ${nickname}!`,
    `Your support and share mean everything to us, ${nickname}. Thank you!`,
    `Thank you for helping us spread the joy by sharing, ${nickname}!`,
    `We're thankful for your share, ${nickname}. It really helps us out!`,
    `Thanks for sharing our live stream, ${nickname}! We appreciate your support.`,
    `Your share has made a big impact, ${nickname}. Thank you!`,
    `We're so grateful for your share, ${nickname}. Thank you!`,
    `Thank you for taking the time to share our live stream, ${nickname}!`,
    `Your share is a huge help to us, ${nickname}. Thank you!`,
    `Thanks for sharing and supporting our content, ${nickname}!`,
    `We appreciate you spreading the word by sharing our live stream, ${nickname}!`,
    `Your share means a lot to us, ${nickname}. Thank you!`,
    `Thank you for sharing our live stream with your network, ${nickname}!`,
    `We're so grateful for your share, ${nickname}. It makes a difference!`,
    `Your share helps us reach new audiences, ${nickname}. Thank you!`,
    `Thanks for sharing and helping us grow our community, ${nickname}!`,
    `We couldn't do it without your share, ${nickname}. Thank you!`,
    `Your support through sharing means so much to us, ${nickname}. Thank you!`,
    `Thanks for sharing our live stream, ${nickname}! We appreciate your help.`,
    `We're grateful for your share and support, ${nickname}. Thank you!`,
    `Your share has helped us a lot, ${nickname}. Thank you so much!`,
    `Thank you for sharing our content and supporting us, ${nickname}!`,
    `We appreciate your share, ${nickname}. It really helps us out!`,
    `Your share is invaluable to us, ${nickname}. Thank you!`,
    `Thanks for spreading the word by sharing our live stream, ${nickname}!`,
    `We're thankful for your support and share, ${nickname}. Thank you!`,
    `Your share means more than you know, ${nickname}. Thank you!`,
    `Thank you for being awesome and sharing our live stream, ${nickname}!`,
    `We appreciate your share and continued support, ${nickname}. Thank you!`,
    `Your share has made a huge difference, ${nickname}. Thank you!`,
    `Thanks for sharing and helping us reach more people, ${nickname}!`,
    `We're grateful for your share, ${nickname}. It means a lot!`,
    `Your share helps us grow our audience, ${nickname}. Thank you!`,
    `Thanks for taking the time to share our live stream, ${nickname}!`,
    `We appreciate your share and support, ${nickname}. Thank you!`,
    `Your share has been a big help to us, ${nickname}. Thank you!`,
    `Thank you for sharing our live stream and supporting our channel, ${nickname}!`,
    `We're so grateful for your share, ${nickname}. It helps us out a lot!`,
    `Thanks for sharing and being a part of our community, ${nickname}!`,
    `Your share means the world to us, ${nickname}. Thank you so much!`
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
    `Thank you so much for following the live stream, ${nickname}! Your support means the world to us.`,
    `We appreciate your follow, ${nickname}! Thank you!`,
    `Your follow helps us out a lot, ${nickname}. Thanks a bunch!`,
    `Thanks for following the live stream, ${nickname}! We really appreciate it.`,
    `Your follow means everything to us, ${nickname}. Thank you!`,
    `Thank you for following our live stream, ${nickname}! It makes a big difference.`,
    `We're grateful for your follow, ${nickname}. Thanks!`,
    `Your support through following our live stream is appreciated, ${nickname}!`,
    `Thank you for hitting that follow button, ${nickname}!`,
    `Your follow helps us grow, ${nickname}. Thank you!`,
    `We couldn't do it without your follow, ${nickname}. Thanks!`,
    `Thanks for showing your support with a follow, ${nickname}!`,
    `We appreciate your follow and support, ${nickname}. Thank you!`,
    `Your follow means a lot to us, ${nickname}. Thanks!`,
    `Thank you for supporting our live stream with a follow, ${nickname}!`,
    `We're so thankful for your follow, ${nickname}.`,
    `Your follow is greatly appreciated, ${nickname}. Thank you!`,
    `Thanks for giving our live stream a follow, ${nickname}!`,
    `Your follow helps us reach more people, ${nickname}. Thanks!`,
    `We're grateful for your follow and support, ${nickname}.`,
    `Thank you for following our live stream, ${nickname}!`,
    `Your follow is a big help to us, ${nickname}. Thank you!`,
    `Thanks for your follow, ${nickname}! It means a lot to us.`,
    `We appreciate your follow, ${nickname}!`,
    `Thank you for hitting the follow button, ${nickname}!`,
    `Your follow means everything to us, ${nickname}. Thank you!`,
    `Thanks for following our content, ${nickname}!`,
    `We're grateful for your support through follows, ${nickname}.`,
    `Your follow helps us a lot, ${nickname}. Thank you!`,
    `Thank you for following our live stream, ${nickname}!`,
    `Your follow is invaluable to us, ${nickname}. Thanks!`,
    `We appreciate you following our live stream, ${nickname}!`,
    `Thank you for showing your support with a follow, ${nickname}!`,
    `Your follow makes a big difference, ${nickname}. Thanks!`,
    `We're thankful for your follow, ${nickname}.`,
    `Thanks for following and supporting our live stream, ${nickname}!`,
    `Your follow is a huge help to us, ${nickname}. Thank you!`,
    `Thank you for hitting follow, ${nickname}!`,
    `We appreciate your follow and continued support, ${nickname}.`,
    `Your follow has made a big impact, ${nickname}. Thanks!`,
    `Thanks for following and helping us grow, ${nickname}!`,
    `We're grateful for your follow, ${nickname}. It means a lot!`,
    `Your follow helps us reach new audiences, ${nickname}. Thank you!`,
    `Thank you for following our live stream and supporting our channel, ${nickname}!`,
    `Your follow means the world to us, ${nickname}. Thanks!`,
    `We appreciate your support through follows, ${nickname}.`,
    `Thank you for showing your support with a follow, ${nickname}!`,
    `Your follow helps us create more content, ${nickname}. Thanks!`,
    `Thanks for following and supporting us, ${nickname}!`,
    `We're so grateful for your follow, ${nickname}. It really helps!`
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
    `Thank you so much for liking the live stream, ${nickname}! Your support means a lot.`,
    `We appreciate your like, ${nickname}! Thank you!`,
    `Your like helps us out so much, ${nickname}. Thanks a lot!`,
    `Thanks for liking the live stream, ${nickname}! We really appreciate it.`,
    `Your like means the world to us, ${nickname}. Thank you!`,
    `Thank you for liking our live stream, ${nickname}! It makes a big difference.`,
    `We're grateful for your like, ${nickname}. Thanks!`,
    `Your support through liking our live stream is appreciated, ${nickname}!`,
    `Thank you for hitting that like button, ${nickname}!`,
    `Your like helps us grow, ${nickname}. Thank you!`,
    `We couldn't do it without your like, ${nickname}. Thanks!`,
    `Thanks for showing your support with a like, ${nickname}!`,
    `We appreciate your like and support, ${nickname}. Thank you!`,
    `Your like means a lot to us, ${nickname}. Thanks!`,
    `Thank you for supporting our live stream with a like, ${nickname}!`,
    `We're so thankful for your like, ${nickname}.`,
    `Your like is greatly appreciated, ${nickname}. Thank you!`,
    `Thanks for giving our live stream a like, ${nickname}!`,
    `Your like helps us reach more people, ${nickname}. Thanks!`,
    `We're grateful for your like and support, ${nickname}.`,
    `Thank you for liking our live stream, ${nickname}!`,
    `Your like is a big help to us, ${nickname}. Thank you!`,
    `Thanks for your like, ${nickname}! It means a lot to us.`,
    `We appreciate your like, ${nickname}!`,
    `Thank you for hitting the like button, ${nickname}!`,
    `Your like means everything to us, ${nickname}. Thank you!`,
    `Thanks for liking our content, ${nickname}!`,
    `We're grateful for your support through likes, ${nickname}.`,
    `Your like helps us a lot, ${nickname}. Thank you!`,
    `Thank you for liking our live stream, ${nickname}!`,
    `Your like is invaluable to us, ${nickname}. Thanks!`,
    `We appreciate you liking our live stream, ${nickname}!`,
    `Thank you for showing your support with a like, ${nickname}!`,
    `Your like makes a big difference, ${nickname}. Thanks!`,
    `We're thankful for your like, ${nickname}.`,
    `Thanks for liking and supporting our live stream, ${nickname}!`,
    `Your like is a huge help to us, ${nickname}. Thank you!`,
    `Thank you for hitting like, ${nickname}!`,
    `We appreciate your like and continued support, ${nickname}.`,
    `Your like has made a big impact, ${nickname}. Thanks!`,
    `Thanks for liking and helping us grow, ${nickname}!`,
    `We're grateful for your like, ${nickname}. It means a lot!`,
    `Your like helps us reach new audiences, ${nickname}. Thank you!`,
    `Thank you for liking our live stream and supporting our channel, ${nickname}!`,
    `Your like means the world to us, ${nickname}. Thanks!`,
    `We appreciate your support through likes, ${nickname}.`,
    `Thank you for showing your support with a like, ${nickname}!`,
    `Your like helps us create more content, ${nickname}. Thanks!`,
    `Thanks for liking and supporting us, ${nickname}!`,
    `We're so grateful for your like, ${nickname}. It really helps!`
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
  const pitch = getRandomValue(1.0, 1.1); // Giá trị ngẫu nhiên cho pitch
  const volume = getRandomValue(0.8, 1.5); // Giá trị ngẫu nhiên cho loudness
  const tempo = getRandomValue(1.0, 1.2); // Giá trị ngẫu nhiên cho rhythm
  const highpass = getRandomValue(400, 500); // Giá trị ngẫu nhiên cho highpass filter (timbre)
  const lowpass = getRandomValue(3000, 4000); // Giá trị ngẫu nhiên cho lowpass filter (timbre)
  const tremolo = getRandomValue(0.1, 0.5); // Giá trị ngẫu nhiên cho tremolo

  // console.log("processAudio");
  // console.log(pitch);
  // console.log(volume);
  // console.log(tempo);
  // console.log(highpass);
  // console.log(lowpass);
  // console.log(tremolo);

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
