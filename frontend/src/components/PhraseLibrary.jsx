import React, { useState, useMemo } from 'react';
import phraseLibrary from '../data/phraseLibrary';

export default function PhraseLibrary({ onClose, onInsertPhrase }) {
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState(phraseLibrary[0].role);
  const [copiedPhrase, setCopiedPhrase] = useState(null);

  const filteredLibrary = useMemo(() => {
    if (!search.trim()) return phraseLibrary;
    const q = search.toLowerCase();
    return phraseLibrary
      .map(category => ({
        ...category,
        phrases: category.phrases.filter(p => p.toLowerCase().includes(q))
      }))
      .filter(cat => cat.phrases.length > 0 || cat.role.toLowerCase().includes(q));
  }, [search]);

  const activeCategory = useMemo(() => {
    if (search.trim()) return filteredLibrary[0] || null;
    return phraseLibrary.find(c => c.role === activeRole) || null;
  }, [search, filteredLibrary, activeRole]);

  const handleCopy = (phrase) => {
    navigator.clipboard.writeText(phrase).catch(() => {});
    setCopiedPhrase(phrase);
    setTimeout(() => setCopiedPhrase(null), 2000);
  };

  const handleInsert = (phrase) => {
    if (onInsertPhrase) onInsertPhrase(phrase);
    handleCopy(phrase);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-purple-600 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              📚 Phrase Library
            </h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Click any phrase to copy & insert it
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl leading-none px-1"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search phrases or roles..."
              className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Role tabs — hidden when searching */}
          {!search.trim() && (
            <div className="w-40 border-r border-slate-100 overflow-y-auto flex-shrink-0 py-2 bg-slate-50">
              {phraseLibrary.map(category => (
                <button
                  key={category.role}
                  onClick={() => setActiveRole(category.role)}
                  className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors flex items-start gap-2 ${
                    activeRole === category.role
                      ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-500'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">{category.icon}</span>
                  <span className="leading-tight">{category.role}</span>
                </button>
              ))}
            </div>
          )}

          {/* Phrases */}
          <div className="flex-1 overflow-y-auto p-4">
            {search.trim() && filteredLibrary.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">No phrases found for "{search}"</p>
              </div>
            )}

            {(search.trim() ? filteredLibrary : (activeCategory ? [activeCategory] : [])).map(category => (
              <div key={category.role} className="mb-6">
                {search.trim() && (
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <span>{category.icon}</span> {category.role}
                  </h3>
                )}
                <div className="flex flex-col gap-2">
                  {category.phrases.map((phrase, idx) => {
                    const isCopied = copiedPhrase === phrase;
                    return (
                      <div
                        key={idx}
                        className={`group relative rounded-lg border p-3 cursor-pointer transition-all ${
                          isCopied
                            ? 'bg-green-50 border-green-300'
                            : 'bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                        }`}
                        onClick={() => handleInsert(phrase)}
                      >
                        <p className="text-sm text-slate-700 leading-relaxed pr-16">
                          {phrase}
                        </p>
                        {/* Action badge */}
                        <div className="absolute right-2 top-2 flex gap-1">
                          {isCopied ? (
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              ✓ Copied!
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 bg-white px-2 py-0.5 rounded-full border border-slate-200 transition-opacity">
                              Click to copy
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            💡 Replace <code className="bg-slate-200 px-1 rounded text-[10px]">[X]</code> placeholders with your actual numbers for maximum impact.
          </p>
        </div>
      </div>
    </>
  );
}
