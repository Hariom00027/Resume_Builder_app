/**
 * Custom ATS scoring logic that evaluates a resume object against industry best practices.
 * This runs fast without hitting the OpenAI API to allow real-time feedback.
 */
class AtsScoringService {
  constructor() {
    this.actionVerbs = new Set([
      'achieved', 'managed', 'led', 'developed', 'created', 'designed', 'improved', 'increased',
      'reduced', 'resolved', 'spearheaded', 'orchestrated', 'implemented', 'launched', 'optimized',
      'negotiated', 'streamlined', 'transformed', 'directed', 'executed', 'built', 'delivered'
    ]);
  }

  /**
   * Calculates an ATS score (0-100) and provides actionable feedback.
   * @param {Object} formData - The flattened/unified form data from the resume builder
   * @returns {Object} { score, feedback } 
   */
  calculateScore(formData) {
    let score = 0;
    const feedback = [];
    const maxScore = 100;
    
    // Convert object values to a single string to easily count words and search
    // Ignore keys like 'profileImage', ID keys, etc.
    const fullText = Object.entries(formData)
      .filter(([key]) => !key.toLowerCase().includes('image') && !key.toLowerCase().includes('id') && !key.toLowerCase().includes('url'))
      .map(([_, val]) => String(val))
      .join(' ');
      
    const words = fullText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // 1. Word Count (Max 15)
    // Sweet spot is usually 400 - 800 words. Too little = incomplete, too much = bloated.
    if (wordCount < 150) {
      score += 5;
      feedback.push(`Your resume is very short (${wordCount} words). Try to add more details to your experience to reach at least 400 words.`);
    } else if (wordCount >= 150 && wordCount < 400) {
      score += 10;
      feedback.push(`Your word count (${wordCount}) is a bit low. Aim for 400+ words to ensure sufficient detail.`);
    } else if (wordCount >= 400 && wordCount <= 800) {
      score += 15;
    } else {
      score += 12; // Slight penalty for being too long
      feedback.push(`Your resume is quite long (${wordCount} words). Consider trimming to keep it concise and under 800 words.`);
    }

    // 2. Contact Info Check (Max 15)
    let contactScore = 0;
    const hasEmail = this._hasValueMatcher(formData, ['email']);
    const hasPhone = this._hasValueMatcher(formData, ['phone', 'mobile']);
    const hasLinkedIn = this._hasValueMatcher(formData, ['linkedin']);

    if (hasEmail) contactScore += 5;
    else feedback.push('Missing an email address. Recruiters need a way to contact you.');
    
    if (hasPhone) contactScore += 5;
    else feedback.push('Missing a phone number.');
    
    if (hasLinkedIn) contactScore += 5;
    else feedback.push('Adding a LinkedIn profile URL is highly recommended for modern applications.');
    
    score += contactScore;

    // 3. Summary Section (Max 10)
    const summaryVal = this._getValueMatcher(formData, ['summary', 'about', 'profile']);
    if (!summaryVal) {
      feedback.push('You are missing a professional summary. A summary helps quickly convey your value proposition.');
    } else {
      const summaryWords = summaryVal.split(/\s+/).length;
      if (summaryWords < 20) {
        score += 5;
        feedback.push('Your professional summary is quite short. Try to write 3-5 sentences highlighting your best achievements.');
      } else {
        score += 10;
      }
    }

    // 4. Measurable Metrics - Numbers/Percentages (Max 30)
    // ATS parsers look for verifiable data (%, $, numbers) in experience sections.
    const experienceText = this._getExperienceText(formData);
    if (!experienceText) {
      feedback.push('No work experience found. If you are a student, add relevant projects!');
    } else {
      const numberMatches = experienceText.match(/\d+/g) || [];
      const percentMatches = experienceText.match(/%/g) || [];
      const currencyMatches = experienceText.match(/[$€£₹]/g) || [];
      
      const totalMetrics = numberMatches.length + percentMatches.length + currencyMatches.length;
      
      if (totalMetrics === 0) {
        feedback.push('Your experience section lacks measurable metrics. Add numbers, percentages, or dollar amounts to quantify your impact.');
      } else if (totalMetrics < 5) {
        score += 15;
        feedback.push(`You have a few numbers in your experience, but try adding more to quantify your achievements (e.g. "Increased sales by 15%").`);
      } else if (totalMetrics < 10) {
        score += 25;
        feedback.push('Good use of metrics! Adding a couple more numbers or percentages could make your experience even stronger.');
      } else {
        score += 30; // Excellent use of metrics
      }
    }

    // 5. Action Verbs (Max 15)
    if (experienceText) {
      const expWords = experienceText.toLowerCase().split(/\s+/);
      let verbHitCount = 0;
      expWords.forEach(w => {
        // Strip out punctuation
        const cleanWord = w.replace(/[.,:;()]/g, '');
        if (this.actionVerbs.has(cleanWord)) verbHitCount++;
      });

      if (verbHitCount === 0) {
        feedback.push('Try starting your bullet points with strong action verbs like "Managed", "Developed", or "Led".');
      } else if (verbHitCount < 5) {
        score += 8;
        feedback.push('Use more strong action verbs (e.g., spearheaded, orchestrated) to describe your responsibilities.');
      } else {
        score += 15;
      }
    }

    // 6. Skills (Max 15)
    // Check for 'skills' key or similar
    const skillsText = this._getValueMatcher(formData, ['skill', 'technologies', 'tools']);
    if (!skillsText) {
      feedback.push('No skills section found. ATS systems heavily weigh keyword matches from the skills section.');
    } else {
      // Split by comma or newline
      const skillCount = skillsText.split(/,|\n/).filter(s => s.trim().length > 0).length;
      if (skillCount < 5) {
        score += 5;
        feedback.push(`You only have ${skillCount} skills listed. Try to list 8-15 relevant hard skills.`);
      } else if (skillCount < 8) {
        score += 10;
        feedback.push(`You have ${skillCount} skills. Adding a few more specific technologies or methodologies can help ATS matching.`);
      } else {
        score += 15;
      }
    }

    // Calculate final score
    const finalScore = Math.min(Math.max(score, 0), maxScore);
    
    // Sort feedback so most critical are first, but limit to top 5
    return {
      score: finalScore,
      feedback: feedback.slice(0, 5)
    };
  }

  // Helper to check if any field matches a list of possible names and has a value
  _hasValueMatcher(formData, possibleNames) {
    return Object.keys(formData).some(key => {
      const lowerKey = key.toLowerCase();
      // Only check the field name part (after the last underscore usually or exactly)
      const fieldName = lowerKey.includes('__') ? lowerKey.split('__').pop() : lowerKey;
      if (possibleNames.some(p => fieldName.includes(p))) {
        return !!formData[key];
      }
      return false;
    });
  }

  // Helper to get concatenated value of fields matching names
  _getValueMatcher(formData, possibleNames) {
    let result = '';
    Object.keys(formData).forEach(key => {
      const lowerKey = key.toLowerCase();
      const fieldName = lowerKey.includes('__') ? lowerKey.split('__').pop() : lowerKey;
      if (possibleNames.some(p => fieldName.includes(p))) {
        if (formData[key]) result += formData[key] + ' ';
      }
    });
    return result.trim();
  }

  // Helper to extract text dedicated to experience
  _getExperienceText(formData) {
    let result = '';
    Object.keys(formData).forEach(key => {
      const lowerKey = key.toLowerCase();
      // Look for keys belonging to an experience or project section
      if (lowerKey.includes('experience') || lowerKey.includes('project') || lowerKey.includes('work') || lowerKey.includes('employment')) {
        // Specifically grab descriptions or achievements
        if (lowerKey.includes('description') || lowerKey.includes('achievement') || lowerKey.includes('responsibility')) {
           if (formData[key]) result += formData[key] + ' ';
        }
      }
    });
    return result.trim();
  }
}

module.exports = new AtsScoringService();
