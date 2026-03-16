const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

router.get('/', templateController.getAllTemplates.bind(templateController));
router.get('/:id', templateController.getTemplateById.bind(templateController));
router.post('/', templateController.createTemplate.bind(templateController));
router.put('/:id', templateController.updateTemplate.bind(templateController));
// Schema management routes
router.put('/:templateId/schema', templateController.updateTemplateSchema.bind(templateController));
router.post('/:templateId/regenerate-schema', templateController.regenerateSchema.bind(templateController));

module.exports = router;
