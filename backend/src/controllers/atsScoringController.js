const atsScoringService = require('../services/atsScoringService');

class AtsScoringController {
  /**
   * Evaluates a resume and returns a score out of 100 with feedback
   * POST /api/ats-scoring/analyze
   */
  async analyzeResume(req, res) {
    try {
      const formData = req.body;
      
      if (!formData || typeof formData !== 'object') {
        return res.status(400).json({ error: 'Form data is required.' });
      }

      const result = atsScoringService.calculateScore(formData);
      res.json(result);
      
    } catch (error) {
      console.error('Error in ATS Scoring:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze resume' });
    }
  }
}

module.exports = new AtsScoringController();
