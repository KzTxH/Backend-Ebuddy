const AISetting = require('../models/AISetting');

// Save AI settings
exports.saveSettings = async (req, res) => {
  try {
    const { productName, description, parameters } = req.body;

    const newSetting = new AISetting({
      productName,
      description,
      parameters,
    });

    const savedSetting = await newSetting.save();
    req.app.get('socketio').emit('newAISetting', savedSetting); // Emit the new setting

    res.json(savedSetting);
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
  try {
    const { id } = req.params;
    const { productName, description, parameters } = req.body;

    const setting = await AISetting.findById(id);
    if (!setting) {
      return res.status(404).json({ msg: 'Setting not found' });
    }

    setting.productName = productName || setting.productName;
    setting.description = description || setting.description;
    setting.parameters = parameters || setting.parameters;

    const updatedSetting = await setting.save();
    req.app.get('socketio').emit('updatedAISetting', updatedSetting); // Emit the updated setting

    res.json(updatedSetting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete AI settings
exports.deleteSettings = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await AISetting.findById(id);
    if (!setting) {
      return res.status(404).json({ msg: 'Setting not found' });
    }

    await setting.remove();
    req.app.get('socketio').emit('deletedAISetting', id); // Emit the deleted setting ID

    res.json({ msg: 'Setting removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
