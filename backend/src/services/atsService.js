class ATSService {
  /**
   * Analyze resume for ATS compatibility
   */
  analyzeResume(resumeData) {
    const issues = [];
    const suggestions = [];
    let score = 100;

    // Check for required sections
    const requiredSections = ['personalInfo', 'experience', 'education'];
    requiredSections.forEach(section => {
      if (!resumeData[section] || 
          (Array.isArray(resumeData[section]) && resumeData[section].length === 0)) {
        issues.push(`Missing or empty ${section} section`);
        score -= 10;
      }
    });

    // Check for keywords
    const keywordCount = this.extractKeywords(resumeData).length;
    if (keywordCount < 10) {
      issues.push('Low keyword density - add more relevant skills and keywords');
      suggestions.push('Include more industry-specific keywords and technical skills');
      score -= 15;
    }

    // Check format compliance
    if (resumeData.customization?.typography?.fontFamilyTitle?.includes('serif')) {
      issues.push('Serif fonts may not be ATS-friendly');
      suggestions.push('Use sans-serif fonts for better ATS compatibility');
      score -= 5;
    }

    // Check for proper dates
    resumeData.experience?.forEach((exp, index) => {
      if (!exp.startDate || !exp.endDate) {
        issues.push(`Experience entry ${index + 1} missing dates`);
        score -= 5;
      }
    });

    // Check for achievements/quantifiable results
    let hasQuantifiableResults = false;
    resumeData.experience?.forEach(exp => {
      exp.achievements?.forEach(achievement => {
        if (/\d+%|\d+\s*(years?|months?|dollars?|people|users?|projects?)/i.test(achievement)) {
          hasQuantifiableResults = true;
        }
      });
    });

    if (!hasQuantifiableResults) {
      suggestions.push('Add quantifiable achievements (percentages, numbers, metrics)');
      score -= 10;
    }

    // Check section naming
    const standardSections = ['experience', 'education', 'skills', 'summary'];
    const customSections = resumeData.customization?.sectionTitles || {};
    Object.keys(customSections).forEach(key => {
      if (!standardSections.includes(key.toLowerCase())) {
        suggestions.push(`Use standard section names for better ATS parsing`);
      }
    });

    // Calculate breakdown scores
    const keywordScore = keywordCount >= 20 ? 100 : keywordCount >= 10 ? 75 : keywordCount >= 5 ? 50 : 25;
    const formatScore = resumeData.customization?.typography?.fontFamilyTitle?.includes('serif') ? 85 : 100;
    
    // Structure score based on required sections
    let structureScore = 100;
    requiredSections.forEach(section => {
      if (!resumeData[section] || (Array.isArray(resumeData[section]) && resumeData[section].length === 0)) {
        structureScore -= 33;
      }
    });
    structureScore = Math.max(0, structureScore);

    // Content score based on quantifiable results and completeness
    let contentScore = hasQuantifiableResults ? 90 : 70;
    if (!resumeData.summary || resumeData.summary.trim().length < 50) {
      contentScore -= 10;
    }
    contentScore = Math.max(0, contentScore);

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      score,
      breakdown: {
        keywords: keywordScore,
        format: formatScore,
        structure: structureScore,
        content: contentScore
      },
      issues,
      suggestions,
      keywordCount,
      hasQuantifiableResults
    };
  }

  /**
   * Extract keywords from resume
   */
  extractKeywords(resumeData) {
    const keywords = new Set();

    // Extract from skills
    resumeData.skills?.forEach(skill => keywords.add(skill.toLowerCase()));

    // Extract from summary
    const summaryWords = resumeData.summary?.toLowerCase().match(/\b\w{4,}\b/g) || [];
    summaryWords.forEach(word => keywords.add(word));

    // Extract from experience
    resumeData.experience?.forEach(exp => {
      if (exp.role) keywords.add(exp.role.toLowerCase());
      if (exp.company) keywords.add(exp.company.toLowerCase());
      exp.achievements?.forEach(achievement => {
        const words = achievement.toLowerCase().match(/\b\w{4,}\b/g) || [];
        words.forEach(word => keywords.add(word));
      });
    });

    // Extract from education
    resumeData.education?.forEach(edu => {
      if (edu.degree) keywords.add(edu.degree.toLowerCase());
      if (edu.institution) keywords.add(edu.institution.toLowerCase());
    });

    return Array.from(keywords);
  }

  /**
   * Compare resume with job description
   */
  matchResumeToJob(resumeData, jobDescription) {
    const resumeKeywords = this.extractKeywords(resumeData);
    const jobKeywords = this.extractKeywordsFromText(jobDescription);

    const matchedKeywords = resumeKeywords.filter(keyword => 
      jobKeywords.some(jobKeyword => 
        jobKeyword.includes(keyword) || keyword.includes(jobKeyword)
      )
    );

    const matchPercentage = (matchedKeywords.length / jobKeywords.length) * 100;

    const missingKeywords = jobKeywords.filter(jobKeyword =>
      !resumeKeywords.some(resumeKeyword =>
        jobKeyword.includes(resumeKeyword) || resumeKeyword.includes(jobKeyword)
      )
    );

    return {
      matchPercentage: Math.round(matchPercentage),
      matchedKeywords: matchedKeywords.slice(0, 10),
      missingKeywords: missingKeywords.slice(0, 10),
      totalResumeKeywords: resumeKeywords.length,
      totalJobKeywords: jobKeywords.length
    };
  }

  /**
   * Extract keywords from text
   */
  extractKeywordsFromText(text) {
    // Common stop words to exclude
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const keywords = words.filter(word => !stopWords.has(word));
    
    // Remove duplicates and return
    return [...new Set(keywords)];
  }
}

module.exports = new ATSService();
