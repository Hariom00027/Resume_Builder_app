const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/generate-summary', aiController.generateSummary.bind(aiController));
router.post('/generate-bullets', aiController.generateExperienceBullets.bind(aiController));
router.post('/match-job', aiController.matchJobDescription.bind(aiController));
router.post('/auto-tailor-job', aiController.autoTailorResume.bind(aiController));
router.post('/optimize-bullets', aiController.optimizeBullets.bind(aiController));
router.post('/tailor-resume', aiController.tailorResume.bind(aiController));
router.post('/suggest-improvements', aiController.suggestImprovements.bind(aiController));
router.post('/parse-job-description', aiController.parseJobDescription.bind(aiController));
router.post('/analyze-template', aiController.analyzeTemplateStructure.bind(aiController));
router.post('/inject-template-data', aiController.injectTemplateData.bind(aiController));

module.exports = router;
