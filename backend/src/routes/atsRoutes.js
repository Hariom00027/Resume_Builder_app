const express = require('express');
const router = express.Router();
const atsController = require('../controllers/atsController');

router.post('/analyze/:id', atsController.analyzeResume.bind(atsController));
router.post('/match', atsController.matchResumeToJob.bind(atsController));

module.exports = router;
