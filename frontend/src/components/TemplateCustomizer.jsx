import { useState, useEffect } from 'react';

const FONT_OPTIONS = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Calibri, sans-serif', label: 'Calibri' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: 'Courier New, monospace', label: 'Courier New' }
];

const FONT_SIZE_OPTIONS = [
  { value: '12px', label: 'Small (12px)' },
  { value: '14px', label: 'Medium (14px)' },
  { value: '16px', label: 'Large (16px)' },
  { value: '18px', label: 'Extra Large (18px)' }
];

export function TemplateCustomizer({ resume, onChange }) {
  const [customization, setCustomization] = useState(
    resume?.customization || {
      colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#0066cc',
        text: '#000000'
      },
      typography: {
        fontSize: '14px',
        fontSpacing: '1.5',
        sectionSpacing: '20px',
        fontFamilyTitle: 'Arial, sans-serif',
        fontFamilyText: 'Arial, sans-serif',
        fontFamilySubheading: 'Arial, sans-serif'
      }
    }
  );

  useEffect(() => {
    if (resume?.customization) {
      setCustomization({
        colors: {
          primary: resume.customization.colors?.primary || '#000000',
          secondary: resume.customization.colors?.secondary || '#666666',
          accent: resume.customization.colors?.accent || '#0066cc',
          text: resume.customization.colors?.text || '#000000'
        },
        typography: {
          fontSize: resume.customization.typography?.fontSize || '14px',
          fontSpacing: resume.customization.typography?.fontSpacing || '1.5',
          sectionSpacing: resume.customization.typography?.sectionSpacing || '20px',
          fontFamilyTitle: resume.customization.typography?.fontFamilyTitle || 'Arial, sans-serif',
          fontFamilyText: resume.customization.typography?.fontFamilyText || 'Arial, sans-serif',
          fontFamilySubheading: resume.customization.typography?.fontFamilySubheading || 'Arial, sans-serif'
        }
      });
    }
  }, [resume]);

  const updateCustomization = (section, field, value) => {
    const newCustomization = {
      ...customization,
      [section]: {
        ...customization[section],
        [field]: value
      }
    };
    setCustomization(newCustomization);
    onChange({ ...resume, customization: newCustomization });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Colors</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customization.colors?.primary || '#000000'}
                onChange={(e) => updateCustomization('colors', 'primary', e.target.value)}
                className="w-16 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={customization.colors?.primary || '#000000'}
                onChange={(e) => updateCustomization('colors', 'primary', e.target.value)}
                className="flex-1 border rounded px-3 py-2 font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Secondary Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customization.colors?.secondary || '#666666'}
                onChange={(e) => updateCustomization('colors', 'secondary', e.target.value)}
                className="w-16 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={customization.colors?.secondary || '#666666'}
                onChange={(e) => updateCustomization('colors', 'secondary', e.target.value)}
                className="flex-1 border rounded px-3 py-2 font-mono text-sm"
                placeholder="#666666"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customization.colors?.accent || '#0066cc'}
                onChange={(e) => updateCustomization('colors', 'accent', e.target.value)}
                className="w-16 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={customization.colors?.accent || '#0066cc'}
                onChange={(e) => updateCustomization('colors', 'accent', e.target.value)}
                className="flex-1 border rounded px-3 py-2 font-mono text-sm"
                placeholder="#0066cc"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Typography</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title Font</label>
            <select
              value={customization.typography?.fontFamilyTitle || 'Arial, sans-serif'}
              onChange={(e) => updateCustomization('typography', 'fontFamilyTitle', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {FONT_OPTIONS.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Body Font</label>
            <select
              value={customization.typography?.fontFamilyText || 'Arial, sans-serif'}
              onChange={(e) => updateCustomization('typography', 'fontFamilyText', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {FONT_OPTIONS.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Font Size</label>
            <select
              value={customization.typography?.fontSize || '14px'}
              onChange={(e) => updateCustomization('typography', 'fontSize', e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {FONT_SIZE_OPTIONS.map(size => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Line Spacing: {customization.typography?.fontSpacing || '1.5'}
            </label>
            <input
              type="range"
              min="1"
              max="2"
              step="0.1"
              value={customization.typography?.fontSpacing || '1.5'}
              onChange={(e) => updateCustomization('typography', 'fontSpacing', e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Section Spacing: {customization.typography?.sectionSpacing || '20px'}
            </label>
            <input
              type="range"
              min="10"
              max="40"
              step="5"
              value={parseInt(customization.typography?.sectionSpacing || '20px')}
              onChange={(e) => updateCustomization('typography', 'sectionSpacing', `${e.target.value}px`)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={() => {
            const defaultCustomization = {
              colors: {
                primary: '#000000',
                secondary: '#666666',
                accent: '#0066cc',
                text: '#000000'
              },
              typography: {
                fontSize: '14px',
                fontSpacing: '1.5',
                sectionSpacing: '20px',
                fontFamilyTitle: 'Arial, sans-serif',
                fontFamilyText: 'Arial, sans-serif',
                fontFamilySubheading: 'Arial, sans-serif'
              }
            };
            setCustomization(defaultCustomization);
            onChange({ ...resume, customization: defaultCustomization });
          }}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
