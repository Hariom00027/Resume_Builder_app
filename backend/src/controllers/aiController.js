const openaiService = require('../services/openaiService');
const Resume = require('../models/Resume');
const ResumeTemplate = require('../models/ResumeTemplate');

class AIController {
  // Generate professional summary
  async generateSummary(req, res) {
    try {
      const { experience, education, skills } = req.body;
      const summary = await openaiService.generateSummary(experience, education, skills);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Optimize bullet points
  async optimizeBullets(req, res) {
    try {
      const { achievements, role, company } = req.body;
      const optimized = await openaiService.optimizeBullets(achievements, role, company);
      res.json({ optimized });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Generate experience bullets from scratch
  async generateExperienceBullets(req, res) {
    try {
      const { role, company, keywords } = req.body;
      const bullets = await openaiService.generateExperienceBullets(role, company, keywords);
      res.json({ bullets });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Match resume keywords against a job description
  async matchJobDescription(req, res) {
    try {
      const { resumeText, jobDescriptionText } = req.body;
      if (!resumeText || !jobDescriptionText) {
        return res.status(400).json({ error: 'Both resumeText and jobDescriptionText are required.' });
      }
      const result = await openaiService.matchJobDescription(resumeText, jobDescriptionText);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Auto-tailor: rewrite resume summary + bullets to match a job
  async autoTailorResume(req, res) {
    try {
      const { resume, jobDescriptionText } = req.body;
      if (!resume || !jobDescriptionText) {
        return res.status(400).json({ error: 'resume and jobDescriptionText are required.' });
      }
      const result = await openaiService.autoTailorResume(resume, jobDescriptionText);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async tailorResume(req, res) {

    try {
      const { resumeId, jobDescription } = req.body;
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      const suggestions = await openaiService.tailorResume(resume, jobDescription);
      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Suggest improvements
  async suggestImprovements(req, res) {
    try {
      const { resumeId } = req.body;
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      const suggestions = await openaiService.suggestImprovements(resume);
      res.json({ suggestions });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Parse job description
  async parseJobDescription(req, res) {
    try {
      const { jobDescription } = req.body;
      const parsed = await openaiService.parseJobDescription(jobDescription);
      res.json(parsed);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Analyze template structure
  async analyzeTemplateStructure(req, res) {
    try {
      const { templateHtml, templateId } = req.body;
      if (!templateHtml) {
        return res.status(400).json({ error: 'templateHtml is required' });
      }
      
      // Try to fetch template schema if templateId is provided
      let templateSchema = null;
      if (templateId) {
        try {
          const template = await ResumeTemplate.findOne({ templateId });
          if (template && template.templateSchema) {
            templateSchema = template.templateSchema;
            console.log('[AI Controller] Found template schema for:', templateId);
          }
        } catch (err) {
          console.warn('[AI Controller] Could not fetch template schema:', err.message);
        }
      }
      
      console.log('[AI Controller] Analyzing template structure, HTML length:', templateHtml.length);
      console.log('[AI Controller] Using template schema:', templateSchema ? 'Yes' : 'No');
      console.log('[AI Controller] Request received at:', new Date().toISOString());
      const analysis = await openaiService.analyzeTemplateStructure(templateHtml, templateSchema);
      console.log('[AI Controller] Analysis completed, sections found:', analysis.sections?.length || 0);
      res.json(analysis);
    } catch (error) {
      console.error('[AI Controller] Error in analyzeTemplateStructure:', error);
      console.error('[AI Controller] Error name:', error.name);
      console.error('[AI Controller] Error message:', error.message);
      if (error.stack) {
        console.error('[AI Controller] Error stack:', error.stack);
      }
      res.status(500).json({ 
        error: error.message || 'Failed to analyze template structure',
        errorName: error.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Inject data into Template
  async injectTemplateData(req, res) {
    try {
      const { templateHtml, formData, mode = 'edit' } = req.body;
      if (!templateHtml || !formData) {
        return res.status(400).json({ error: 'templateHtml and formData are required' });
      }

      console.log(`[AI Controller] Injecting template structure (Mode: ${mode}), HTML length:`, templateHtml.length);
      const injectedHtml = await openaiService.injectTemplateData(templateHtml, formData, mode);
      console.log('[AI Controller] Injection completed.');
      res.json({ html: injectedHtml });
    } catch (error) {
      console.error('[AI Controller] Error in injectTemplateData:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to inject template data',
        errorName: error.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = new AIController();
