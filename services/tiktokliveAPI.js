const { WebcastPushConnection } = require('tiktok-live-connector');

const connectToTikTokLive = (username) => {
  return new Promise((resolve, reject) => {
    const tiktokLiveConnection = new WebcastPushConnection(username);

    tiktokLiveConnection.connect()
      .then(state => {
        console.log(`Connected to TikTok live stream of user ${username}`);
        resolve(tiktokLiveConnection);
      })
      .catch(err => {
        console.error('Error connecting to TikTok live stream:', err);
        reject(err);
      });

    tiktokLiveConnection.on('chat', data => {
      console.log(`${data.uniqueId}: ${data.comment}`);
    });

    tiktokLiveConnection.on('gift', data => {
      console.log(`${data.uniqueId} sent ${data.giftName} (${data.giftId})`);
    });

    tiktokLiveConnection.on('disconnect', reason => {
      console.log('Disconnected:', reason);
    });
  });
};

module.exports = {
  connectToTikTokLive,
};
