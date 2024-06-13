const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const chokidar = require('chokidar');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Init Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Serve static files
app.use('/audio', express.static(path.join(__dirname, 'public/audio_files')));

const AUDIO_DIR = path.join(__dirname, 'public', 'audio_files');

const getAudioFiles = (deviceName) => {
  if (!deviceName) {
    console.error('Device name is undefined');
    return [];
  }
  const deviceDir = path.join(AUDIO_DIR, deviceName);
  if (!fs.existsSync(deviceDir)) {
    console.error(`Directory for device ${deviceName} does not exist`);
    return [];
  }
  if (!fs.lstatSync(deviceDir).isDirectory()) {
    console.error(`${deviceDir} is not a directory`);
    return [];
  }
  return fs.readdirSync(deviceDir)
    .filter(file => path.extname(file) === '.mp3')
    .sort((a, b) => a.localeCompare(b));
};

// Define routes
const authRoutes = require('./router/authRoutes');
const phoneRoutes = require('./router/phoneRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/phone', phoneRoutes);

app.get('/audio/:deviceName/:filename', (req, res) => {
  const { deviceName, filename } = req.params;
  if (!deviceName || !filename) {
    return res.status(400).send('Device name or filename is missing');
  }
  const filePath = path.join(AUDIO_DIR, deviceName, filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('getAudioFiles', (deviceName) => {
    if (!deviceName) {
      console.error('Device name is undefined');
      return;
    }
    const files = getAudioFiles(deviceName);
    socket.emit('audioFiles', files);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
});

chokidar.watch(AUDIO_DIR).on('all', (event, filePath) => {
  console.log(event, filePath);
  if (!fs.existsSync(filePath)) {
    return;
  }
  const relativePath = path.relative(AUDIO_DIR, filePath);
  const deviceName = relativePath.split(path.sep)[0];
  if (!deviceName || !fs.lstatSync(path.join(AUDIO_DIR, deviceName)).isDirectory()) {
    console.error('Device name is undefined or is not a directory');
    return;
  }
  const files = getAudioFiles(deviceName);
  io.emit('updateAudioFiles', { deviceName, files });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});