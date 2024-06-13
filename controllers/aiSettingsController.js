const AISettings = require('../models/AISettings');

exports.saveSettings = async (req, res) => {
  const { productName, settings } = req.body;

  if (!productName) {
    return res.status(400).json({ msg: 'Tên Sản Phẩm là bắt buộc' });
  }

  try {
    const newSettings = new AISettings({
      productName,
      settings,
    });

    await newSettings.save();

    // Emit event for real-time updates
    req.app.get('socketio').emit('updateAISettings');

    res.json(newSettings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getAllSettings = async (req, res) => {
  try {
    const settings = await AISettings.find();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.updateSettings = async (req, res) => {
  const { productName, settings } = req.body;

  if (!productName) {
    return res.status(400).json({ msg: 'Tên Sản Phẩm là bắt buộc' });
  }

  try {
    const updatedSettings = await AISettings.findByIdAndUpdate(
      req.params.id,
      { productName, settings },
      { new: true }
    );

    // Emit event for real-time updates
    req.app.get('socketio').emit('updateAISettings');

    res.json(updatedSettings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.deleteSettings = async (req, res) => {
  try {
    await AISettings.findByIdAndDelete(req.params.id);

    // Emit event for real-time updates
    req.app.get('socketio').emit('updateAISettings');

    res.json({ msg: 'Cài Đặt AI đã được xóa' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
