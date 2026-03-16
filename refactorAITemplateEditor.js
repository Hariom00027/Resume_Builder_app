const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/editors/AITemplateEditor.jsx', 'utf8');

// 1. Remove updateTextPreservingStructure (lines 14 to 97 approximately)
const startUpdate = code.indexOf('const updateTextPreservingStructure');
const endUpdate = code.indexOf('export default function AITemplateEditor');
code = code.substring(0, startUpdate) + '\n' + code.substring(endUpdate);

// 2. Remove applyFieldUpdatesToTemplate
const startApply = code.indexOf('  const applyFieldUpdatesToTemplate');
let endApply = code.indexOf('  const updateField = useCallback');
code = code.substring(0, startApply) + '  // applyFieldUpdatesToTemplate removed for AI wall approach\n' + code.substring(endApply);

// 3. Add applying state
code = code.replace('const [hasScanned, setHasScanned] = useState(false);', 'const [hasScanned, setHasScanned] = useState(false);\n  const [applying, setApplying] = useState(false);');

// 4. Update the methods that were calling onChangeResume
code = code.replace(/setTimeout\(\(\) => \{\s*onChangeResume\(prevResume => \{[\s\S]*?\}\);\s*\}, 0\);/g, '');
code = code.replace(/onChangeResume\(prevResume => \{[\s\S]*?\}\);/g, '');

code = code.replace(/const updateField = useCallback[\s\S]*?return updated;\n    \}\);\n  \}, \[.*?\]\);/g, `const updateField = useCallback((sectionSelector, fieldName, value, entryIndex = null) => {
    const key = entryIndex !== null 
      ? \`\${sectionSelector}__\${fieldName}__\${entryIndex}\`
      : \`\${sectionSelector}__\${fieldName}\`;
    
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      if (templateIdRef.current && analysis) {
        scanCache.set(templateIdRef.current, { analysis, formData: updated });
      }
      return updated;
    });
  }, [analysis, template]);`);

code = code.replace(/const deleteEntry = useCallback[\s\S]*?\}\);/g, `const deleteEntry = useCallback((sectionSelector, entryIndex) => {
    const section = analysis.sections.find(s => s.selector === sectionSelector);
    if (!section) return;
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    
    const updatedFormData = { ...formData };
    section.fields?.forEach(field => {
      delete updatedFormData[\`\${sectionSelector}__\${field.name}__\${entryIndex}\`];
    });
    
    section.fields?.forEach(field => {
      for (let i = entryIndex + 1; i < 100; i++) {
        const oldKey = \`\${sectionSelector}__\${field.name}__\${i}\`;
        const newKey = \`\${sectionSelector}__\${field.name}__\${i - 1}\`;
        if (updatedFormData[oldKey] !== undefined) {
          updatedFormData[newKey] = updatedFormData[oldKey];
          delete updatedFormData[oldKey];
        } else {
          break;
        }
      }
    });
    setFormData(updatedFormData);
  }, [analysis, formData, template]);`);

code = code.replace(/const duplicateSection = useCallback[\s\S]*?\}\);/g, `const duplicateSection = useCallback((sectionSelector) => {
    const section = analysis.sections.find(s => s.selector === sectionSelector);
    if (!section) return;
    const isArraySection = section.isArray || section.type === 'experience' || section.type === 'education' || 
                          section.title?.toLowerCase().includes('experience') || 
                          section.title?.toLowerCase().includes('education') ||
                          section.title?.toLowerCase().includes('project') ||
                          section.title?.toLowerCase().includes('certification');
    if (isArraySection) {
      let maxIndex = -1;
      const sectionKeys = Object.keys(formData).filter(key => key.startsWith(\`\${sectionSelector}__\`));
      section.fields?.forEach(field => {
        sectionKeys.forEach(key => {
          if (key.startsWith(\`\${sectionSelector}__\${field.name}__\`)) {
            const indexMatch = key.match(/__(\\d+)$/);
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
          if (formData[\`\${sectionSelector}__\${field.name}\`] !== undefined && formData[\`\${sectionSelector}__\${field.name}\`] !== '') {
            hasNonIndexed = true;
          }
        });
        if (hasNonIndexed) {
          const updatedFormData = { ...formData };
          section.fields?.forEach(field => {
            const oldKey = \`\${sectionSelector}__\${field.name}\`;
            const newKey = \`\${sectionSelector}__\${field.name}__0\`;
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
        const newKey = \`\${sectionSelector}__\${field.name}__\${newIndex}\`;
        if (sourceIndex >= 0) {
          updatedFormData[newKey] = formData[\`\${sectionSelector}__\${field.name}__\${sourceIndex}\`] || '';
        } else {
          updatedFormData[newKey] = '';
        }
      });
      setFormData(updatedFormData);
    } else {
      alert('This section does not support duplication. Use the fields to add multiple items if available.');
    }
  }, [analysis, formData, template]);`);

code = code.replace(/const deleteSection = useCallback[\s\S]*?\}\);/g, `const deleteSection = useCallback((sectionSelector) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    const updatedFormData = { ...formData };
    const section = analysis.sections.find(s => s.selector === sectionSelector);
    section?.fields?.forEach(field => {
      delete updatedFormData[\`\${sectionSelector}__\${field.name}\`];
    });
    setFormData(updatedFormData);
    setAnalysis(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.selector !== sectionSelector)
    }));
  }, [analysis, formData, template]);`);

// Add Apply Changes function
const applyFunc = `  const applyChangesToResume = async () => {
    if (!template?.templateConfig?.html) return;
    setApplying(true);
    try {
      const resp = await aiAPI.injectTemplateData({
        templateHtml: template.templateConfig.html,
        formData
      });
      const updatedHtml = resp.data.html;
      
      // Update resume with new HTML
      onChangeResume(prevResume => {
        let updated = { ...prevResume };
        
        // Update profileImage if present
        const imageFieldKey = Object.keys(formData).find(k => k.includes('profileImage') || k.includes('photo') || k.includes('image'));
        if (imageFieldKey && formData[imageFieldKey]) {
          updated.personalInfo = {
            ...(updated.personalInfo || {}),
            profileImage: formData[imageFieldKey]
          };
        }
        
        updated.templateOverrides = {
          ...(updated.templateOverrides || {}),
          '__fullTemplate__': updatedHtml
        };
        return updated;
      });
      
    } catch (e) {
      console.error('Failed to apply AI formatting', e);
      let errorMessage = 'Failed to apply formatting. ';
      if (e.response?.data?.error?.includes('429') || e.message?.includes('429')) {
        errorMessage = 'OpenAI API Quota Exceeded. Please check your billing details.';
      } else {
        errorMessage += (e.response?.data?.error || e.message || 'Unknown error');
      }
      alert(errorMessage);
    } finally {
      setApplying(false);
    }
  };\n\n`;
code = code.replace('  const updateField', applyFunc + '  const updateField');

// Add the button
const buttonHtml = `    <div className="mt-6 sticky bottom-4 flex justify-end pb-8">
        <button
          onClick={applyChangesToResume}
          disabled={applying}
          className="shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 font-medium text-white px-6 py-3 rounded-full hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          {applying ? '✨ Applying AI Formatting...' : '✨ Apply AI Formatting to Preview'}
        </button>
      </div>\n    </div>`;
code = code.replace(/    <\/div>\s*<\/div>\s*<AccordionSection/g, buttonHtml + '\n  </div>\n  <AccordionSection');
// Replace end
const lastDiv = code.lastIndexOf('</div>');
if (lastDiv > -1) {
  const outerLastDiv = code.lastIndexOf('</div>', lastDiv - 1);
  if (outerLastDiv > -1) {
      code = code.substring(0, outerLastDiv) + buttonHtml + ';\n}\n';
  }
}

fs.writeFileSync('frontend/src/components/editors/AITemplateEditor.jsx', code);
console.log('Done refactoring AITemplateEditor');
