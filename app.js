const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./router/authRoutes');
const phoneRoutes = require('./router/phoneRoutes');
const aiSettingsRoutes = require('./router/aiSettingsRoutes');

require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Init Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Serve static files

const AUDIO_DIR = path.join(__dirname, 'public', 'audio_files');

app.use('/audio', express.static(path.join(__dirname, 'public/audio_files')));
app.use('/api/auth', authRoutes);
app.use('/api/phone', phoneRoutes);
app.use('/api/ai-settings', aiSettingsRoutes);

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
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('error', (error) => {
    console.error(`Client [id=${socket.id}] encountered error: ${error}`);
  });


});


const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});