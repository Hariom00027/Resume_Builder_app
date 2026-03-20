import React, { useEffect, useState, useCallback, useRef } from 'react';
import { templateAPI, aiAPI } from '../../services/api';
import AccordionSection from './AccordionSection';
import { Field } from './Field';
import DatePicker from './DatePicker';
import AIBulletGeneratorModal from './AIBulletGeneratorModal';
import { applyTemplateOverrides, SECTION_DELETED_SENTINEL } from '../../utils/templateSectionScanner';

// Bugs fixed:
//  2.2 — formData is now pre-filled from existing resume data (personalInfo, summary, etc.)
//         instead of always being initialized to empty strings.
//         formData is also NOT reset when template re-analyzes; only new keys are added.

// Cache to persist scan state across component unmounts.
// IMPORTANT: this is in-memory only; we hard-clear it on full page load.
const scanCache = new Map();

// Start fresh on reload (prevents "old template data" leaking across sessions).
if (typeof window !== 'undefined' && !window.__sxScanCacheCleared) {
  scanCache.clear();
  window.__sxScanCacheCleared = true;
}

/** Unique accordion pane id (multiple schema sections may share the same CSS selector, e.g. `.left`). */
function editorPaneId(section, idx) {
  const t = (section?.title || '').trim();
  return t ? `pane:${t}` : `pane:__${idx}__${(section?.selector || '').replace(/\s/g, '')}`;
}

export default function AITemplateEditor({ resume, onChangeResume, aiPreviewMode = 'print', focusSectionSelector }) {
  const [template, setTemplate] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const sectionRefs = useRef({});
  const lastHandledFocusNonce = useRef(null);
  const [formData, setFormData] = useState({});
  const [hasScanned, setHasScanned] = useState(false);
  const [applying, setApplying] = useState(false);
  const templateIdRef = useRef(null);

  // AI Bullet Generator State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [activeAIField, setActiveAIField] = useState(null); // { sectionSelector, fieldName, entryIndex, currentRole, currentCompany, sectionType, sectionData }

  /**
   * Build a flat map of field-name → value from the structured resume object
   * so AI editor fields can be pre-filled on first load.
   */
  const buildResumeValueMap = (r) => {
    if (!r) return {};
    const p = r.personalInfo || {};
    return {
      fullName: p.fullName || '',
      firstName: p.fullName ? p.fullName.split(' ')[0] : '',
      lastName: p.fullName ? p.fullName.split(' ').slice(1).join(' ') : '',
      name: p.fullName || '',
      email: p.email || '',
      phone: p.phone || '',
      location: p.location || '',
      linkedin: p.linkedin || '',
      portfolio: p.portfolio || '',
      profileImage: p.profileImage || '',
      image: p.profileImage || '',
      photo: p.profileImage || '',
      summary: r.summary || '',
      about: r.summary || '',
      skills: Array.isArray(r.skills) ? r.skills.join(', ') : (r.skills || '')
    };
  };

  const analyzeTemplate = useCallback(async () => {
    if (!template?.templateConfig?.html) return;
    
    setLoading(true);
    setError(null);
    try {
      const resp = await aiAPI.analyzeTemplate({ 
        templateHtml: template.templateConfig.html,
        templateId: template.templateId 
      });
      
      if (!resp.data || !resp.data.sections || !Array.isArray(resp.data.sections)) {
        throw new Error('Invalid response format from AI');
      }
      
      setAnalysis(resp.data);
      
      // Bug 2.2 fix: pre-fill from resume data when available,
      // and MERGE with existing formData instead of overwriting it.
      const resumeValueMap = buildResumeValueMap(resume);

      setFormData(prev => {
        const merged = { ...prev };
        resp.data.sections?.forEach(section => {
          // Check if this is an array section that should be pre-filled from resume arrays
          const st = section.type;
          const title = (section.title || '').toLowerCase();
          const isExp = st === 'experience' || title.includes('experience') || title.includes('work history');
          const isEdu = st === 'education' || title.includes('education') || title.includes('qualification');
          const isProj = st === 'projects' || title.includes('project');
          const isCert = st === 'certifications' || title.includes('certification') || title.includes('training');
          const isAward = st === 'awards' || title.includes('dna') || title.includes('achievement');

          if (isExp || isEdu || isProj || isCert || isAward) {
            const sourceArray = isExp ? (resume.experience || []) :
                               isEdu ? (resume.education || []) :
                               isProj ? (resume.projects || []) :
                               isCert ? (resume.certifications || []) :
                               isAward ? (resume.achievements || []) : [];
            
            if (sourceArray.length > 0) {
              sourceArray.forEach((entry, index) => {
                section.fields?.forEach(field => {
                  const key = `${section.selector}__${field.name}__${index}`;
                  if (!merged[key]) {
                    // Try to map fields correctly
                    let val = entry[field.name];
                    
                    // Fallback mappings for common field name variations
                    if (val === undefined) {
                      if (field.name === 'role' || field.name === 'position' || field.name === 'jobTitle') val = entry.role || entry.position;
                      if (field.name === 'company' || field.name === 'organization') val = entry.company || entry.organization;
                      if (field.name === 'description' || field.name === 'project') val = entry.description || entry.project;
                      if (field.name === 'achievements') val = Array.isArray(entry.achievements) ? entry.achievements.join('\n') : entry.achievements;
                    }

                    merged[key] = val ?? '';
                  }
                });
              });
              return; // Move to next section
            }
          }

          // Fallback to flat fields mapping (Personal Info, Summary, etc.)
          section.fields?.forEach(field => {
            const key = `${section.selector}__${field.name}`;
            // Only set if not already filled by the user
            if (!merged[key]) {
              merged[key] = resumeValueMap[field.name] ?? '';
            }
          });
        });
        
        // Cache the analysis and formData for this template
        if (templateIdRef.current) {
          scanCache.set(templateIdRef.current, {
            analysis: resp.data,
            formData: merged
          });
        }
        
        return merged;
      });
      
      // Open first section by default
      if (resp.data.sections?.length > 0) {
        setOpenSection(null);
      }
      setHasScanned(true);
    } catch (e) {
      console.error('Failed to analyze template', e);
      let errorMessage = 'Failed to analyze template. ';
      const serverOrApiError = e.response?.data?.error || e.message || '';
      
      if (typeof serverOrApiError === 'string' && serverOrApiError.includes('429')) {
         errorMessage = 'OpenAI API Quota Exceeded. Please check your billing details or use a different API key. You can still use the standard Form Editor or HTML Editor.';
      } else if (e.response?.status === 500) {
        const serverError = e.response?.data?.error || e.response?.data?.message || 'Unknown server error';
        if (serverError.includes('429')) {
           errorMessage = 'OpenAI API Quota Exceeded. Please check your billing details or use a different API key. You can still use the standard Form Editor or HTML Editor.';
        } else {
           errorMessage += `Server error: ${serverError}. Please check backend console for details.`;
        }
      } else if (e.response?.data?.error) {
        errorMessage += e.response.data.error;
      } else if (e.message) {
        errorMessage += e.message;
      } else {
        errorMessage += 'Please check your OpenAI API key and try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [template, resume]);

  // Preview click → open matching accordion and scroll the left editor panel.
  useEffect(() => {
    const raw = focusSectionSelector;
    if (raw == null || raw === '') return;
    if (!analysis?.sections?.length) return;

    const req =
      typeof raw === 'object' && raw !== null && !Array.isArray(raw)
        ? raw
        : { title: null, selector: String(raw), nonce: undefined };
    const nonce = req.nonce;
    const norm = (s) => (s || '').toLowerCase().trim();
    const wantedTitle = norm(req.title);
    const wantedSel = (req.selector || '').trim();

    let match = null;
    let matchIdx = -1;
    if (wantedTitle) {
      analysis.sections.forEach((s, i) => {
        if (match) return;
        if (norm(s.title) === wantedTitle) {
          match = s;
          matchIdx = i;
        }
      });
    }
    if (!match && wantedTitle) {
      analysis.sections.forEach((s, i) => {
        if (match) return;
        const st = norm(s.title);
        if (st.includes(wantedTitle) || wantedTitle.includes(st)) {
          match = s;
          matchIdx = i;
        }
      });
    }
    if (!match && wantedSel) {
      const idx = analysis.sections.findIndex((s) => s.selector === wantedSel);
      if (idx >= 0) {
        match = analysis.sections[idx];
        matchIdx = idx;
      }
    }
    if (!match && wantedTitle) {
      const words = wantedTitle
        .replace(/[()]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2);
      analysis.sections.forEach((s, i) => {
        if (match) return;
        const st = norm(s.title);
        const hit =
          (words.length >= 2 && words.every((w) => st.includes(w))) ||
          (words.length === 1 && words[0].length > 5 && st.includes(words[0]));
        if (hit) {
          match = s;
          matchIdx = i;
        }
      });
    }
    if (!match) return;

    if (nonce != null && lastHandledFocusNonce.current === nonce) return;
    if (nonce != null) lastHandledFocusNonce.current = nonce;

    const paneId = editorPaneId(match, matchIdx);
    setOpenSection(paneId);
    setTimeout(() => {
      const el = sectionRefs.current[paneId];
      if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  }, [focusSectionSelector, analysis]);

  useEffect(() => {
    const loadTemplate = async () => {
      if (!resume?.templateId) return;
      
      // Check if we have cached data for this template
      const cachedData = scanCache.get(resume.templateId);
      
      try {
        const resp = await templateAPI.getById(resume.templateId);
        const newTemplate = resp.data;
        setTemplate(newTemplate);
        
        // Only reset scan state if template actually changed
        const templateChanged = templateIdRef.current !== resume.templateId;
        templateIdRef.current = resume.templateId;
        
        const shouldRestoreCachedFormData =
          !!resume?.aiFormData && typeof resume.aiFormData === 'object' && Object.keys(resume.aiFormData).length > 0;

        if (templateChanged) {
          // Restore analysis from cache if available (fast),
          // but only restore formData when this resume actually has aiFormData.
          if (cachedData) {
            setAnalysis(cachedData.analysis);
            setHasScanned(true);
            setOpenSection(null);
            setFormData(shouldRestoreCachedFormData ? cachedData.formData : {});
          } else {
            setHasScanned(false);
            setAnalysis(null);
            setFormData({});
          }
        } else if (cachedData) {
          // Same template: keep analysis cached, but don't leak prior resume's form data into a new resume.
          setAnalysis(cachedData.analysis);
          setHasScanned(true);
          if (shouldRestoreCachedFormData) setFormData(cachedData.formData);
        }
      } catch (e) {
        console.error('Failed to load template', e);
        setError('Failed to load template');
      }
    };
    loadTemplate();
  }, [resume?.templateId, resume?.aiFormData]);

  // Auto-scan on first load when template is ready (only if not already scanned)
  useEffect(() => {
    if (template?.templateConfig?.html && !hasScanned && !loading && !analysis && templateIdRef.current) {
      analyzeTemplate();
    }
  }, [template, hasScanned, loading, analysis, analyzeTemplate]);

  const buildFallbackHTML = (section, data) => {
    if (section.type === 'contact') {
      return `
        <div class="contact">
          ${data.fullName ? `<div class="name">${data.fullName}</div>` : ''}
          ${data.email ? `<div class="email"><a href="mailto:${data.email}">${data.email}</a></div>` : ''}
          ${data.phone ? `<div class="phone"><a href="tel:${data.phone}">${data.phone}</a></div>` : ''}
          ${data.location ? `<div class="location">${data.location}</div>` : ''}
        </div>
      `;
    }
    if (section.type === 'summary') {
      return `<p>${data.summary || ''}</p>`;
    }
    if (section.type === 'skills') {
      const skills = Array.isArray(data.skills) ? data.skills : (data.skills || '').split(',').map(s => s.trim()).filter(Boolean);
      return `<ul>${skills.map(s => `<li>${s}</li>`).join('')}</ul>`;
    }
    return Object.values(data).filter(Boolean).join('<br/>');
  };

  // Debounce ref to avoid overlapping API calls
  const debounceTimerRef = useRef(null);

  const applyChangesToResume = useCallback(async (mode = aiPreviewMode, dataToUse = formData, targetSectionSelector = null) => {
    if (!template?.templateConfig?.html) {
      console.warn('[AITemplateEditor] Cannot apply changes: template HTML not available');
      return;
    }
    
    // Check if there's any data to apply
    const hasData = Object.keys(dataToUse || {}).some(key => {
      const value = dataToUse[key];
      return value !== undefined && value !== null && value.toString().trim() !== '';
    });
    
    if (!hasData) {
      console.warn('[AITemplateEditor] No data to apply');
      return;
    }
    
    setApplying(true);
    try {
      // For live editing, avoid "print" mode (it may strip empty/unchanged sections).
      // Only use "print" when exporting/printing.
      const requestMode = mode === 'print' ? 'print' : 'edit';
      console.log('[AITemplateEditor] Applying changes to resume, mode:', requestMode, 'data keys:', Object.keys(dataToUse).length);
      
      // Separate images from formData to reduce payload size
      // Images will be injected directly, so we don't need to send them to AI
      const imageKeys = Object.keys(dataToUse).filter(key => {
        const value = dataToUse[key];
        return value && typeof value === 'string' && (
          key.toLowerCase().includes('image') || 
          key.toLowerCase().includes('photo') || 
          key.toLowerCase().includes('avatar') ||
          value.startsWith('data:image/')
        );
      });
      
      const formDataWithoutImages = { ...dataToUse };
      const images = {};
      imageKeys.forEach(key => {
        images[key] = formDataWithoutImages[key];
        delete formDataWithoutImages[key];
      });
      
      console.log(`[AITemplateEditor] Separated ${imageKeys.length} image(s) from payload. Sending ${Object.keys(formDataWithoutImages).length} text fields.`);
      
      // Preserve previous edits by applying per-section overrides to the base HTML first.
      const currentOverrides = { ...(resume?.templateOverrides || {}) };
      delete currentOverrides.__fullTemplate__;
      const baseHtml = applyTemplateOverrides(template.templateConfig.html, currentOverrides);

      const resp = await aiAPI.injectTemplateData({
        templateHtml: baseHtml,
        formData: formDataWithoutImages,
        images: images, // Send images separately
        mode: requestMode
      });
      
      if (!resp?.data?.html) {
        throw new Error('Invalid response: missing HTML data');
      }
      
      const updatedHtml = resp.data.html;
      console.log('[AITemplateEditor] Successfully received updated HTML, length:', updatedHtml.length);

      const extractSectionInnerHtml = (fullHtml, selector, fallbackTitle) => {
        if (!selector && !fallbackTitle) return null;
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(fullHtml, 'text/html');
          let el = selector ? doc.querySelector(selector) : null;

          // Fallback for SaarthiX selectors that rely on type-position pseudo selectors
          // and may drift when non-section sibling divs exist.
          if (!el && selector) {
            const nthMatch = selector.match(/^\.right \.section:nth-of-type\((\d+)\)$/);
            if (nthMatch) {
              const idx = Math.max(0, Number(nthMatch[1]) - 1);
              el = doc.querySelectorAll('.right .section')[idx] || null;
            }
            if (!el && /^\.right \.section:first-of-type$/.test(selector)) {
              el = doc.querySelectorAll('.right .section')[0] || null;
            }
            if (!el && /^\.right \.section:last-of-type$/.test(selector)) {
              const all = doc.querySelectorAll('.right .section');
              el = all[all.length - 1] || null;
            }
          }

          // Title-based fallback for robust section extraction from AI output.
          if (!el && fallbackTitle) {
            const norm = String(fallbackTitle).trim().toLowerCase();
            el = Array.from(doc.querySelectorAll('.right .section')).find((sec) => {
              const h = sec.querySelector('h2,h3');
              return h && String(h.textContent || '').trim().toLowerCase() === norm;
            }) || null;
          }

          return el ? (el.innerHTML || '') : null;
        } catch {
          return null;
        }
      };

      // Update resume with per-section overrides ONLY after AI processing completes
      onChangeResume(prevResume => {
        const updated = { ...prevResume };
        
        // Store formData in resume for persistence (but don't trigger template updates)
        updated.aiFormData = dataToUse;
        
        // Update profileImage if present
        const imageFieldKey = Object.keys(dataToUse).find(k => k.includes('profileImage') || k.includes('photo') || k.includes('image'));
        if (imageFieldKey && dataToUse[imageFieldKey]) {
          updated.personalInfo = {
            ...(updated.personalInfo || {}),
            profileImage: dataToUse[imageFieldKey]
          };
        }
        
        // Build a set of selectors that belong to image-only sections.
        // These must never be stored in templateOverrides — images are injected
        // directly by ResumePreview's bindImportedTemplate so they don't get
        // clobbered by applyTemplateOverrides.
        const imageSectionSelectors = new Set(
          (analysis?.sections || [])
            .filter(s => s.type === 'image' || /image|photo|avatar/i.test(s.title || ''))
            .map(s => s.selector)
            .filter(Boolean)
        );

        // Update ONLY the edited section(s). Unchanged sections remain as-is.
        const nextOverrides = { ...(updated.templateOverrides || {}) };
        delete nextOverrides.__fullTemplate__;

        if (targetSectionSelector) {
          // Skip image sections
          if (!imageSectionSelectors.has(targetSectionSelector)) {
            const sec = (analysis?.sections || []).find((s) => s.selector === targetSectionSelector);
            const sectionHtml = extractSectionInnerHtml(updatedHtml, targetSectionSelector, sec?.title);
            if (typeof sectionHtml === 'string') nextOverrides[targetSectionSelector] = sectionHtml;
          }
        } else {
          (analysis?.sections || []).forEach((sec) => {
            const sel = sec?.selector;
            if (!sel || imageSectionSelectors.has(sel)) return; // skip image sections
            const sectionHtml = extractSectionInnerHtml(updatedHtml, sel, sec?.title);
            if (typeof sectionHtml === 'string') nextOverrides[sel] = sectionHtml;
          });
        }

        updated.templateOverrides = nextOverrides;

        console.log('[AITemplateEditor] Resume updated with per-section overrides after AI processing');
        return updated;
      });
      
    } catch (e) {
      console.error('[AITemplateEditor] Failed to apply AI formatting:', e);
      console.error('[AITemplateEditor] Error details:', {
        message: e.message,
        response: e.response?.data,
        status: e.response?.status,
        code: e.code
      });
      
      // Check if it's a network error (backend not running)
      if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error') || e.message?.includes('ERR_CONNECTION_REFUSED')) {
        const errorMessage = 'Cannot connect to backend server. Please ensure the backend is running on port 5027.';
        console.error('[AITemplateEditor] Backend connection error:', errorMessage);
        alert(`Connection Error: ${errorMessage}`);
      } else {
        // Show error to user
        const errorMessage = e.response?.data?.error || e.message || 'Failed to apply changes to template';
        if (mode === 'print' || mode === 'edit') {
          // Show alert for user-facing errors
          alert(`Failed to apply changes: ${errorMessage}`);
        }
      }
    } finally {
      setApplying(false);
    }
  }, [template, aiPreviewMode, onChangeResume, formData]);

  // Sync uploaded data to AI Editor
  useEffect(() => {
    if (resume?.lastUploadDate && analysis?.sections) {
      setFormData(prev => {
        const merged = { ...prev };
        const resumeValueMap = buildResumeValueMap(resume);
        
        analysis.sections.forEach(section => {
          const st = section.type;
          const title = (section.title || '').toLowerCase();
          const isExp = st === 'experience' || title.includes('experience') || title.includes('work history');
          const isEdu = st === 'education' || title.includes('education') || title.includes('qualification');
          const isProj = st === 'projects' || title.includes('project');
          const isCert = st === 'certifications' || title.includes('certification') || title.includes('training');
          const isAward = st === 'awards' || title.includes('dna') || title.includes('achievement');

          if (isExp || isEdu || isProj || isCert || isAward) {
            const sourceArray = isExp ? (resume.experience || []) :
                               isEdu ? (resume.education || []) :
                               isProj ? (resume.projects || []) :
                               isCert ? (resume.certifications || []) :
                               isAward ? (resume.achievements || []) : [];
            
            if (sourceArray.length > 0) {
              sourceArray.forEach((entry, index) => {
                section.fields?.forEach(field => {
                  const key = `${section.selector}__${field.name}__${index}`;
                  let val = entry[field.name];
                  
                  if (val === undefined) {
                    if (field.name === 'role' || field.name === 'position' || field.name === 'jobTitle') val = entry.role || entry.position;
                    if (field.name === 'company' || field.name === 'organization') val = entry.company || entry.organization;
                    if (field.name === 'description' || field.name === 'project') val = entry.description || entry.project;
                    if (field.name === 'achievements') val = Array.isArray(entry.achievements) ? entry.achievements.join('\n') : entry.achievements;
                  }

                  merged[key] = val ?? '';
                });
              });
              return;
            }
          }

          section.fields?.forEach(field => {
            const key = `${section.selector}__${field.name}`;
            merged[key] = resumeValueMap[field.name] ?? '';
          });
        });
        
        // Don't auto-apply - user must click "Apply Section" button
        // Data is stored in formData but not applied to template until user clicks apply

        return merged;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.lastUploadDate]);

  // Don't auto-apply when preview mode changes - user must manually apply sections
  // This prevents data from being applied before sections are complete

  /**
   * Returns true when the value is an image (base64 data URI or field name implies image).
   * Image fields bypass the AI injection pipeline entirely.
   */
  const isImageField = (fieldName, value) =>
    (typeof value === 'string' && value.startsWith('data:image/')) ||
    (fieldName && /image|photo|avatar/i.test(fieldName));

  const updateField = useCallback((sectionSelector, fieldName, value, entryIndex = null) => {
    const key = entryIndex !== null 
      ? `${sectionSelector}__${fieldName}__${entryIndex}`
      : `${sectionSelector}__${fieldName}`;
    
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      if (templateIdRef.current && analysis) {
        scanCache.set(templateIdRef.current, { analysis, formData: updated });
      }
      return updated;
    });

    // ── Image fast-path: bypass AI and apply directly to the preview ──────────
    if (isImageField(fieldName, value)) {
      // Store in personalInfo.profileImage (picked up by ResumePreview's bindImportedTemplate).
      // Do NOT send through AI or store in templateOverrides — ResumePreview handles
      // photo rendering separately so it never conflicts with section overrides.
      onChangeResume(r => ({
        ...r,
        personalInfo: { ...(r.personalInfo || {}), profileImage: value || '' },
      }));
      return true; // signals caller: image was handled, skip checkAndApplySection
    }

    // ── Tagline fast-path: bypass AI to avoid the AI accidentally reformatting
    // the name elements that share the same .header section container. ─────────
    if (fieldName === 'tagline') {
      onChangeResume(r => ({
        ...r,
        aiFormData: { ...(r.aiFormData || {}), [key]: value || '' },
      }));
      return true; // direct injection handled by ResumePreview after overrides
    }

    // ── Key Recognitions fast-path: its section selector is ".left" (the entire
    // left column). Letting AI replace the whole .left innerHTML would clobber
    // the photo, bio, and accomplishments sub-sections. Store in aiFormData and
    // let ResumePreview inject the list items directly. ───────────────────────
    if (fieldName === 'recognitions' && sectionSelector === '.left') {
      onChangeResume(r => ({
        ...r,
        aiFormData: { ...(r.aiFormData || {}), [key]: value || '' },
      }));
      return true;
    }

    // ── SaarthiX Special 2 Contact fast-path ────────────────────────────────
    // SaarthiX Special 2's preview hard-renders `.contact` from
    // `resume.personalInfo`. The AI editor may store contact updates as
    // templateOverrides, but the preview can still miss phone/linkedin/location.
    // Push these fields directly into `resume.personalInfo` so the preview
    // always shows the latest values.
    if (
      resume?.templateId === 'saarthix-special-2' &&
      sectionSelector === '.contact' &&
      ['fullName', 'email', 'phone', 'linkedin', 'location'].includes(fieldName)
    ) {
      onChangeResume(r => ({
        ...r,
        personalInfo: { ...(r.personalInfo || {}), [fieldName]: value || '' },
      }));
      return true;
    }

    // ── Experience fast-path: the AI tends to append user entries on top of
    // the template's default Pied Piper placeholder, producing duplicate blocks.
    // Map form fields directly to resume.experience[entryIndex] and delete any
    // stale AI override so bindImportedTemplate renders cleanly. ─────────────
    const sectionMeta = analysis?.sections?.find(s => s.selector === sectionSelector);
    if (sectionMeta?.type === 'experience') {
      const EXP_FIELDS = ['role', 'company', 'date', 'startDate', 'endDate', 'responsibilities'];
      if (EXP_FIELDS.includes(fieldName)) {
        const idx = entryIndex ?? 0;
        onChangeResume(r => {
          const experience = r.experience ? [...r.experience] : [];
          while (experience.length <= idx) {
            experience.push({ role: '', company: '', startDate: '', endDate: '', current: false, achievements: [], description: '' });
          }
          const entry = { ...experience[idx] };
          if (fieldName === 'role')           entry.role = value || '';
          else if (fieldName === 'company')   entry.company = value || '';
          else if (fieldName === 'startDate') entry.startDate = value || '';
          else if (fieldName === 'endDate')   entry.endDate = value || '';
          else if (fieldName === 'date') {
            const parts = String(value || '').split(/\s*[-–]\s*/);
            entry.startDate = parts[0]?.trim() || '';
            entry.endDate   = parts[1]?.trim() || '';
          }
          else if (fieldName === 'responsibilities') {
            entry.achievements = typeof value === 'string'
              ? value.split('\n').map(s => s.trim()).filter(Boolean)
              : (Array.isArray(value) ? value : []);
          }
          experience[idx] = entry;
          // Remove stale AI override so applyTemplateOverrides won't re-render
          // the old HTML (which contained the duplicate template defaults).
          const nextOverrides = { ...(r.templateOverrides || {}) };
          delete nextOverrides[sectionSelector];
          return { ...r, experience, templateOverrides: nextOverrides };
        });
        return true;
      }
    }

    // ── Skills fast-path: keep Skills preview in sync from form values directly.
    // AI output for this section can be inconsistent; map the two schema fields
    // into resume arrays and clear stale section override so preview uses data.
    if (fieldName === 'technicalSkills' || fieldName === 'nonTechnicalSkills') {
      const toList = (v) =>
        String(v || '')
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean);
      onChangeResume((r) => {
        const nextAi = { ...(r.aiFormData || {}), [key]: value || '' };
        const tech = toList(nextAi[`${sectionSelector}__technicalSkills`]);
        const nonTech = toList(nextAi[`${sectionSelector}__nonTechnicalSkills`]);
        const nextOverrides = { ...(r.templateOverrides || {}) };
        // Remove stale AI section HTML for skills so preview always uses latest data.
        delete nextOverrides[sectionSelector];
        delete nextOverrides['.right .section:nth-of-type(2)'];
        return {
          ...r,
          aiFormData: nextAi,
          skills: tech,
          hobbies: nonTech,
          templateOverrides: nextOverrides,
        };
      });
      return true;
    }

    return false;
  }, [analysis, onChangeResume]);

  const checkAndApplySection = useCallback((sectionSelector, entryIndex = null) => {
    const section = analysis?.sections?.find(s => s.selector === sectionSelector);
    if (!section || !section.fields || section.fields.length === 0) return false;

    // Use setTimeout to ensure we get the latest formData after state update
    setTimeout(() => {
      setFormData(currentFormData => {
        // Consider all fields for the "at least one filled" check
        const fieldsToCheck = section.fields || [];

        // Trigger AI as soon as ANY field in the section/entry has a value.
        // Waiting for ALL fields caused sections like Experience (5+ fields)
        // and Skills (2 fields) to never update while partially filled.
        const anyFieldFilled = fieldsToCheck.some(f => {
           const checkKey = entryIndex !== null ? `${sectionSelector}__${f.name}__${entryIndex}` : `${sectionSelector}__${f.name}`;
           const value = currentFormData[checkKey];
           return value !== undefined && value !== null && value.toString().trim() !== '';
        });
        
        if (anyFieldFilled) {
           if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
           // Debounce to avoid too many API calls
           debounceTimerRef.current = setTimeout(() => {
             console.log(`[AITemplateEditor] Section ${sectionSelector}${entryIndex !== null ? ` entry ${entryIndex}` : ''} is complete. Applying through AI after blur...`);
             applyChangesToResume(aiPreviewMode, currentFormData, sectionSelector);
           }, 300);
        }
        
        return currentFormData; // Return unchanged
      });
    }, 100);
    
    return false; // Always return false since we're handling async
  }, [analysis, aiPreviewMode, applyChangesToResume]);

  const deleteEntry = useCallback((sectionSelector, entryIndex) => {
    const section = analysis.sections.find(s => s.selector === sectionSelector);
    if (!section) return;
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    const updatedFormData = { ...formData };
    section.fields?.forEach(field => {
      delete updatedFormData[`${sectionSelector}__${field.name}__${entryIndex}`];
    });
    
    section.fields?.forEach(field => {
      for (let i = entryIndex + 1; i < 100; i++) {
        const oldKey = `${sectionSelector}__${field.name}__${i}`;
        const newKey = `${sectionSelector}__${field.name}__${i - 1}`;
        if (updatedFormData[oldKey] !== undefined) {
          updatedFormData[newKey] = updatedFormData[oldKey];
          delete updatedFormData[oldKey];
        } else {
          break;
        }
      }
    });
    setFormData(updatedFormData);
    onChangeResume(r => ({ ...r, aiFormData: updatedFormData }));
    
    // Auto-apply the deletion
    applyChangesToResume(aiPreviewMode, updatedFormData, sectionSelector);
  }, [analysis, formData, onChangeResume, aiPreviewMode, applyChangesToResume]);

  const duplicateSection = useCallback((sectionSelector) => {
    const section = analysis.sections.find(s => s.selector === sectionSelector);
    if (!section) return;
    const isArraySection = section.isArray || section.type === 'experience' || section.type === 'education' || 
                          section.title?.toLowerCase().includes('experience') || 
                          section.title?.toLowerCase().includes('education') ||
                          section.title?.toLowerCase().includes('project') ||
                          section.title?.toLowerCase().includes('certification');
    if (isArraySection) {
      let maxIndex = -1;
      const sectionKeys = Object.keys(formData).filter(key => key.startsWith(`${sectionSelector}__`));
      section.fields?.forEach(field => {
        sectionKeys.forEach(key => {
          if (key.startsWith(`${sectionSelector}__${field.name}__`)) {
            const indexMatch = key.match(/__(\d+)$/);
            if (indexMatch) {
              const index = parseInt(indexMatch[1], 10);
              if (index > maxIndex) maxIndex = index;
            }
          }
        });
      });
      if (maxIndex === -1) {
        let hasNonIndexed = false;
        section.fields?.forEach(field => {
          if (formData[`${sectionSelector}__${field.name}`] !== undefined && formData[`${sectionSelector}__${field.name}`] !== '') {
            hasNonIndexed = true;
          }
        });
        if (hasNonIndexed) {
          const updatedFormData = { ...formData };
          section.fields?.forEach(field => {
            const oldKey = `${sectionSelector}__${field.name}`;
            const newKey = `${sectionSelector}__${field.name}__0`;
            if (formData[oldKey] !== undefined) {
              updatedFormData[newKey] = formData[oldKey];
              delete updatedFormData[oldKey];
            }
          });
          setFormData(updatedFormData);
          maxIndex = 0;
        }
      }
      const newIndex = maxIndex + 1;
      const updatedFormData = { ...formData };
      const sourceIndex = maxIndex >= 0 ? maxIndex : -1;
      section.fields?.forEach(field => {
        const newKey = `${sectionSelector}__${field.name}__${newIndex}`;
        if (sourceIndex >= 0) {
          updatedFormData[newKey] = formData[`${sectionSelector}__${field.name}__${sourceIndex}`] || '';
        } else {
          updatedFormData[newKey] = '';
        }
      });
      setFormData(updatedFormData);
      onChangeResume(r => ({ ...r, aiFormData: updatedFormData }));
    } else {
      alert('This section does not support duplication. Use the fields to add multiple items if available.');
    }
  }, [analysis, formData, template]);

  const deleteSection = useCallback((sectionSelector) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;

    const updatedFormData = { ...formData };
    const section = analysis.sections.find(s => s.selector === sectionSelector);

    // Clear all keyed form data for every field of this section (including array entries)
    const prefix = `${sectionSelector}__`;
    Object.keys(updatedFormData).forEach((key) => {
      if (key.startsWith(prefix)) delete updatedFormData[key];
    });
    // Also clear any non-indexed fields explicitly listed in the schema
    section?.fields?.forEach((field) => {
      delete updatedFormData[`${sectionSelector}__${field.name}`];
    });

    setFormData(updatedFormData);

    // Remove the section from the editor accordion
    setAnalysis((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.selector !== sectionSelector),
    }));

    // Mark the section as deleted in templateOverrides so the preview hides it
    onChangeResume((r) => ({
      ...r,
      aiFormData: updatedFormData,
      templateOverrides: {
        ...(r.templateOverrides || {}),
        [sectionSelector]: SECTION_DELETED_SENTINEL,
      },
    }));
  }, [analysis, formData, onChangeResume]);

  const importTemplateDataForSection = useCallback((section) => {
    if (!template?.templateConfig?.html || !section?.selector || !section?.fields?.length) return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(template.templateConfig.html, 'text/html');
      const sectionNodes = Array.from(doc.querySelectorAll(section.selector));
      if (sectionNodes.length === 0) return;

      const stripLabelPrefix = (text) => {
        const t = String(text || '').replace(/\s+/g, ' ').trim();
        // Remove common "Label:" prefixes used in templates
        return t.replace(/^(company name|project|role|key skill used|achievements|college|year|gpa|percentage\s*\/\s*gpa|electives\s*\/\s*subjects|graduation)\s*:\s*/i, '');
      };

      const splitYearRange = (text) => {
        const t = stripLabelPrefix(text);
        const parts = t.split(/[-–]/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) return { start: parts[0], end: parts.slice(1).join(' – ') };
        return { start: t, end: '' };
      };

      // For array sections, we derive entry count from max matched nodes across fields.
      const isArraySection = !!section.isArray || ['experience', 'education', 'projects', 'certifications', 'awards'].includes(section.type);
      const fieldMatches = section.fields.map((f) => {
        const nodes = [];
        for (const secNode of sectionNodes) {
          try {
            nodes.push(...Array.from(secNode.querySelectorAll(f.selector)));
          } catch {
            // ignore invalid selector
          }
        }
        return { field: f, nodes };
      });
      const entryCount = isArraySection
        ? Math.max(1, ...fieldMatches.map(m => m.nodes.length || 0))
        : 1;

      const next = { ...formData };

      for (const { field, nodes } of fieldMatches) {
        for (let i = 0; i < entryCount; i++) {
          const node = nodes[i] || nodes[0];
          const raw = node ? (node.textContent || '') : '';
          if (!raw) continue;

          if (field.type === 'date' || field.name === 'startDate' || field.name === 'endDate') {
            const { start, end } = splitYearRange(raw);
            if (isArraySection) {
              if (start) next[`${section.selector}__startDate__${i}`] = start;
              if (end) next[`${section.selector}__endDate__${i}`] = end;
            } else {
              if (start) next[`${section.selector}__startDate`] = start;
              if (end) next[`${section.selector}__endDate`] = end;
            }
            continue;
          }

          const value = stripLabelPrefix(raw);
          const key = isArraySection
            ? `${section.selector}__${field.name}__${i}`
            : `${section.selector}__${field.name}`;
          next[key] = value;
        }
      }

      setFormData(next);
      if (templateIdRef.current && analysis) {
        scanCache.set(templateIdRef.current, { analysis, formData: next });
      }
    } catch (e) {
      console.error('Failed to import template data for section', section?.selector, e);
    }
  }, [template, formData, analysis]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-500">your template structure is being analysed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => {
            if (templateIdRef.current) {
              scanCache.delete(templateIdRef.current);
            }
            setHasScanned(false);
            setAnalysis(null);
            analyzeTemplate();
          }}
          className="mt-2 text-sm text-red-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!hasScanned || !analysis || !analysis.sections || analysis.sections.length === 0) {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
          <p className="text-sm text-blue-800 mb-3">
            Click the rescan button to analyze the template and detect all editable sections.
          </p>
          <button
            onClick={() => {
              if (templateIdRef.current) {
                scanCache.delete(templateIdRef.current);
              }
              setHasScanned(false);
              setAnalysis(null);
              analyzeTemplate();
            }}
            disabled={loading || !template?.templateConfig?.html}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            🔍 Rescan Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 flex justify-between items-center">
        <p className="text-sm text-blue-800">
          <strong>{analysis.sections.length}</strong> editable sections were detected in this template.
          Fill out the forms below to customize your resume.
        </p>
        <button
          onClick={() => {
            // Clear cache and force rescan
            if (templateIdRef.current) {
              scanCache.delete(templateIdRef.current);
            }
            setHasScanned(false);
            setAnalysis(null);
            analyzeTemplate();
          }}
          disabled={loading}
          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Rescan template"
        >
          🔍 Rescan
        </button>
      </div>

      {analysis.sections.map((section, idx) => {
        const paneId = editorPaneId(section, idx);
        const isOpen = openSection === paneId || (openSection === null && idx === 0);

        return (
          <div key={paneId} ref={(el) => { if (el) sectionRefs.current[paneId] = el; }}>
            <AccordionSection
              title={section.title}
              isOpen={isOpen}
              onToggle={() => setOpenSection(isOpen ? null : paneId)}
              right={
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      importTemplateDataForSection(section);
                    }}
                    className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors"
                    title="Import template sample data into this section"
                  >
                    📥
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateSection(section.selector);
                    }}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    title="Add another entry to this section"
                  >
                    📋
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSection(section.selector);
                    }}
                    className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    title="Delete section"
                  >
                    🗑️
                  </button>
                </div>
              }
            >
            {section.description && (
              <p className="text-xs text-gray-500 mb-3">{section.description}</p>
            )}
            
            <div className="space-y-4">
              {(() => {
                // Check if this section has indexed entries (multiple entries)
                const isArraySection = section.isArray || section.type === 'experience' || section.type === 'education' || 
                                      section.title?.toLowerCase().includes('experience') || 
                                      section.title?.toLowerCase().includes('education') ||
                                      section.title?.toLowerCase().includes('project') ||
                                      section.title?.toLowerCase().includes('certification');
                
                // Find all entry indices ONLY for this specific section
                const entryIndices = new Set();
                if (isArraySection) {
                  // Only check keys that start with this section's selector
                  const sectionKeys = Object.keys(formData).filter(key => key.startsWith(`${section.selector}__`));
                  
                  section.fields?.forEach(field => {
                    sectionKeys.forEach(key => {
                      if (key.startsWith(`${section.selector}__${field.name}__`)) {
                        const indexMatch = key.match(/__(\d+)$/);
                        if (indexMatch) {
                          entryIndices.add(parseInt(indexMatch[1], 10));
                        }
                      }
                    });
                  });
                }
                
                // If no indexed entries, check for non-indexed entry for THIS section only
                const hasNonIndexed = section.fields?.some(field => {
                  const key = `${section.selector}__${field.name}`;
                  return formData[key] !== undefined && formData[key] !== '';
                });
                
                // For array sections, show entries that actually exist
                if (isArraySection) {
                  // Only show entries that have at least one field with data
                  const entriesWithData = new Set();
                  entryIndices.forEach(index => {
                    // Check if this entry has at least one field with data
                    const hasData = section.fields?.some(field => {
                      const key = `${section.selector}__${field.name}__${index}`;
                      return formData[key] !== undefined && formData[key] !== '';
                    });
                    if (hasData || index === 0) { // Always show index 0 if it exists
                      entriesWithData.add(index);
                    }
                  });
                  
                  // If no entries exist at all, pre-open defaults.
                  // For Education: show 3 slots by default (can be deleted by user).
                  // For others: show index 0 only.
                  if (entriesWithData.size === 0 && !hasNonIndexed) {
                    const title = (section.title || '').toLowerCase();
                    const isEducation =
                      section.type === 'education' ||
                      title.includes('education') ||
                      title.includes('qualification');

                    if (isEducation) {
                      entriesWithData.add(0);
                      entriesWithData.add(1);
                      entriesWithData.add(2);
                    } else {
                      entriesWithData.add(0);
                    }
                  }
                  
                  // Render indexed entries
                  const sortedIndices = Array.from(entriesWithData).sort((a, b) => a - b);
                  return sortedIndices.map((entryIndex) => (
                    <div key={entryIndex} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-700">
                          {section.title} #{entryIndex + 1}
                        </h4>
                        <button
                          onClick={() => deleteEntry(section.selector, entryIndex)}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          title="Delete this entry"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          // For experience and education sections, split "dates" or "date" field into startDate and endDate
                          const isExpOrEdu = (section.type === 'experience' || section.type === 'education') || 
                                            (section.title?.toLowerCase().includes('experience') || 
                                             section.title?.toLowerCase().includes('education') ||
                                             section.title?.toLowerCase().includes('work') ||
                                             section.title?.toLowerCase().includes('qualification'));
                          
                          const processedFields = [];
                          
                          section.fields?.forEach((field) => {
                            const fieldNameLower = field.name.toLowerCase();
                            const isDateField = (fieldNameLower === 'dates' || fieldNameLower === 'date') && 
                                               field.type !== 'image' && 
                                               isExpOrEdu;
                            
                            if (isDateField) {
                              // Split into startDate and endDate
                              const dateValue = formData[`${section.selector}__${field.name}__${entryIndex}`] || '';
                              // Try to parse existing combined date (format: "start - end" or "start – end")
                              const dateParts = dateValue.split(/[-–]/).map(d => d.trim());
                              
                              processedFields.push({
                                ...field,
                                name: 'startDate',
                                label: 'Start Date',
                                placeholder: 'DD/MM/YY',
                                type: 'date',
                                originalFieldName: field.name
                              });
                              processedFields.push({
                                ...field,
                                name: 'endDate',
                                label: 'End Date',
                                placeholder: 'DD/MM/YY',
                                type: 'date',
                                originalFieldName: field.name
                              });
                            } else {
                              processedFields.push(field);
                            }
                          });
                          
                          return processedFields;
                        })().map((field) => {
                          const fieldKey = `${section.selector}__${field.name}__${entryIndex}`;
                          // If this is a split date field, get value from original field or from the split field
                          let value = formData[fieldKey] || '';
                          
                          // If startDate/endDate doesn't exist but original date field does, try to parse it
                          if ((field.name === 'startDate' || field.name === 'endDate') && field.originalFieldName) {
                            const originalKey = `${section.selector}__${field.originalFieldName}__${entryIndex}`;
                            const originalValue = formData[originalKey] || '';
                            if (originalValue && !value) {
                              const dateParts = originalValue.split(/[-–]/).map(d => d.trim());
                              if (field.name === 'startDate' && dateParts[0]) {
                                value = dateParts[0];
                              } else if (field.name === 'endDate' && dateParts[1]) {
                                value = dateParts[1];
                              }
                            }
                          }
                          
                          return (
                            <div key={`${field.name}-${entryIndex}`} className="relative">
                              {(field.type === 'textarea' || field.type === 'list') && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const roleKey = `${section.selector}__role__${entryIndex}`;
                                    const titleKey = `${section.selector}__title__${entryIndex}`;
                                    const jobTitleKey = `${section.selector}__jobTitle__${entryIndex}`;
                                    const companyKey = `${section.selector}__company__${entryIndex}`;
                                    const orgKey = `${section.selector}__organization__${entryIndex}`;
                                    
                                    // Determine section type from section metadata
                                    // Use section.type if available, otherwise infer from title
                                    let sectionType = section.type || 'experience';
                                    const sectionTitle = (section.title || '').toLowerCase();
                                    
                                    // Fallback: infer type from title if type is not set or generic
                                    if (!section.type || section.type === 'other') {
                                      if (sectionTitle.includes('summary') || sectionTitle.includes('about') || sectionTitle.includes('profile')) {
                                        sectionType = 'summary';
                                      } else if (sectionTitle.includes('education') || sectionTitle.includes('qualification')) {
                                        sectionType = 'education';
                                      } else if (sectionTitle.includes('project')) {
                                        sectionType = 'projects';
                                      } else if (sectionTitle.includes('certif')) {
                                        sectionType = 'certifications';
                                      } else if (sectionTitle.includes('skill')) {
                                        sectionType = 'skills';
                                      } else if (sectionTitle.includes('achievement') || sectionTitle.includes('award')) {
                                        sectionType = 'achievements';
                                      }
                                    }
                                    
                                    // Build section-specific data from formData
                                    const sectionData = {};
                                    section.fields?.forEach(f => {
                                      const key = `${section.selector}__${f.name}__${entryIndex}`;
                                      if (formData[key] !== undefined) {
                                        sectionData[f.name] = formData[key];
                                      }
                                    });
                                    
                                    setActiveAIField({
                                      sectionSelector: section.selector,
                                      fieldName: field.name,
                                      entryIndex,
                                      currentRole: formData[roleKey] || formData[titleKey] || formData[jobTitleKey] || '',
                                      currentCompany: formData[companyKey] || formData[orgKey] || '',
                                      sectionType: sectionType,
                                      sectionData: sectionData
                                    });
                                    setIsAIModalOpen(true);
                                  }}
                                  className="absolute right-0 top-0 text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 flex items-center gap-1 z-10"
                                  style={{ transform: 'translateY(-2px)' }}
                                >
                                  ✨ AI Writer
                                </button>
                              )}
                              {(field.type === 'date' || field.name === 'startDate' || field.name === 'endDate') ? (
                                <div>
                                  <label className="block text-sm font-medium mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </label>
                                  {field.description && <p className="text-xs text-gray-500 mb-1">{field.description}</p>}
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                      <DatePicker
                                        value={value}
                                        onChange={(v) => {
                                          // If updating a split date field, also clear the original combined field
                                          if (field.originalFieldName) {
                                            const originalKey = `${section.selector}__${field.originalFieldName}__${entryIndex}`;
                                            if (formData[originalKey]) {
                                              updateField(section.selector, field.originalFieldName, '', entryIndex);
                                            }
                                          }
                                          updateField(section.selector, field.name, v, entryIndex);
                                        }}
                                        onBlur={() => {
                                          // Only apply when user clicks outside (blur) and section is complete
                                          checkAndApplySection(section.selector, entryIndex);
                                        }}
                                        placeholder={field.placeholder || 'DD/MM/YY'}
                                      />
                                    </div>

                                    {field.name === 'endDate' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (field.originalFieldName) {
                                            const originalKey = `${section.selector}__${field.originalFieldName}__${entryIndex}`;
                                            if (formData[originalKey]) {
                                              updateField(section.selector, field.originalFieldName, '', entryIndex);
                                            }
                                          }
                                          updateField(section.selector, field.name, 'Present', entryIndex);
                                          checkAndApplySection(section.selector, entryIndex);
                                        }}
                                        className="px-3 py-2 text-xs font-semibold rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                        title="Set End Date to Present"
                                      >
                                        Present
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <Field
                                  label={field.label}
                                  type={field.type}
                                  value={value}
                                  onChange={(v) => {
                                    // If updating a split date field, also clear the original combined field
                                    if (field.originalFieldName) {
                                      const originalKey = `${section.selector}__${field.originalFieldName}__${entryIndex}`;
                                      if (formData[originalKey]) {
                                        updateField(section.selector, field.originalFieldName, '', entryIndex);
                                      }
                                    }
                                    updateField(section.selector, field.name, v, entryIndex);
                                  }}
                                  onBlur={() => {
                                    // Fast-path fields are applied immediately on change; skip AI on blur
                                    if (field.type === 'image' || field.name === 'tagline' || field.name === 'recognitions') return;
                                    // Experience is mapped directly to resume.experience — no AI needed
                                    const secMeta = analysis?.sections?.find(s => s.selector === section.selector);
                                    if (secMeta?.type === 'experience' || secMeta?.type === 'skills') return;
                                    checkAndApplySection(section.selector, entryIndex);
                                  }}
                                  placeholder={field.placeholder}
                                  required={field.required}
                                  description={field.description}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                } else if (hasNonIndexed || !isArraySection) {
                  // Render single non-indexed entry
                  return (
                    <div className="space-y-3">
                      {(() => {
                        // For experience and education sections, split "dates" or "date" field into startDate and endDate
                        const isExpOrEdu = (section.type === 'experience' || section.type === 'education') || 
                                          (section.title?.toLowerCase().includes('experience') || 
                                           section.title?.toLowerCase().includes('education') ||
                                           section.title?.toLowerCase().includes('work') ||
                                           section.title?.toLowerCase().includes('qualification'));
                        
                        const processedFields = [];
                        
                        section.fields?.forEach((field) => {
                          const fieldNameLower = field.name.toLowerCase();
                          const isDateField = (fieldNameLower === 'dates' || fieldNameLower === 'date') && 
                                             field.type !== 'image' && 
                                             isExpOrEdu;
                          
                          if (isDateField) {
                            // Split into startDate and endDate
                            const dateValue = formData[`${section.selector}__${field.name}`] || '';
                            // Try to parse existing combined date (format: "start - end" or "start – end")
                            const dateParts = dateValue.split(/[-–]/).map(d => d.trim());
                            
                            processedFields.push({
                              ...field,
                              name: 'startDate',
                              label: 'Start Date',
                              placeholder: 'DD/MM/YY',
                              type: 'date',
                              originalFieldName: field.name
                            });
                            processedFields.push({
                              ...field,
                              name: 'endDate',
                              label: 'End Date',
                              placeholder: 'DD/MM/YY',
                              type: 'date',
                              originalFieldName: field.name
                            });
                          } else {
                            processedFields.push(field);
                          }
                        });
                        
                        return processedFields;
                      })().map((field) => {
                        const fieldKey = `${section.selector}__${field.name}`;
                        // If this is a split date field, get value from original field or from the split field
                        let value = formData[fieldKey] || '';
                        
                        // If startDate/endDate doesn't exist but original date field does, try to parse it
                        if ((field.name === 'startDate' || field.name === 'endDate') && field.originalFieldName) {
                          const originalKey = `${section.selector}__${field.originalFieldName}`;
                          const originalValue = formData[originalKey] || '';
                          if (originalValue && !value) {
                            const dateParts = originalValue.split(/[-–]/).map(d => d.trim());
                            if (field.name === 'startDate' && dateParts[0]) {
                              value = dateParts[0];
                            } else if (field.name === 'endDate' && dateParts[1]) {
                              value = dateParts[1];
                            }
                          }
                        }
                        
                        return (
                          <div key={field.name} className="relative">
                            {(field.type === 'textarea' || field.type === 'list') && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  // For non-array sections, try to find a role/company if they exist, otherwise pass empty strings
                                  const roleKey = `${section.selector}__role`;
                                  const companyKey = `${section.selector}__company`;
                                  
                                  // Determine section type from section metadata
                                  // Use section.type if available, otherwise infer from title
                                  let sectionType = section.type || 'summary';
                                  const sectionTitle = (section.title || '').toLowerCase();
                                  
                                  // Fallback: infer type from title if type is not set or generic
                                  if (!section.type || section.type === 'other') {
                                    if (sectionTitle.includes('summary') || sectionTitle.includes('about') || sectionTitle.includes('profile')) {
                                      sectionType = 'summary';
                                    } else if (sectionTitle.includes('education') || sectionTitle.includes('qualification')) {
                                      sectionType = 'education';
                                    } else if (sectionTitle.includes('project')) {
                                      sectionType = 'projects';
                                    } else if (sectionTitle.includes('certif')) {
                                      sectionType = 'certifications';
                                    } else if (sectionTitle.includes('skill')) {
                                      sectionType = 'skills';
                                    } else if (sectionTitle.includes('achievement') || sectionTitle.includes('award')) {
                                      sectionType = 'achievements';
                                    } else if (sectionTitle.includes('experience') || sectionTitle.includes('work') || sectionTitle.includes('employment')) {
                                      sectionType = 'experience';
                                    }
                                  }
                                  
                                  // Build section-specific data from formData
                                  const sectionData = {};
                                  section.fields?.forEach(f => {
                                    const key = `${section.selector}__${f.name}`;
                                    if (formData[key] !== undefined) {
                                      sectionData[f.name] = formData[key];
                                    }
                                  });
                                  
                                  setActiveAIField({
                                    sectionSelector: section.selector,
                                    fieldName: field.name,
                                    entryIndex: undefined,
                                    currentRole: formData[roleKey] || '',
                                    currentCompany: formData[companyKey] || '',
                                    sectionType: sectionType,
                                    sectionData: sectionData
                                  });
                                  setIsAIModalOpen(true);
                                }}
                                className="absolute right-0 top-0 text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 flex items-center gap-1 z-10"
                                style={{ transform: 'translateY(-2px)' }}
                              >
                                ✨ AI Writer
                              </button>
                            )}
                            {(field.type === 'date' || field.name === 'startDate' || field.name === 'endDate') ? (
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.description && <p className="text-xs text-gray-500 mb-1">{field.description}</p>}
                                <div className="flex items-center gap-2">
                                  <div className="flex-1">
                                    <DatePicker
                                      value={value}
                                      onChange={(v) => {
                                        // If updating a split date field, also clear the original combined field
                                        if (field.originalFieldName) {
                                          const originalKey = `${section.selector}__${field.originalFieldName}`;
                                          if (formData[originalKey]) {
                                            updateField(section.selector, field.originalFieldName, '');
                                          }
                                        }
                                        updateField(section.selector, field.name, v);
                                      }}
                                      onBlur={() => {
                                        // Only apply when user clicks outside (blur) and section is complete
                                        checkAndApplySection(section.selector, null);
                                      }}
                                      placeholder={field.placeholder || 'DD/MM/YY'}
                                    />
                                  </div>

                                  {field.name === 'endDate' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (field.originalFieldName) {
                                          const originalKey = `${section.selector}__${field.originalFieldName}`;
                                          if (formData[originalKey]) {
                                            updateField(section.selector, field.originalFieldName, '');
                                          }
                                        }
                                        updateField(section.selector, field.name, 'Present');
                                        checkAndApplySection(section.selector, null);
                                      }}
                                      className="px-3 py-2 text-xs font-semibold rounded border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                      title="Set End Date to Present"
                                    >
                                      Present
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <Field
                                label={field.label}
                                type={field.type}
                                value={value}
                                onChange={(v) => {
                                  // If updating a split date field, also clear the original combined field
                                  if (field.originalFieldName) {
                                    const originalKey = `${section.selector}__${field.originalFieldName}`;
                                    if (formData[originalKey]) {
                                      updateField(section.selector, field.originalFieldName, '');
                                    }
                                  }
                                  updateField(section.selector, field.name, v);
                                }}
                                  onBlur={() => {
                                  // Fast-path fields are applied immediately via onChangeResume; skip AI.
                                  if (field.type === 'image' || field.name === 'tagline' || field.name === 'recognitions') return;
                                  const secMeta2 = analysis?.sections?.find(s => s.selector === section.selector);
                                  if (secMeta2?.type === 'experience' || secMeta2?.type === 'skills') return;
                                  checkAndApplySection(section.selector, null);
                                }}
                                placeholder={field.placeholder}
                                required={field.required}
                                description={field.description}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                } else {
                  // This shouldn't happen for array sections (they should have at least index 0)
                  // But if it does, show empty state
                  return (
                    <div className="text-sm text-gray-500 italic">
                      No entries yet. Start filling the fields above.
                    </div>
                  );
                }
              })()}
            </div>
            
            {/* Manual Apply Section Button - Only applies when section is complete */}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {(() => {
                  // Count filled required fields for this section
                  const requiredFields = section.fields?.filter(f => f.required !== false) || section.fields || [];
                  if (section.isArray) {
                    // For array sections, check the first entry (index 0)
                    const filledCount = requiredFields.filter(f => {
                      const key = `${section.selector}__${f.name}__0`;
                      const value = formData[key];
                      return value !== undefined && value !== null && value.toString().trim() !== '';
                    }).length;
                    return `${filledCount}/${requiredFields.length} required fields filled`;
                  } else {
                    const filledCount = requiredFields.filter(f => {
                      const key = `${section.selector}__${f.name}`;
                      const value = formData[key];
                      return value !== undefined && value !== null && value.toString().trim() !== '';
                    }).length;
                    return `${filledCount}/${requiredFields.length} required fields filled`;
                  }
                })()}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Check if section is complete before applying
                  const isComplete = checkAndApplySection(section.selector, section.isArray ? 0 : null);
                  if (!isComplete) {
                    // If not complete, still allow manual apply but warn user
                    if (window.confirm('Section is not complete. Apply anyway? (Data will be processed through AI)')) {
                      console.log(`[AITemplateEditor] Manual apply requested for incomplete section ${section.selector}`);
                      applyChangesToResume(aiPreviewMode, formData, section.selector);
                    }
                  }
                }}
                disabled={applying}
                className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium px-4 py-2 rounded shadow-sm hover:bg-indigo-100 disabled:opacity-50"
              >
                {applying ? 'Applying through AI...' : '✨ Apply Section via AI'}
              </button>
            </div>
            </AccordionSection>
          </div>
        );
      })}
      
      <div className="mt-6 sticky bottom-4 w-full flex justify-end pb-6 pr-3">
        <button
          onClick={() => applyChangesToResume(aiPreviewMode, formData, null)}
          disabled={applying}
          className="bg-indigo-600 text-white text-xs px-3 py-2 rounded-md shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {applying ? 'Refreshing...' : 'Refresh preview'}
        </button>
      </div>

      <AIBulletGeneratorModal 
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          setActiveAIField(null);
        }}
        initialRole={activeAIField?.currentRole || ''}
        initialCompany={activeAIField?.currentCompany || ''}
        sectionType={activeAIField?.sectionType || 'experience'}
        sectionData={activeAIField?.sectionData || {}}
        fieldName={activeAIField?.fieldName || ''}
        onInsert={(bullets) => {
          if (!activeAIField || !bullets || bullets.length === 0) return;
          
          const fieldKey = activeAIField.entryIndex !== undefined 
            ? `${activeAIField.sectionSelector}__${activeAIField.fieldName}__${activeAIField.entryIndex}`
            : `${activeAIField.sectionSelector}__${activeAIField.fieldName}`;
          const currentValue = formData[fieldKey] || '';
          
          // Determine if we need to format as a list or just append to text
          // The AI generates an array of strings. 
          const listText = bullets.join('\n');
          
          // For summary sections, replace content; for others, append
          const sectionType = (activeAIField.sectionType || '').toLowerCase();
          const isSummary = sectionType === 'summary' || sectionType === 'about' || sectionType === 'profile';
          
          const newValue = isSummary ? bullets.join(' ') : (currentValue ? `${currentValue}\n${listText}` : listText);
          updateField(activeAIField.sectionSelector, activeAIField.fieldName, newValue, activeAIField.entryIndex);
        }}
      />
    </div>
  );
}
