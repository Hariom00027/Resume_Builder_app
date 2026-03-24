import React from 'react';

export default function AccordionSection({ title, isOpen, onToggle, right, children }) {
  return (
    <div className="border rounded-lg">
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle?.();
          }
        }}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t-lg cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold">{title}</span>
          {/* Prevent header toggle when clicking action buttons/icons */}
          <div onClick={(e) => e.stopPropagation()}>{right}</div>
        </div>
        <span className="text-gray-500">{isOpen ? '▾' : '▸'}</span>
      </div>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

