const express = require('express');
const multer = require('multer');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
    }
  }
});

router.get('/', resumeController.getAllResumes.bind(resumeController));
router.get('/:id', resumeController.getResumeById.bind(resumeController));
router.post('/', resumeController.createResume.bind(resumeController));
router.put('/:id', resumeController.updateResume.bind(resumeController));
router.delete('/:id', resumeController.deleteResume.bind(resumeController));
router.post('/:id/duplicate', resumeController.duplicateResume.bind(resumeController));
router.post('/parse', upload.single('file'), resumeController.parseResume.bind(resumeController));

module.exports = router;
