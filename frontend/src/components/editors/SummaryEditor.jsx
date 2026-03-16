import React from 'react';
import { Field, TextArea } from './Field';

export default function SummaryEditor({ value, onChange }) {
  return (
    <Field label="Professional Summary">
      <TextArea rows={6} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Write a short professional summary..." />
    </Field>
  );
}

