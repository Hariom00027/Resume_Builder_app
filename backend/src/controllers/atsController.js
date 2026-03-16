const atsService = require('../services/atsService');
const Resume = require('../models/Resume');

class ATSController {
  // Analyze resume ATS compatibility
  async analyzeResume(req, res) {
    try {
      const resume = await Resume.findById(req.params.id);
      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      const analysis = atsService.analyzeResume(resume);
      
      // Update resume with ATS score
      resume.atsScore = analysis.score;
      await resume.save();

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Match resume to job description
  async matchResumeToJob(req, res) {
    try {
      const { resumeId, jobDescription } = req.body;
      const resume = await Resume.findById(resumeId);
      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      const match = atsService.matchResumeToJob(resume, jobDescription);
      res.json(match);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ATSController();
