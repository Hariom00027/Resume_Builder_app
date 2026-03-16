import React, { useState, useEffect } from 'react';
import { aiAPI } from '../../services/api';

export default function AIBulletGeneratorModal({ 
  isOpen, 
  onClose, 
  onInsert, 
  initialRole = '', 
  initialCompany = '',
  sectionType = 'experience',
  sectionData = {},
  fieldName = ''
}) {
  const [role, setRole] = useState(initialRole);
  const [company, setCompany] = useState(initialCompany);
  const [keywords, setKeywords] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedBullets, setGeneratedBullets] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  // Update state when props change
  useEffect(() => {
    if (isOpen) {
      setRole(initialRole);
      setCompany(initialCompany);
      setKeywords('');
      setGeneratedBullets([]);
      setSelectedIndices(new Set());
      setError(null);
    }
  }, [isOpen, initialRole, initialCompany]);

  if (!isOpen) return null;

  // Determine section-specific requirements and labels
  const getSectionConfig = () => {
    const normalizedType = (sectionType || '').toLowerCase();
    
    switch (normalizedType) {
      case 'summary':
      case 'about':
      case 'profile':
        return {
          title: 'AI Summary Writer',
          requiresRole: false,
          requiresCompany: false,
          roleLabel: 'Current Role (Optional)',
          companyLabel: 'Company (Optional)',
          keywordsLabel: 'Target Keywords / Focus Areas',
          generateButtonText: 'Generate Summary',
          description: 'Generate a professional summary based on your experience, education, and skills.'
        };
      
      case 'education':
      case 'qualifications':
        return {
          title: 'AI Education Writer',
          requiresRole: false,
          requiresCompany: false,
          roleLabel: 'Degree / Qualification',
          companyLabel: 'Institution / School',
          keywordsLabel: 'Relevant Keywords / Focus Areas',
          generateButtonText: 'Generate Education Content',
          description: 'Generate professional education descriptions and achievement bullets.'
        };
      
      case 'projects':
      case 'project':
        return {
          title: 'AI Project Writer',
          requiresRole: false,
          requiresCompany: false,
          roleLabel: 'Project Name',
          companyLabel: 'Technologies Used (Optional)',
          keywordsLabel: 'Target Keywords / Focus Areas',
          generateButtonText: 'Generate Project Content',
          description: 'Generate compelling project descriptions and technical achievements.'
        };
      
      case 'certifications':
      case 'certification':
      case 'certificates':
        return {
          title: 'AI Certification Writer',
          requiresRole: false,
          requiresCompany: false,
          roleLabel: 'Certification Name',
          companyLabel: 'Issuing Organization',
          keywordsLabel: 'Relevant Keywords',
          generateButtonText: 'Generate Certification Content',
          description: 'Generate professional certification descriptions and key points.'
        };
      
      case 'skills':
      case 'skill':
        return {
          title: 'AI Skills Writer',
          requiresRole: false,
          requiresCompany: false,
          roleLabel: 'Current Skills (Optional)',
          companyLabel: 'Target Role / Industry (Optional)',
          keywordsLabel: 'Required Skills / Keywords',
          generateButtonText: 'Generate Skills',
          description: 'Generate a well-organized, relevant skills list.'
        };
      
      case 'achievements':
      case 'achievement':
      case 'awards':
      case 'award':
        return {
          title: 'AI Achievement Writer',
          requiresRole: false,
          requiresCompany: false,
          roleLabel: 'Achievement Name',
          companyLabel: 'Issuing Organization (Optional)',
          keywordsLabel: 'Relevant Keywords',
          generateButtonText: 'Generate Achievement Content',
          description: 'Generate impactful achievement descriptions.'
        };
      
      default: // experience, work, employment
        return {
          title: 'AI Bullet Writer',
          requiresRole: true,
          requiresCompany: true,
          roleLabel: 'Job Role / Title *',
          companyLabel: 'Company *',
          keywordsLabel: 'Target Keywords / Focus Areas (Optional)',
          generateButtonText: 'Generate Bullets',
          description: 'Generate high-impact, achievement-oriented bullet points for work experience.'
        };
    }
  };

  const config = getSectionConfig();

  const handleGenerate = async () => {
    if (config.requiresRole && !role) {
      setError(`${config.roleLabel.replace('*', '').trim()} is required.`);
      return;
    }
    if (config.requiresCompany && !company) {
      setError(`${config.companyLabel.replace('*', '').trim()} is required.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedBullets([]);
    setSelectedIndices(new Set());

    try {
      // Build section-specific data object
      const normalizedType = (sectionType || 'experience').toLowerCase();
      let requestData = {
        sectionType: normalizedType,
        keywords: keywords || ''
      };

      // Add section-specific data based on type
      if (normalizedType === 'experience' || normalizedType === 'work' || normalizedType === 'employment') {
        requestData.role = role;
        requestData.company = company;
        requestData.sectionData = { role, company };
      } else if (normalizedType === 'education' || normalizedType === 'qualifications') {
        requestData.sectionData = {
          degree: role,
          institution: company,
          ...sectionData
        };
      } else if (normalizedType === 'projects' || normalizedType === 'project') {
        requestData.sectionData = {
          name: role,
          technologies: company,
          ...sectionData
        };
      } else if (normalizedType === 'certifications' || normalizedType === 'certification') {
        requestData.sectionData = {
          name: role,
          issuer: company,
          ...sectionData
        };
      } else if (normalizedType === 'skills' || normalizedType === 'skill') {
        requestData.sectionData = {
          existingSkills: role ? role.split(',').map(s => s.trim()) : [],
          targetRole: company,
          ...sectionData
        };
      } else if (normalizedType === 'achievements' || normalizedType === 'achievement') {
        requestData.sectionData = {
          name: role,
          issuer: company,
          ...sectionData
        };
      } else {
        // Summary or other types
        requestData.sectionData = {
          ...sectionData,
          role: role || undefined,
          company: company || undefined
        };
      }

      const resp = await aiAPI.generateBullets(requestData);
      if (resp.data && resp.data.bullets && Array.isArray(resp.data.bullets)) {
        setGeneratedBullets(resp.data.bullets);
      } else {
        throw new Error('Invalid response format from AI');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to generate content.');
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
          <div>
            <h2 className="m-0 text-xl font-semibold text-slate-900 flex items-center gap-2">
              ✨ {config.title}
            </h2>
            {config.description && (
              <p className="text-xs text-slate-600 mt-1">{config.description}</p>
            )}
          </div>
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
              <label className="block text-sm font-medium text-slate-700 mb-2">{config.roleLabel}</label>
              <input 
                type="text" 
                value={role} 
                onChange={e => setRole(e.target.value)} 
                placeholder={config.roleLabel.includes('Role') ? "e.g. Software Engineer" : config.roleLabel.includes('Degree') ? "e.g. Bachelor of Science" : config.roleLabel.includes('Project') ? "e.g. E-commerce Platform" : config.roleLabel.includes('Certification') ? "e.g. AWS Certified Solutions Architect" : config.roleLabel.includes('Achievement') ? "e.g. Best Employee Award" : "Enter value"}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{config.companyLabel}</label>
              <input 
                type="text" 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
                placeholder={config.companyLabel.includes('Company') ? "e.g. Google" : config.companyLabel.includes('Institution') ? "e.g. MIT" : config.companyLabel.includes('Technologies') ? "e.g. React, Node.js, MongoDB" : config.companyLabel.includes('Organization') ? "e.g. Amazon Web Services" : "Enter value"}
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">{config.keywordsLabel}</label>
            <textarea 
              value={keywords} 
              onChange={e => setKeywords(e.target.value)} 
              placeholder="e.g. React, Node.js, Performance optimization, Leadership"
              className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-y min-h-[80px]"
            />
          </div>

          <button 
            onClick={handleGenerate} 
            disabled={isLoading || (config.requiresRole && !role) || (config.requiresCompany && !company)}
            className="w-full flex justify-center items-center gap-2 py-3 px-6 rounded-lg font-medium text-sm transition-all bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600/30 border-t-indigo-600 animate-spin" />
                Generating...
              </>
            ) : generatedBullets.length > 0 ? (
              `Regenerate ${config.generateButtonText.replace('Generate ', '')}`
            ) : (
              config.generateButtonText
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
                Select content to insert ({selectedIndices.size} selected):
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
