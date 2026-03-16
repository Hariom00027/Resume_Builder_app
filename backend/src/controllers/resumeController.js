const Resume = require('../models/Resume');
const parseService = require('../services/parseService');

class ResumeController {
  // Get all resumes
  async getAllResumes(req, res) {
    try {
      const resumes = await Resume.find().sort({ updatedAt: -1 });
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get resume by ID
  async getResumeById(req, res) {
    try {
      const resume = await Resume.findById(req.params.id);
      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }
      res.json(resume);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create new resume
  async createResume(req, res) {
    try {
      const resumeData = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const resume = new Resume(resumeData);
      await resume.save();
      res.status(201).json(resume);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update resume
  async updateResume(req, res) {
    try {
      const resume = await Resume.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }
      res.json(resume);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete resume
  async deleteResume(req, res) {
    try {
      const resume = await Resume.findByIdAndDelete(req.params.id);
      if (!resume) {
        return res.status(404).json({ error: 'Resume not found' });
      }
      res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Duplicate resume
  async duplicateResume(req, res) {
    try {
      const originalResume = await Resume.findById(req.params.id);
      if (!originalResume) {
        return res.status(404).json({ error: 'Resume not found' });
      }

      const duplicatedData = originalResume.toObject();
      delete duplicatedData._id;
      delete duplicatedData.createdAt;
      delete duplicatedData.updatedAt;
      duplicatedData.title = `${originalResume.title} (Copy)`;

      const duplicatedResume = new Resume(duplicatedData);
      await duplicatedResume.save();
      res.status(201).json(duplicatedResume);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Parse uploaded resume file
  async parseResume(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log(`Parsing resume file: ${req.file.originalname}, type: ${req.file.mimetype}, size: ${req.file.size} bytes`);

      const parsedResume = await parseService.parseResume(req.file);
      
      res.json(parsedResume);
    } catch (error) {
      console.error('Error parsing resume:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ResumeController();
