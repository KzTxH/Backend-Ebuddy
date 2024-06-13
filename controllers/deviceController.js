const Device = require('../models/Device');

exports.activateDevice = async (req, res) => {
  const { deviceName, tiktokUsername } = req.body;

  try {
    let device = await Device.findOne({ deviceName });

    if (!device) {
      device = new Device({ deviceName, tiktokUsername, isActive: true });
      await device.save();
    } else {
      device.tiktokUsername = tiktokUsername;
      device.isActive = true;
      await device.save();
    }

    const activeDevices = await Device.find({ isActive: true });
    req.app.get('socketio').emit('updateActiveDevices', activeDevices);

    res.json(device);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

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
    req.app.get('socketio').emit('updateActiveDevices', activeDevices);

    res.json(device);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getActiveDevices = async (req, res) => {
  try {
    const devices = await Device.find({ isActive: true });
    res.json(devices);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
