const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const aiSettingsController = require('../controllers/aiSettingsController');

// @route POST /api/ai-settings
// @desc Save AI settings
// @access Private
router.post('/', auth, aiSettingsController.saveSettings);

// @route GET /api/ai-settings
// @desc Get all AI settings
// @access Private
router.get('/', auth, aiSettingsController.getAllSettings);

// @route PUT /api/ai-settings/:id
// @desc Update AI settings
// @access Private
router.put('/:id', auth, aiSettingsController.updateSettings);

// @route DELETE /api/ai-settings/:id
// @desc Delete AI settings
// @access Private
router.delete('/:id', auth, aiSettingsController.deleteSettings);

module.exports = router;
