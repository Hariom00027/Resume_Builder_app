import React, { useEffect, useMemo, useState } from 'react';
import { templateAPI } from '../../services/api';
import AccordionSection from './AccordionSection';
import { scanTemplateSections } from '../../utils/templateSectionScanner';
import AITemplateEditor from './AITemplateEditor';

// Bug 3.1 fix: The "Structured" sub-mode that duplicated all sidebar sections has been
// removed. TemplateDrivenEditor now only surfaces the AI Form Editor and, if AI is
// switched off, the raw HTML editor — both of which are template-specific tools.
// All structured content editing (Personal Info, Experience, etc.) lives in the
// dedicated sidebar sections in ResumeBuilder.jsx.

export default function TemplateDrivenEditor({ resume, onChangeResume, aiPreviewMode, focusAiSectionSelector }) {
  const [useAI, setUseAI] = useState(true);
  const [template, setTemplate] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!resume?.templateId) return;
      const resp = await templateAPI.getById(resume.templateId);
      setTemplate(resp.data);
    };
    load().catch((e) => console.error('Failed to load template for editor', e));
  }, [resume?.templateId]);

  const sections = useMemo(() => {
    if (!template?.templateConfig?.html) return [];
    return scanTemplateSections(template.templateConfig.html);
  }, [template]);

  const overrides = (resume && resume.templateOverrides) || {};

  const setOverride = (selector, html) => {
    onChangeResume((prev) => ({
      ...prev,
      templateOverrides: {
        ...(prev.templateOverrides || {}),
        [selector]: html
      }
    }));
  };

  if (!template) {
    return <p className="text-sm text-gray-500">Loading template sections…</p>;
  }

  if (useAI) {
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500"></span>
          <button
            onClick={() => setUseAI(false)}
            className="text-xs text-blue-600 hover:underline"
          >
            Switch to HTML Editor
          </button>
        </div>
        <AITemplateEditor
          resume={resume}
          onChangeResume={onChangeResume}
          aiPreviewMode={aiPreviewMode}
          focusSectionSelector={focusAiSectionSelector}
        />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500">HTML Editor</span>
          <button onClick={() => setUseAI(true)} className="text-xs text-blue-600 hover:underline">
            Switch to AI Form Editor
          </button>
        </div>
        <p className="text-sm text-gray-500">No editable sections detected in this template.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-3">
        <p className="text-xs text-gray-500">
          HTML Editor: {sections.length} section{sections.length !== 1 ? 's' : ''} detected.
        </p>
        <button onClick={() => setUseAI(true)} className="text-xs text-blue-600 hover:underline">
          Switch to AI Form Editor
        </button>
      </div>

      {sections.map((s, idx) => {
        const isOpen = open === s.selector || (open === null && idx === 0);
        const current = overrides[s.selector] ?? s.content ?? '';
        return (
          <AccordionSection
            key={s.selector}
            title={s.title}
            isOpen={isOpen}
            onToggle={() => setOpen(isOpen ? null : s.selector)}
            right={<span className="text-xs text-gray-400">{s.selector}</span>}
          >
            <label className="block text-xs text-gray-500 mb-2">Edit HTML for this section</label>
            <textarea
              className="w-full border rounded px-3 py-2 font-mono text-xs"
              rows={10}
              value={current}
              onChange={(e) => setOverride(s.selector, e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-2">
              Tip: You can paste plain text too; HTML tags are allowed.
            </p>
          </AccordionSection>
        );
      })}
    </div>
  );
}
