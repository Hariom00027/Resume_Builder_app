const express = require('express');
const router = express.Router();
const atsScoringController = require('../controllers/atsScoringController');

router.post('/analyze', atsScoringController.analyzeResume.bind(atsScoringController));

module.exports = router;
