import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { resumeAPI, templateAPI, exportAPI } from '../services/api';
import { useAutoSave } from '../hooks/useAutoSave';
import ResumePreview from '../components/ResumePreview';
import { ResumeUpload } from '../components/ResumeUpload';
import { TemplateCustomizer } from '../components/TemplateCustomizer';
import { ATSScoreCard } from '../components/ATSScoreCard';
import PersonalInfoEditor from '../components/editors/PersonalInfoEditor';
import SummaryEditor from '../components/editors/SummaryEditor';
import ExperienceEditor from '../components/editors/ExperienceEditor';
import EducationEditor from '../components/editors/EducationEditor';
import ChipsEditor from '../components/editors/ChipsEditor';
import CertificationsEditor from '../components/editors/CertificationsEditor';
import ProjectsEditor from '../components/editors/ProjectsEditor';
import TemplateDrivenEditor from '../components/editors/TemplateDrivenEditor';
import AtsScoreWidget from '../components/AtsScoreWidget';
import JobDescriptionMatcher from '../components/JobDescriptionMatcher';
import PhraseLibrary from '../components/PhraseLibrary';
import { buildTemplatePreviewSrcDoc } from '../utils/templatePreviewDoc';

// ─── ErrorBoundary (Bug 4.5) ──────────────────────────────────────────────────
class EditorErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('Editor crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <p className="font-semibold text-red-700">⚠️ Editor encountered an error</p>
          <p className="text-sm text-red-600 mt-1">{this.state.error?.message}</p>
          <button
            className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Toast Notification (Bug 1.6 — replaces all alert() calls) ───────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm max-w-xs
            ${t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-700'}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Section definitions ───────────────────────────────────────────────────────
const TOOL_SECTIONS = [
  { id: 'ai-editor',   label: 'Editor' },
  { id: 'customize',   label: '🎨 Customize' },
  { id: 'target-job',  label: '🎯 Target Job' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
function ResumeBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState('ai-editor');
  const [showUpload, setShowUpload] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [aiPreviewMode, setAiPreviewMode] = useState('print'); // 'print' behaves as 'clean/stripped' mode
  const [showPhraseLibrary, setShowPhraseLibrary] = useState(false);
  const [showTemplateSwitch, setShowTemplateSwitch] = useState(false);
  const [allTemplates, setAllTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [focusAiSectionSelector, setFocusAiSectionSelector] = useState(null);
  // Holds the latest rendered HTML from ResumePreview so the PDF export can
  // send the exact same HTML to the backend (including all overrides / deleted sections).
  const latestRenderedHTMLRef = React.useRef('');
  const { toasts, show: showToast } = useToast();

  // ─── Load all templates for the Change Template modal ─────────────────────────
  const openTemplateSwitcher = async () => {
    setShowTemplateSwitch(true);
    setLoadingTemplates(true);
    try {
      const resp = await templateAPI.getAll();
      setAllTemplates(resp.data || []);
    } catch (e) {
      showToast('Failed to load templates.', 'error');
    } finally {
      setLoadingTemplates(false);
    }
  };

  // ─── Switch template while keeping all user data intact ───────────────────────
  const handleTemplateSwitch = (newTemplateId) => {
    if (!newTemplateId || newTemplateId === resume?.templateId) {
      setShowTemplateSwitch(false);
      return;
    }
    setResume(prev => ({
      ...prev,
      templateId: newTemplateId,
      // Clear html overrides so the new template renders fresh,
      // but keep every other data field.
      templateOverrides: {}
    }));
    setShowTemplateSwitch(false);
    showToast('Template changed! Your data is preserved.', 'success');
  };


  useEffect(() => {
    if (id) {
      loadResume();
    } else {
      createNewResume();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.search]);

  const createNewResume = () => {
    const params = new URLSearchParams(location.search);
    const templateFromQuery = params.get('template');
    const templateId = templateFromQuery || 'santiago';

    const newResume = {
      title: 'My Resume',
      templateId,
      personalInfo: { fullName: '', email: '', phone: '', location: '', linkedin: '' },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      projects: [],
      achievements: [],
      hobbies: [],
      languages: [],
      templateOverrides: {}
    };
    setResume(newResume);
    setLoading(false);
  };

  const loadResume = async () => {
    try {
      const response = await resumeAPI.getById(id);
      setResume(response.data);
    } catch (error) {
      console.error('Error loading resume:', error);
      showToast('Failed to load resume.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Bug 2.4 fix: after a save, we merge the server response with our local state
  // instead of blindly replacing it. This preserves templateOverrides.__fullTemplate__
  // that the server may have stripped or truncated.
  const handleSave = useCallback(async (resumeToSave = resume) => {
    if (!resumeToSave) return;

    // Strip base64 image strings from aiFormData before sending to the backend.
    // They balloon the HTTP payload (a 5 MB image → ~6.7 MB base64) and can push
    // the MongoDB document past its 16 MB limit.  The actual image is already
    // persisted in personalInfo.profileImage, so nothing is lost.
    // aiFormData itself is NOT in the Mongoose schema and is never saved to the DB.
    const sanitizeForSave = (r) => {
      if (!r) return r;
      const { aiFormData, ...rest } = r;
      if (!aiFormData || typeof aiFormData !== 'object') return r;
      const cleanAiFormData = Object.fromEntries(
        Object.entries(aiFormData).filter(
          ([, v]) => !(typeof v === 'string' && v.startsWith('data:image/'))
        )
      );
      return { ...rest, aiFormData: cleanAiFormData };
    };

    const payload = sanitizeForSave(resumeToSave);

    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      if (id) {
        const response = await resumeAPI.update(id, payload);
        if (response.data) {
          // Merge: prefer local templateOverrides to avoid losing AI editor HTML
          setResume(prev => ({
            ...response.data,
            templateOverrides: {
              ...(response.data.templateOverrides || {}),
              ...(prev?.templateOverrides || {})
            }
          }));
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
          return response.data;
        }
      } else {
        // Bug 4.8: new resume — create on first explicit save
        const response = await resumeAPI.create(payload);
        if (response.data && response.data._id) {
          navigate(`/builder/${response.data._id}`, { replace: true });
          setResume(prev => ({
            ...response.data,
            templateOverrides: {
              ...(response.data.templateOverrides || {}),
              ...(prev?.templateOverrides || {})
            }
          }));
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus('idle'), 2000);
          return response.data;
        } else {
          throw new Error('Invalid response from server');
        }
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      setAutoSaveStatus('idle');
      showToast(`Save failed: ${error.response?.data?.error || error.message}`, 'error');
      throw error;
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  // Auto-save hook
  useAutoSave(resume, handleSave, 30000, autoSaveEnabled);

  const handleUploadComplete = (parsedData) => {
    const updatedResume = {
      ...resume,
      lastUploadDate: Date.now(), // Trigger AI Editor sync
      personalInfo: { ...resume.personalInfo, ...parsedData.personalInfo },
      summary: parsedData.summary || resume.summary,
      experience: parsedData.experience?.length > 0 ? parsedData.experience : resume.experience,
      education: parsedData.education?.length > 0 ? parsedData.education : resume.education,
      skills: parsedData.skills?.length > 0 ? parsedData.skills : resume.skills,
      projects: parsedData.projects?.length > 0 ? parsedData.projects : resume.projects,
      certifications: parsedData.certifications?.length > 0 ? parsedData.certifications : resume.certifications,
      languages: parsedData.languages?.length > 0 ? parsedData.languages : resume.languages
    };
    setResume(updatedResume);
    setShowUpload(false);
    showToast('Resume uploaded and parsed successfully!', 'success');
  };

  const handleDuplicate = async () => {
    if (!id) {
      showToast('Please save the resume first.', 'error');
      return;
    }
    try {
      const response = await resumeAPI.duplicate(id);
      if (response.data && response.data._id) {
        navigate(`/builder/${response.data._id}`);
        showToast('Resume duplicated!', 'success');
      }
    } catch (error) {
      showToast(`Duplicate failed: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

  const handleExportPDF = async () => {
    if (!id) { showToast('Please save the resume first.', 'error'); return; }
    try {
      // Pass the pre-rendered HTML (already has overrides + deleted sections applied)
      // so the backend doesn't need to re-render and the PDF matches the preview exactly.
      const preRenderedHtml = latestRenderedHTMLRef.current || '';
      const response = await exportAPI.pdf(id, preRenderedHtml);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resume.title || 'resume'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast(`PDF export failed: ${error.response?.data?.error || error.message}`, 'error');
    }
  };


  const handleChange = (field, value) => {
    setResume(prev => ({ ...prev, [field]: value }));
  };

  const setNested = (path, value) => {
    setResume((prev) => {
      const next = { ...prev };
      if (path === 'personalInfo') next.personalInfo = value;
      else if (path === 'summary') next.summary = value;
      else next[path] = value;
      return next;
    });
  };

  const updateResume = (updater) => {
    setResume((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  };

  // Build a flat representation of the resume for ATS analysis
  // IMPORTANT: Must live BEFORE any early returns to satisfy Rules of Hooks
  const resumeFormData = React.useMemo(() => {
    if (!resume) return {};
    const flat = {
      ...resume.personalInfo,
      summary: resume.summary || '',
      skills: Array.isArray(resume.skills) ? resume.skills.join(', ') : (resume.skills || '')
    };
    (resume.experience || []).forEach((exp, i) => {
      flat[`experience__company__${i}`] = exp.company || '';
      flat[`experience__role__${i}`] = exp.position || exp.role || exp.title || '';
      flat[`experience__description__${i}`] = exp.description || exp.achievements?.join(' ') || '';
    });
    (resume.education || []).forEach((edu, i) => {
      flat[`education__institution__${i}`] = edu.institution || edu.school || '';
      flat[`education__degree__${i}`] = edu.degree || '';
    });

    // If the user is editing via the AI template editor, the up-to-date content
    // lives in `resume.aiFormData`. Merge it in so ATS scoring reflects what the
    // user is actually editing (instead of staying stuck at a low score).
    if (resume.aiFormData && typeof resume.aiFormData === 'object') {
      Object.assign(flat, resume.aiFormData);
    }

    return flat;
  }, [resume]);

  // ─── Loading / Error States (Bug 1.5) ──────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4" />
          <p className="text-gray-600 font-medium">Loading your resume…</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-xl shadow p-8">
          <p className="text-2xl mb-2">😕</p>
          <p className="font-semibold text-gray-800 mb-1">Could not load resume</p>
          <p className="text-sm text-gray-500 mb-4">The resume may have been deleted or an error occurred.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Section button helper ──────────────────────────────────────────────────
  const SectionBtn = ({ id: sId, label }) => (
    <button
      onClick={() => setOpenSection(openSection === sId ? null : sId)}
      className={`text-left px-3 py-2 rounded text-sm transition-colors
        ${openSection === sId
          ? 'bg-blue-600 text-white'
          : 'bg-white hover:bg-gray-100 border text-gray-700'}`}
    >
      {label}
    </button>
  );

  // ─── Active editor panel ────────────────────────────────────────────────────
  const renderEditor = () => {
    switch (openSection) {
      case 'title':
        return (
          <div>
            <label className="block text-sm font-medium mb-1">Resume Title</label>
            <input
              type="text"
              value={resume.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        );
      case 'personal':
        return <PersonalInfoEditor value={resume.personalInfo} onChange={(v) => setNested('personalInfo', v)} />;
      case 'summary':
        return <SummaryEditor value={resume.summary} onChange={(v) => setNested('summary', v)} />;
      case 'experience':
        return <ExperienceEditor value={resume.experience} onChange={(v) => setNested('experience', v)} />;
      case 'education':
        return <EducationEditor value={resume.education} onChange={(v) => setNested('education', v)} />;
      case 'skills':
        return <ChipsEditor value={resume.skills} onChange={(v) => setNested('skills', v)} placeholder="e.g., React" />;
      case 'projects':
        return <ProjectsEditor value={resume.projects} onChange={(v) => setNested('projects', v)} />;
      case 'certifications':
        // Bug 4.4 fixed — CertificationsEditor is now actually rendered
        return <CertificationsEditor value={resume.certifications} onChange={(v) => setNested('certifications', v)} />;
      case 'achievements':
        return <ChipsEditor value={resume.achievements} onChange={(v) => setNested('achievements', v)} placeholder="e.g., Won Hackathon 2023" />;
      case 'hobbies':
        return <ChipsEditor value={resume.hobbies} onChange={(v) => setNested('hobbies', v)} placeholder="e.g., Photography" />;
      case 'languages':
        return <ChipsEditor value={resume.languages} onChange={(v) => setNested('languages', v)} placeholder="e.g., English, Spanish" />;
      // Bug 3.1 fixed — AI Editor no longer embeds the "Structured" sub-mode that
      // duplicated all content sections. It now renders only the AI form editor.
      case 'ai-editor':
        return (
          <TemplateDrivenEditor
            resume={resume}
            onChangeResume={updateResume}
            aiPreviewMode={aiPreviewMode}
            focusAiSectionSelector={focusAiSectionSelector}
          />
        );
      case 'customize':
        return <TemplateCustomizer resume={resume} onChange={updateResume} />;
      case 'target-job':
        return <JobDescriptionMatcher resume={resume} onChangeResume={updateResume} />;
      default:
        return (
          <div className="text-center text-gray-400 py-12">
            <p className="text-4xl mb-3">←</p>
            <p className="text-sm">Select a section from the menu to start editing</p>
          </div>
        );
    }
  };


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      {/* ── Top Bar ── */}
      <div className="flex justify-between items-center px-4 py-3 border-b bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">Resume Builder</h1>
          {/* Auto-save toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSaveEnabled}
              onChange={(e) => setAutoSaveEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto-save</span>
          </label>
          {/* Bug 4.8: show unsaved badge when no id (new resume not yet persisted) */}
          {!id && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-300">
              ⚠️ Unsaved
            </span>
          )}
          {autoSaveEnabled && autoSaveStatus === 'saving' && (
            <span className="text-sm text-gray-500">💾 Auto-saving…</span>
          )}
          {autoSaveEnabled && autoSaveStatus === 'saved' && (
            <span className="text-sm text-green-600">✅ Saved</span>
          )}
          {/* Real-time ATS Score Widget */}
          <AtsScoreWidget resumeData={resumeFormData} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {saving ? 'Saving…' : '💾 Save'}
          </button>
          {id && (
            <>
              <button onClick={handleDuplicate} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-sm" title="Duplicate Resume">
                📋 Duplicate
              </button>
              <button onClick={handleExportPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm" title="Export as PDF">
                📄 PDF
              </button>
            </>
          )}
          <button onClick={() => setShowUpload(!showUpload)} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm" title="Upload Resume">
            📤 Upload
          </button>
          <button onClick={() => navigate('/')} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm">
            ← Back
          </button>
          <button onClick={openTemplateSwitcher} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm">
            🔄 Change Template
          </button>
        </div>
      </div>

      {/* Phrase Library Drawer */}
      {showPhraseLibrary && (
        <PhraseLibrary 
          onClose={() => setShowPhraseLibrary(false)} 
          onInsertPhrase={(phrase) => {
            showToast(`Copied! Past it into any field.`, 'success');
          }}
        />
      )}

      {/* ── Main Layout ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4" style={{ minHeight: 0, overflow: 'hidden' }}>
        
        {/* ── Left Sidebar ── */}
        <div className="lg:col-span-1 flex flex-col bg-white rounded-lg shadow" style={{ minHeight: 0, overflow: 'hidden' }}>
          <div className="px-4 py-3 border-b flex-shrink-0">
            <h2 className="text-base font-semibold text-gray-800">Edit Resume</h2>
          </div>

          {/* Bug 1.1 + 1.4 fixed: sections menu is now scrollable and grouped with separators */}
          <div className="flex-shrink-0 border-b" style={{ maxHeight: '45%', overflowY: 'auto' }}>
            <div className="p-3 space-y-1">
              {/* ─ Title inline ─ */}
              <button
                onClick={() => setOpenSection(openSection === 'title' ? null : 'title')}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors
                  ${openSection === 'title' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100 border text-gray-700'}`}
              >
                📝 Title
              </button>

              {/* Tools group */}
              <div className="pt-2 border-t mt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">Tools</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {TOOL_SECTIONS.map(s => <SectionBtn key={s.id} id={s.id} label={s.label} />)}
                  <button
                    onClick={() => setShowPhraseLibrary(true)}
                    className="px-3 py-2 rounded text-sm transition-colors bg-white hover:bg-gray-100 border text-gray-700 flex items-center gap-2"
                  >
                    📚 Phrases
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Editor Content — Bug 1.2: smooth transition via key change */}
          <div key={openSection} className="flex-1 overflow-y-auto p-4">
            <EditorErrorBoundary>
              {renderEditor()}
            </EditorErrorBoundary>
          </div>
        </div>

        {/* ── Upload Modal ── */}
        {showUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="max-w-4xl w-full mx-4">
              <ResumeUpload
                onUploadComplete={handleUploadComplete}
                onCancel={() => setShowUpload(false)}
              />
            </div>
          </div>
        )}

        {/* ── Change Template Modal ── */}
        {showTemplateSwitch && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={() => setShowTemplateSwitch(false)}>
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col"
              style={{ maxHeight: '85vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">🔄 Change Template</h2>
                  <p className="text-xs text-gray-500 mt-0.5">All your resume data will be preserved. Only the layout changes.</p>
                </div>
                <button onClick={() => setShowTemplateSwitch(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto p-6 flex-1">
                {loadingTemplates ? (
                  <p className="text-center text-gray-400 py-12">Loading templates…</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {allTemplates.map(t => {
                      const isCurrent = t.templateId === resume?.templateId;
                      return (
                        <button
                          key={t.templateId}
                          onClick={() => handleTemplateSwitch(t.templateId)}
                          className={`group relative rounded-lg border-2 p-3 text-left transition-all ${
                            isCurrent
                              ? 'border-blue-500 bg-blue-50'
                              : (t.category === 'saarthix-specials'
                                  ? 'border-orange-400 hover:border-orange-300 hover:shadow-md'
                                  : 'border-gray-200 hover:border-purple-400 hover:shadow-md')
                          }`}
                          style={(!isCurrent && t.category === 'saarthix-specials')
                            ? { boxShadow: '0 0 0 2px rgba(251,146,60,0.25), 0 10px 25px -14px rgba(249,115,22,0.55)' }
                            : undefined}
                        >
                          {/* Live HTML preview (same style as Templates page) */}
                          <div className="bg-gray-50 w-full aspect-[3/4] rounded mb-2 border overflow-hidden">
                            {t.templateConfig?.html ? (
                              <iframe
                                title={`${t.name} preview`}
                                srcDoc={buildTemplatePreviewSrcDoc(t.templateConfig.html)}
                                className="w-full h-full border-0 pointer-events-none"
                                style={{
                                  transform: 'scale(0.42)',
                                  transformOrigin: 'top left',
                                  width: '238%',
                                  height: '238%',
                                }}
                                sandbox="allow-same-origin allow-scripts"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                                📄
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-gray-700 truncate">{t.name}</p>
                          {t.category && (
                            <p className="text-[10px] text-gray-400 capitalize mt-0.5">{t.category.replace(/-/g, ' ')}</p>
                          )}
                          {isCurrent && (
                            <span className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">Current</span>
                          )}
                          {t.isPremium && !isCurrent && (
                            <span className="absolute top-2 right-2 bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">★ Pro</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t bg-gray-50 rounded-b-xl text-right">
                <button
                  onClick={() => setShowTemplateSwitch(false)}
                  className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded border"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Right: Preview ── */}
        <div className="lg:col-span-2 flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>
          <ResumePreview
            resume={resume}
            aiPreviewMode={aiPreviewMode}
            setAiPreviewMode={setAiPreviewMode}
            onRenderedHTMLChange={(html) => { latestRenderedHTMLRef.current = html; }}
            onSectionClick={(info) => {
              setOpenSection('ai-editor');
              setFocusAiSectionSelector({
                title: info?.title || null,
                selector: info?.selector || null,
                nonce: Date.now(),
              });
            }}
          />
        </div>
      </div>

      {/* Toast notifications (Bug 1.6) */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default ResumeBuilder;
