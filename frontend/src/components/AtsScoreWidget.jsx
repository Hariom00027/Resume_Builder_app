import React, { useState, useEffect, useRef } from 'react';
import { atsScoringAPI } from '../services/api';

export default function AtsScoreWidget({ resumeData }) {
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const debounceTimerRef = useRef(null);
  const lastAnalyzedHashRef = useRef('');

  // Simple hashing function to avoid re-analyzing the exact same text
  const hashData = (data) => {
    try {
      return JSON.stringify(data);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (!resumeData || Object.keys(resumeData).length === 0) return;

    const currentHash = hashData(resumeData);
    if (currentHash === lastAnalyzedHashRef.current) return;

    // Debounce the API call to avoid hitting the backend on every single keystroke
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setLoading(true);
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await atsScoringAPI.analyze(resumeData);
        if (response.data) {
          setScore(response.data.score);
          setFeedback(response.data.feedback || []);
          lastAnalyzedHashRef.current = currentHash;
        }
      } catch (error) {
        console.error("Error analyzing ATS score:", error);
      } finally {
        setLoading(false);
      }
    }, 1500); // Wait 1.5 seconds after typing stops

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [resumeData]);

  // Determine colors based on score
  let ringColor = 'text-red-500';
  let bgColor = 'bg-red-50';
  let emptyColor = 'text-red-100';
  
  if (score >= 80) {
    ringColor = 'text-green-500';
    bgColor = 'bg-green-50';
    emptyColor = 'text-green-100';
  } else if (score >= 60) {
    ringColor = 'text-yellow-500';
    bgColor = 'bg-yellow-50';
    emptyColor = 'text-yellow-100';
  }

  // Calculate SVG circle properties for the ring
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = score !== null ? circumference - (score / 100) * circumference : circumference;

  return (
    <div 
      className="relative flex items-center h-full ml-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-help transition-colors ${bgColor}`}>
        
        {/* Progress Ring */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
             <circle
               cx="20"
               cy="20"
               r={radius}
               fill="transparent"
               stroke="currentColor"
               strokeWidth="4"
               className={emptyColor}
             />
             {/* Foreground progress circle */}
             <circle
               cx="20"
               cy="20"
               r={radius}
               fill="transparent"
               stroke="currentColor"
               strokeWidth="4"
               strokeDasharray={circumference}
               strokeDashoffset={dashoffset}
               strokeLinecap="round"
               className={`${ringColor} transition-all duration-1000 ease-out`}
             />
          </svg>
          
          {/* Score Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            {loading && score === null ? (
               <div className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            ) : (
              <span className="text-xs font-bold text-slate-700">
                {score !== null ? score : '-'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-700 leading-tight">ATS Score</span>
          <span className="text-[10px] text-slate-500 leading-tight">
            {score >= 80 ? 'Excellent' : score >= 60 ? 'Needs Work' : 'Incomplete'}
          </span>
        </div>
      </div>

      {/* Popover / Tooltip */}
      {isHovered && feedback && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 shadow-xl rounded-xl z-50 p-4 transform origin-top-right transition-all">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-semibold text-slate-800">Score Feedback</h4>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${bgColor} ${ringColor.replace('text-', 'text-')}`}>
              {score}/100
            </span>
          </div>
          
          {loading && (
            <p className="text-xs text-indigo-500 font-medium mb-3 italic">Analyzing changes...</p>
          )}

          {feedback.length === 0 ? (
            <div className="text-sm text-green-600 bg-green-50 p-2 rounded flex items-start gap-2">
               <span>✅</span> Looks perfect! Your resume follows ATS best practices.
            </div>
          ) : (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {feedback.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-amber-500 mt-0.5">💡</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
