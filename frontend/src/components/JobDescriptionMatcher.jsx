import React, { useState } from 'react';
import { aiAPI } from '../services/api';

function resumeToText(resume) {
  if (!resume) return '';
  const lines = [];
  const p = resume.personalInfo || {};
  if (p.fullName) lines.push(p.fullName);
  if (p.email) lines.push(p.email);
  if (resume.summary) lines.push('\nSUMMARY\n' + resume.summary);
  if (resume.skills?.length) {
    lines.push('\nSKILLS\n' + (Array.isArray(resume.skills) ? resume.skills.join(', ') : resume.skills));
  }
  (resume.experience || []).forEach(exp => {
    lines.push(`\n${exp.position || exp.role || exp.title || 'Role'} at ${exp.company || ''}`);
    if (exp.description) lines.push(exp.description);
    if (exp.achievements?.length) lines.push(exp.achievements.join('\n'));
  });
  (resume.education || []).forEach(edu => {
    lines.push(`\n${edu.degree || ''} at ${edu.institution || edu.school || ''}`);
  });
  (resume.projects || []).forEach(proj => {
    if (proj.name) lines.push(`\nProject: ${proj.name}`);
    if (proj.description) lines.push(proj.description);
  });
  return lines.join('\n');
}

const ScoreBadge = ({ score }) => {
  let color = 'bg-red-100 text-red-700';
  let label = 'Low Match';
  if (score >= 75) { color = 'bg-green-100 text-green-700'; label = 'Strong Match'; }
  else if (score >= 50) { color = 'bg-yellow-100 text-yellow-700'; label = 'Moderate Match'; }
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm ${color}`}>
      <span className="text-2xl font-bold">{score}</span>
      <span>/100 — {label}</span>
    </div>
  );
};

const KeywordChip = ({ keyword, type }) => {
  const styles = type === 'matched'
    ? 'bg-green-100 text-green-800 border border-green-200'
    : 'bg-red-100 text-red-800 border border-red-200';
  const icon = type === 'matched' ? '✓' : '✗';
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${styles}`}>
      <span>{icon}</span> {keyword}
    </span>
  );
};

export default function JobDescriptionMatcher({ resume, onChangeResume }) {
  const [jobDescription, setJobDescription] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [tailorResult, setTailorResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) { setError('Please paste a job description first.'); return; }
    setIsAnalyzing(true); setError(null); setMatchResult(null); setTailorResult(null);
    try {
      const resumeText = resumeToText(resume);
      if (!resumeText.trim()) throw new Error('Your resume appears to be empty. Please fill in your resume details first.');
      const resp = await aiAPI.matchJobDescription({ resumeText, jobDescriptionText: jobDescription });
      setMatchResult(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Analysis failed.');
    } finally { setIsAnalyzing(false); }
  };

  const handleAutoTailor = async () => {
    if (!jobDescription.trim()) { setError('Please paste a job description first.'); return; }
    setIsTailoring(true); setError(null); setTailorResult(null); setAppliedSuccess(false);
    try {
      const resp = await aiAPI.autoTailorJob({ resume, jobDescriptionText: jobDescription });
      setTailorResult(resp.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Auto-tailor failed.');
    } finally { setIsTailoring(false); }
  };

  const handleApplyTailored = () => {
    if (!tailorResult || !onChangeResume) return;

    onChangeResume(prev => {
      const next = { ...prev };

      // Apply new summary
      if (tailorResult.summary) next.summary = tailorResult.summary;

      // Apply rewritten bullets to each matched experience entry
      if (tailorResult.experience && Array.isArray(tailorResult.experience)) {
        const updatedExperience = [...(prev.experience || [])];
        tailorResult.experience.forEach(({ index, bullets }) => {
          if (updatedExperience[index]) {
            updatedExperience[index] = {
              ...updatedExperience[index],
              achievements: bullets,
              description: bullets.join('\n')
            };
          }
        });
        next.experience = updatedExperience;
      }
      return next;
    });

    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 3000);
  };

  return (
    <div className="p-4 flex flex-col gap-5 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">🎯 Target Job</h3>
        <p className="text-xs text-slate-500 mt-1">Match your resume to a JD or let AI automatically rewrite it.</p>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Job Description</label>
        <textarea
          value={jobDescription}
          onChange={e => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={7}
          className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white resize-y focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || isTailoring || !jobDescription.trim()}
          className="flex justify-center items-center gap-1.5 py-2.5 rounded-lg font-semibold text-sm bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isAnalyzing ? <><div className="w-3 h-3 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin"/>Analyzing...</> : '🔍 Analyze'}
        </button>
        <button
          onClick={handleAutoTailor}
          disabled={isAnalyzing || isTailoring || !jobDescription.trim()}
          className="flex justify-center items-center gap-1.5 py-2.5 rounded-lg font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isTailoring ? <><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Rewriting...</> : '✨ Auto-Tailor'}
        </button>
      </div>

      {/* Error */}
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* ── Tailor Result ── */}
      {tailorResult && (
        <div className="flex flex-col gap-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-indigo-900">✨ AI-Tailored Content Preview</h4>
            {appliedSuccess ? (
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">✅ Applied!</span>
            ) : (
              <button
                onClick={handleApplyTailored}
                className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all"
              >
                Apply to Resume
              </button>
            )}
          </div>

          {tailorResult.summary && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700 mb-1">Rewritten Summary</p>
              <p className="text-xs text-slate-700 bg-white border border-indigo-100 rounded-lg p-3 leading-relaxed">{tailorResult.summary}</p>
            </div>
          )}

          {tailorResult.experience?.map(({ index, bullets }) => (
            <div key={index}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700 mb-1">
                Experience #{index + 1} — Rewritten Bullets
              </p>
              <ul className="bg-white border border-indigo-100 rounded-lg p-3 space-y-1.5">
                {bullets.map((b, i) => (
                  <li key={i} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                    <span className="text-indigo-400 mt-0.5 shrink-0">•</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* ── Match Result ── */}
      {matchResult && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Match Score</p>
            <ScoreBadge score={matchResult.matchScore} />
            <div className="mt-3 h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${matchResult.matchScore >= 75 ? 'bg-green-500' : matchResult.matchScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${matchResult.matchScore}%` }}
              />
            </div>
          </div>

          {matchResult.matchedKeywords?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">✅ Matched ({matchResult.matchedKeywords.length})</p>
              <div className="flex flex-wrap gap-2">{matchResult.matchedKeywords.map((kw, i) => <KeywordChip key={i} keyword={kw} type="matched" />)}</div>
            </div>
          )}

          {matchResult.missingKeywords?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">❌ Missing ({matchResult.missingKeywords.length})</p>
              <div className="flex flex-wrap gap-2">{matchResult.missingKeywords.map((kw, i) => <KeywordChip key={i} keyword={kw} type="missing" />)}</div>
            </div>
          )}

          {matchResult.topRecommendations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">💡 Recommendations</p>
              <ul className="flex flex-col gap-2">
                {matchResult.topRecommendations.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                    <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
