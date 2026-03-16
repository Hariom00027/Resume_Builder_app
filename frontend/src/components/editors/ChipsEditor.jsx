import React, { useMemo, useState } from 'react';
import { SmallButton } from './Field';

// Bug 4.2 fixed:
//  - Duplicate check is now case-insensitive
//  - User gets a visible inline message when a duplicate is detected

export default function ChipsEditor({ value, onChange, placeholder = 'Type and press Enter' }) {
  const items = useMemo(() => (Array.isArray(value) ? value.filter(Boolean) : []), [value]);
  const [draft, setDraft] = useState('');
  const [dupWarning, setDupWarning] = useState(false);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    const isDuplicate = items.some((i) => i.toLowerCase() === v.toLowerCase());
    if (isDuplicate) {
      setDupWarning(true);
      setTimeout(() => setDupWarning(false), 2000);
      return;
    }
    setDupWarning(false);
    onChange([...items, v]);
    setDraft('');
  };

  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => { setDraft(e.target.value); setDupWarning(false); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <SmallButton variant="primary" onClick={add}>
          Add
        </SmallButton>
      </div>

      {dupWarning && (
        <p className="text-xs text-orange-600">⚠️ This item already exists.</p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No items added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it, idx) => (
            <span
              key={`${it}-${idx}`}
              className="inline-flex items-center gap-2 bg-gray-100 border rounded-full px-3 py-1 text-sm"
            >
              {it}
              <button
                type="button"
                className="text-gray-500 hover:text-gray-900"
                onClick={() => remove(idx)}
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
