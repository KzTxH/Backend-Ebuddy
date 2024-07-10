const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const producttypeSettingsController = require('../controllers/producttypeSettingsController');

// @route POST /api/ai-settings
// @desc Save AI settings
// @access Private
router.post('/', auth, producttypeSettingsController.saveSettings);

// @route GET /api/ai-settings
// @desc Get all AI settings
// @access Private
router.get('/', auth, producttypeSettingsController.getAllSettings);

// @route PUT /api/ai-settings/:id
// @desc Update AI settings
// @access Private
router.put('/:id', auth, producttypeSettingsController.updateSettings);

// @route DELETE /api/ai-settings/:id
// @desc Delete AI settings
// @access Private
router.delete('/:id', auth, producttypeSettingsController.deleteSettings);

module.exports = router;
