const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const ResumeTemplate = require('../models/ResumeTemplate');
const pdfService = require('../services/pdfService');
const docxService = require('../services/docxService');

// Export to PDF
router.post('/pdf/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // The frontend sends the pre-rendered HTML when available.
    // This ensures the PDF matches the preview exactly (templateOverrides, deleted
    // sections, AI edits, customization colours — all already applied on the client).
    const preRenderedHtml = typeof req.body.html === 'string' ? req.body.html.trim() : '';

    let pdf;
    if (preRenderedHtml) {
      pdf = await pdfService.generatePDFFromHTML(preRenderedHtml);
    } else {
      // Fallback: re-render from the template + structured fields (legacy path).
      const template = await ResumeTemplate.findOne({ templateId: resume.templateId });
      if (!template) return res.status(404).json({ error: 'Template not found' });
      pdf = await pdfService.generatePDF(resume, template);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.title || 'resume'}.pdf"`);
    res.send(pdf);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export to DOCX
router.post('/docx/:id', async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const template = await ResumeTemplate.findOne({ templateId: resume.templateId });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const docx = await docxService.generateDOCX(resume, template);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.title || 'resume'}.docx"`);
    res.send(docx);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
