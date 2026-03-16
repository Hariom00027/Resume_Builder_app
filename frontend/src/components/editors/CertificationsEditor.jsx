import React from 'react';
import { Field, TextInput, SmallButton } from './Field';

// Bug 4.1 fix applied: use stable _id key instead of array index.
function emptyCert() {
  return { _id: crypto.randomUUID(), name: '', issuer: '', date: '', url: '' };
}

export default function CertificationsEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];
  const updateItem = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));
  const addItem = () => onChange([...items, emptyCert()]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SmallButton variant="primary" onClick={addItem}>
          + Add Certification
        </SmallButton>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No certifications added yet.</p>
      ) : (
        items.map((it, idx) => (
          <div key={it._id || idx} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Certification #{idx + 1}</div>
              <SmallButton variant="danger" onClick={() => removeItem(idx)}>
                Remove
              </SmallButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name">
                <TextInput value={it.name || ''} onChange={(e) => updateItem(idx, { name: e.target.value })} />
              </Field>
              <Field label="Issuer">
                <TextInput value={it.issuer || ''} onChange={(e) => updateItem(idx, { issuer: e.target.value })} />
              </Field>
              <Field label="Date (optional)">
                <TextInput value={it.date || ''} onChange={(e) => updateItem(idx, { date: e.target.value })} />
              </Field>
              <Field label="URL (optional)">
                <TextInput value={it.url || ''} onChange={(e) => updateItem(idx, { url: e.target.value })} />
              </Field>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
