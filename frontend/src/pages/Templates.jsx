import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { templateAPI } from '../services/api';
import { buildTemplatePreviewSrcDoc } from '../utils/templatePreviewDoc';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateAPI.getAll(selectedCategory || null);
      console.log('Templates response:', response.data);
      if (response.data && Array.isArray(response.data)) {
        setTemplates(response.data);
      } else {
        console.error('Invalid templates response:', response.data);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      console.error('Error details:', error.response?.data || error.message);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: '', label: 'All Templates' },
    { value: 'ats', label: 'ATS Templates' },
    { value: 'modern', label: 'Modern' },
    { value: 'professional', label: 'Professional' },
    { value: 'simple', label: 'Simple' },
    { value: 'saarthix-specials', label: 'SaarthiX Specials' }
  ];

  const handleSelectTemplate = (templateId) => {
    navigate(`/builder?template=${templateId}`);
  };

  if (loading) {
    return <div className="p-8">Loading templates...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Resume Templates</h1>

      <div className="mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded px-4 py-2"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {templates.length === 0 ? (
        <p className="text-gray-500">No templates found. Please seed templates first.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template._id}
              className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border ${
                template.category === 'saarthix-specials'
                  ? 'border-orange-400 shadow-orange-200/60 hover:shadow-orange-300/60'
                  : 'border-transparent'
              }`}
              style={template.category === 'saarthix-specials' ? { boxShadow: '0 0 0 2px rgba(251,146,60,0.35), 0 10px 25px -12px rgba(249,115,22,0.55)' } : undefined}
              onClick={() => handleSelectTemplate(template.templateId)}
            >
              <div className="bg-gray-100 h-56 mb-4 rounded overflow-hidden">
                <iframe
                  title={`${template.name} preview`}
                  srcDoc={template.templateConfig?.html
                    ? buildTemplatePreviewSrcDoc(template.templateConfig.html)
                    : '<div style="padding:16px;color:#999;">No preview</div>'}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                  style={{
                    transform: 'scale(0.4)',
                    transformOrigin: 'top left',
                    width: '250%',
                    height: '250%',
                    pointerEvents: 'none'
                  }}
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{template.description}</p>
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {template.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Templates;
