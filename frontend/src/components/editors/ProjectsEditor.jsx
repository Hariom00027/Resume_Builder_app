import React from 'react';
import { Field, TextInput, TextArea, SmallButton } from './Field';
import DatePicker from './DatePicker';

// Bug 4.1 fixed: stable `_id` key instead of array index.

function emptyProject() {
  return {
    _id: crypto.randomUUID(),
    name: '',
    description: '',
    technologies: [],
    url: '',
    startDate: '',
    endDate: ''
  };
}

export default function ProjectsEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, emptyProject()]);

  const updateTech = (idx, raw) => {
    const technologies = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    updateItem(idx, { technologies });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SmallButton variant="primary" onClick={addItem}>
          + Add Project
        </SmallButton>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No projects added yet.</p>
      ) : (
        items.map((it, idx) => (
          <div key={it._id || idx} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Project #{idx + 1}</div>
              <SmallButton variant="danger" onClick={() => removeItem(idx)}>
                Remove
              </SmallButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name">
                <TextInput value={it.name || ''} onChange={(e) => updateItem(idx, { name: e.target.value })} />
              </Field>
              <Field label="URL (optional)">
                <TextInput value={it.url || ''} onChange={(e) => updateItem(idx, { url: e.target.value })} />
              </Field>
              <Field label="Start Date (optional)">
                <DatePicker
                  placeholder="DD/MM/YY"
                  value={it.startDate || ''}
                  onChange={(value) => updateItem(idx, { startDate: value })}
                />
              </Field>
              <Field label="End Date (optional)">
                <DatePicker
                  placeholder="DD/MM/YY"
                  value={it.endDate || ''}
                  onChange={(value) => updateItem(idx, { endDate: value })}
                />
              </Field>
            </div>

            <Field label="Technologies (comma-separated)">
              <TextInput
                value={Array.isArray(it.technologies) ? it.technologies.join(', ') : ''}
                onChange={(e) => updateTech(idx, e.target.value)}
                placeholder="React, Node.js, MongoDB"
              />
            </Field>

            <Field label="Description">
              <TextArea rows={3} value={it.description || ''} onChange={(e) => updateItem(idx, { description: e.target.value })} />
            </Field>
          </div>
        ))
      )}
    </div>
  );
}
