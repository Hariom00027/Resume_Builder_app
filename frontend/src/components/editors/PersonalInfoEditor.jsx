import React from 'react';
import { Field, TextInput } from './Field';

export default function PersonalInfoEditor({ value, onChange }) {
  const v = value || {};
  const set = (patch) => onChange({ ...v, ...patch });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Full Name">
        <TextInput value={v.fullName || ''} onChange={(e) => set({ fullName: e.target.value })} />
      </Field>
      <Field label="Email">
        <TextInput type="email" value={v.email || ''} onChange={(e) => set({ email: e.target.value })} />
      </Field>
      <Field label="Phone">
        <TextInput value={v.phone || ''} onChange={(e) => set({ phone: e.target.value })} />
      </Field>
      <Field label="Location">
        <TextInput value={v.location || ''} onChange={(e) => set({ location: e.target.value })} />
      </Field>
      <Field label="LinkedIn URL">
        <TextInput value={v.linkedin || ''} onChange={(e) => set({ linkedin: e.target.value })} />
      </Field>
      <Field label="Portfolio URL">
        <TextInput value={v.portfolio || ''} onChange={(e) => set({ portfolio: e.target.value })} />
      </Field>
    </div>
  );
}

