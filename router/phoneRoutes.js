const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const deviceController = require('../controllers/deviceController');

// @route POST /api/phone/activate
// @desc Activate device
// @access Private
router.post('/activate', auth, deviceController.activateDevice);

// @route POST /api/phone/deactivate
// @desc Deactivate device
// @access Private
router.post('/deactivate', auth, deviceController.deactivateDevice);

// @route GET /api/phone/active-devices
// @desc Get list of active devices
// @access Private
router.get('/active-devices', auth, deviceController.getActiveDevices);

// @route POST /api/phone/link-ai-settings
// @desc Link AI settings to a device
// @access Private
// router.post('/link-ai-settings', auth, deviceController.linkAISettings);

router.post('/voice-ai', auth, deviceController.voiceAI);

router.delete('/audio/:deviceName/:fileName', auth, deviceController.deleteAudioFile);

module.exports = router;
