const AISetting = require('../models/AISetting');

// Save AI settings
exports.saveSettings = async (req, res) => {
  const { productName, description } = req.body;

  try {
    const newSetting = new AISetting({ productName, description });
    const setting = await newSetting.save();
    res.json(setting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all AI settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await AISetting.find();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update AI settings
exports.updateSettings = async (req, res) => {
  const { productName, description } = req.body;

  try {
    let setting = await AISetting.findById(req.params.id);

    if (!setting) {
      return res.status(404).json({ msg: 'AI setting not found' });
    }

    setting.productName = productName;
    setting.description = description;
    // Update other fields

    setting = await setting.save();
    res.json(setting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete AI settings
exports.deleteSettings = async (req, res) => {
  try {
    let setting = await AISetting.findById(req.params.id);

    if (!setting) {
      return res.status(404).json({ msg: 'AI setting not found' });
    }

    await AISetting.findByIdAndRemove(req.params.id);
    res.json({ msg: 'AI setting removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
