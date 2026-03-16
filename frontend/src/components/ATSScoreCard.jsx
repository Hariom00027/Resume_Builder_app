import { useState, useEffect } from 'react';
import { atsAPI } from '../services/api';

function getScoreColor(score) {
  if (score >= 80) return '#10b981'; // green
  if (score >= 60) return '#f59e0b'; // yellow
  return '#ef4444'; // red
}

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
}

export function ATSScoreCard({ resumeId, resume }) {
  const [atsData, setAtsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchATSScore = async () => {
    if (!resumeId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await atsAPI.analyze(resumeId);
      setAtsData(response.data);
    } catch (err) {
      console.error('Error fetching ATS score:', err);
      setError(err.response?.data?.error || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if resumeId exists
  useEffect(() => {
    if (resumeId && !atsData) {
      fetchATSScore();
    }
  }, [resumeId]);

  // Calculate score from resume if no ATS data
  const calculateBasicScore = () => {
    if (!resume) return null;
    
    let score = 100;
    const issues = [];
    const suggestions = [];

    // Check required sections
    if (!resume.personalInfo?.fullName) {
      issues.push('Missing full name');
      score -= 10;
    }
    if (!resume.experience || resume.experience.length === 0) {
      issues.push('Missing work experience');
      score -= 15;
    }
    if (!resume.education || resume.education.length === 0) {
      issues.push('Missing education');
      score -= 10;
    }
    if (!resume.skills || resume.skills.length < 5) {
      issues.push('Insufficient skills listed');
      suggestions.push('Add more relevant skills');
      score -= 10;
    }
    if (!resume.summary || resume.summary.trim().length < 50) {
      suggestions.push('Add a professional summary');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      breakdown: {
        keywords: resume.skills?.length >= 10 ? 85 : 60,
        format: 90,
        structure: score > 70 ? 85 : 60,
        content: resume.summary ? 80 : 60
      },
      issues,
      suggestions
    };
  };

  const displayData = atsData || calculateBasicScore();

  if (!displayData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <p>Save your resume to get ATS score</p>
        </div>
      </div>
    );
  }

  const { score, breakdown = {}, issues = [], suggestions = [] } = displayData;
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  // Calculate circumference for circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">ATS Score</h3>
        {resumeId && (
          <button
            onClick={fetchATSScore}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            {loading ? 'Analyzing...' : '🔄 Refresh'}
          </button>
        )}
      </div>

      {/* Score Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={scoreColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="text-xs text-gray-500">{scoreLabel}</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <div className="space-y-3 mb-6">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Score Breakdown</h4>
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between mb-1">
                <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-sm font-medium">{value}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${value}%`,
                    backgroundColor: getScoreColor(value)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issues */}
      {issues.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-sm text-red-700 mb-2">Issues Found</h4>
          <ul className="space-y-1">
            {issues.map((issue, idx) => (
              <li key={idx} className="text-sm text-red-600 flex items-start">
                <span className="mr-2">⚠️</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-blue-700 mb-2">Suggestions</h4>
          <ul className="space-y-1">
            {suggestions.map((suggestion, idx) => (
              <li key={idx} className="text-sm text-gray-600 flex items-start">
                <span className="mr-2">💡</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {issues.length === 0 && suggestions.length === 0 && (
        <div className="text-center text-green-600 text-sm py-4">
          ✅ Your resume looks good! No major issues found.
        </div>
      )}
    </div>
  );
}
