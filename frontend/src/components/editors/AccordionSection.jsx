import React from 'react';

export default function AccordionSection({ title, isOpen, onToggle, right, children }) {
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold">{title}</span>
          {right}
        </div>
        <span className="text-gray-500">{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

