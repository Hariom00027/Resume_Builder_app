import React from 'react';
import { Field, TextInput, TextArea, SmallButton } from './Field';
import DatePicker from './DatePicker';

// Bug 4.1 fixed: stable `_id` key instead of array index.

function emptyEducation() {
  return {
    _id: crypto.randomUUID(),
    degree: '',
    institution: '',
    startDate: '',
    endDate: '',
    gpa: '',
    honors: '',
    description: ''
  };
}

export default function EducationEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];

  const updateItem = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, emptyEducation()]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SmallButton variant="primary" onClick={addItem}>
          + Add Education
        </SmallButton>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No education added yet.</p>
      ) : (
        items.map((it, idx) => (
          <div key={it._id || idx} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Education #{idx + 1}</div>
              <SmallButton variant="danger" onClick={() => removeItem(idx)}>
                Remove
              </SmallButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Degree">
                <TextInput value={it.degree || ''} onChange={(e) => updateItem(idx, { degree: e.target.value })} />
              </Field>
              <Field label="Institution">
                <TextInput value={it.institution || ''} onChange={(e) => updateItem(idx, { institution: e.target.value })} />
              </Field>
              <Field label="Start Date">
                <DatePicker
                  placeholder="DD/MM/YY"
                  value={it.startDate || ''}
                  onChange={(value) => updateItem(idx, { startDate: value })}
                />
              </Field>
              <Field label="End Date">
                <DatePicker
                  placeholder="DD/MM/YY"
                  value={it.endDate || ''}
                  onChange={(value) => updateItem(idx, { endDate: value })}
                />
              </Field>
              <Field label="GPA (optional)">
                <TextInput value={it.gpa || ''} onChange={(e) => updateItem(idx, { gpa: e.target.value })} />
              </Field>
              <Field label="Honors (optional)">
                <TextInput value={it.honors || ''} onChange={(e) => updateItem(idx, { honors: e.target.value })} />
              </Field>
            </div>

            <Field label="Description (optional)">
              <TextArea rows={3} value={it.description || ''} onChange={(e) => updateItem(idx, { description: e.target.value })} />
            </Field>
          </div>
        ))
      )}
    </div>
  );
}
