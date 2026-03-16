import React from 'react';
import { Field, TextInput, TextArea, SmallButton } from './Field';
import DatePicker from './DatePicker';

// Bug 4.1 fixed: use stable `_id` as React key instead of array index.
// This prevents React from re-using stale DOM nodes when an item is removed from the middle.

function emptyExperience() {
  return {
    _id: crypto.randomUUID(),
    company: '',
    role: '',
    startDate: '',
    endDate: '',
    current: false,
    achievements: ['']
  };
}

export default function ExperienceEditor({ value, onChange }) {
  const items = Array.isArray(value) ? value : [];

  const updateItem = (idx, patch) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const removeItem = (idx) => onChange(items.filter((_, i) => i !== idx));

  const addItem = () => onChange([...items, emptyExperience()]);

  const updateAchievement = (idx, aIdx, text) => {
    const ach = Array.isArray(items[idx]?.achievements) ? items[idx].achievements : [];
    const nextAch = ach.map((a, i) => (i === aIdx ? text : a));
    updateItem(idx, { achievements: nextAch });
  };

  const addAchievement = (idx) => {
    const ach = Array.isArray(items[idx]?.achievements) ? items[idx].achievements : [];
    updateItem(idx, { achievements: [...ach, ''] });
  };

  const removeAchievement = (idx, aIdx) => {
    const ach = Array.isArray(items[idx]?.achievements) ? items[idx].achievements : [];
    updateItem(idx, { achievements: ach.filter((_, i) => i !== aIdx) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SmallButton variant="primary" onClick={addItem}>
          + Add Experience
        </SmallButton>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No experience added yet.</p>
      ) : (
        items.map((it, idx) => (
          <div key={it._id || idx} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Experience #{idx + 1}</div>
              <SmallButton variant="danger" onClick={() => removeItem(idx)}>
                Remove
              </SmallButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Role / Title">
                <TextInput value={it.role || ''} onChange={(e) => updateItem(idx, { role: e.target.value })} />
              </Field>
              <Field label="Company">
                <TextInput value={it.company || ''} onChange={(e) => updateItem(idx, { company: e.target.value })} />
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
                  disabled={!!it.current}
                />
              </Field>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!it.current}
                onChange={(e) => updateItem(idx, { current: e.target.checked })}
              />
              <span className="text-sm">Currently working here</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">Achievements (bullets)</div>
                <SmallButton onClick={() => addAchievement(idx)}>+ Add Bullet</SmallButton>
              </div>
              {(it.achievements || []).map((a, aIdx) => (
                <div key={aIdx} className="flex gap-2">
                  <TextArea
                    rows={2}
                    value={a}
                    onChange={(e) => updateAchievement(idx, aIdx, e.target.value)}
                    placeholder="Achievement / impact…"
                  />
                  <SmallButton variant="danger" onClick={() => removeAchievement(idx, aIdx)}>
                    ✕
                  </SmallButton>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
