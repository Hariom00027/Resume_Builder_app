import React, { useState } from 'react';
import { aiAPI } from '../../services/api';

export default function AIBulletGeneratorModal({ isOpen, onClose, onInsert, initialRole = '', initialCompany = '' }) {
  const [role, setRole] = useState(initialRole);
  const [company, setCompany] = useState(initialCompany);
  const [keywords, setKeywords] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedBullets, setGeneratedBullets] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!role || !company) {
      setError('Role and Company are required to generate relevant bullets.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedBullets([]);
    setSelectedIndices(new Set());

    try {
      const resp = await aiAPI.generateBullets({ role, company, keywords });
      if (resp.data && resp.data.bullets && Array.isArray(resp.data.bullets)) {
        setGeneratedBullets(resp.data.bullets);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to generate bullets.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (index) => {
    const newKeys = new Set(selectedIndices);
    if (newKeys.has(index)) {
      newKeys.delete(index);
    } else {
      newKeys.add(index);
    }
    setSelectedIndices(newKeys);
  };

  const handleInsert = () => {
    const selectedBulletsText = Array.from(selectedIndices)
      .sort((a, b) => a - b)
      .map(index => generatedBullets[index]);
    
    onInsert(selectedBulletsText);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="m-0 text-xl font-semibold text-slate-900 flex items-center gap-2">
            ✨ AI Bullet Writer
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded text-2xl leading-none px-2 py-1 transition-colors"
          >
            &times;
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Job Role / Title *</label>
              <input 
                type="text" 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                placeholder="e.g. Software Engineer"
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company *</label>
              <input 
                type="text" 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
                placeholder="e.g. Google"
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Target Keywords / Focus Areas (Optional)</label>
            <textarea 
              value={keywords} 
              onChange={e => setKeywords(e.target.value)} 
              placeholder="e.g. React, Node.js, Performance optimization, Leadership"
              className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-y min-h-[80px]"
            />
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={isLoading || !role || !company}
            className="w-full flex justify-center items-center gap-2 py-3 px-6 rounded-lg font-medium text-sm transition-all bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin" />
                Generating...
              </>
            ) : generatedBullets.length > 0 ? (
              'Regenerate Bullets'
            ) : (
              'Generate Bullets'
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {generatedBullets.length > 0 && (
            <div className="flex flex-col gap-3 mt-6">
              <label className="text-sm font-medium text-slate-700">
                Select bullets to insert ({selectedIndices.size} selected):
              </label>
              {generatedBullets.map((bullet, index) => (
                <label 
                  key={index} 
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedIndices.has(index) 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-slate-50 border-slate-200 hover:bg-blue-50/50 hover:border-blue-200/50'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedIndices.has(index)} 
                    onChange={() => toggleSelection(index)}
                    className="mt-1 w-5 h-5 cursor-pointer accent-indigo-600"
                  />
                  <span className="text-sm text-slate-700 leading-relaxed">{bullet}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-4 bg-slate-50">
          <button 
            onClick={onClose}
            className="py-2.5 px-5 rounded-lg font-medium text-sm transition-all bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </button>
          <button 
            onClick={handleInsert}
            disabled={selectedIndices.size === 0}
            className="py-2.5 px-5 rounded-lg font-medium text-sm transition-all bg-indigo-600 text-white border-none hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            Insert Selected
          </button>
        </div>
      </div>
    </div>
  );
}
