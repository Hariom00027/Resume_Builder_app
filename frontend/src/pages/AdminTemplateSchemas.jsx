import React, { useState, useEffect } from 'react';
import { templateAPI } from '../services/api';

function AdminTemplateSchemas() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [schema, setSchema] = useState(null);
  const [editingSchema, setEditingSchema] = useState(null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateAPI.getAll();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setMessage({ type: 'error', text: 'Failed to load templates' });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateDetails = async (templateId) => {
    try {
      const response = await templateAPI.getById(templateId);
      const template = response.data;
      setSelectedTemplate(template);
      setSchema(template.templateSchema);
      setEditingSchema(template.templateSchema ? JSON.stringify(template.templateSchema, null, 2) : '');
    } catch (error) {
      console.error('Error loading template:', error);
      setMessage({ type: 'error', text: 'Failed to load template details' });
    }
  };

  const handleRegenerateSchema = async () => {
    if (!selectedTemplate) return;
    
    try {
      setRegenerating(true);
      setMessage({ type: 'info', text: 'Regenerating schema...' });
      const response = await templateAPI.regenerateSchema(selectedTemplate.templateId);
      setSchema(response.data.templateSchema);
      setEditingSchema(JSON.stringify(response.data.templateSchema, null, 2));
      setMessage({ type: 'success', text: 'Schema regenerated successfully!' });
    } catch (error) {
      console.error('Error regenerating schema:', error);
      setMessage({ type: 'error', text: 'Failed to regenerate schema: ' + (error.response?.data?.error || error.message) });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveSchema = async () => {
    if (!selectedTemplate || !editingSchema) return;
    
    try {
      setSaving(true);
      const parsedSchema = JSON.parse(editingSchema);
      await templateAPI.updateSchema(selectedTemplate.templateId, parsedSchema);
      setSchema(parsedSchema);
      setMessage({ type: 'success', text: 'Schema saved successfully!' });
    } catch (error) {
      if (error instanceof SyntaxError) {
        setMessage({ type: 'error', text: 'Invalid JSON format' });
      } else {
        console.error('Error saving schema:', error);
        setMessage({ type: 'error', text: 'Failed to save schema: ' + (error.response?.data?.error || error.message) });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    loadTemplateDetails(template.templateId);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Template Schema Management</h1>
        <p className="text-gray-600">Manage and edit template schemas for AI field mapping</p>
      </div>

      {message.text && (
        <div className={`mb-4 p-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.text}
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-4">Templates</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.templateId}
                  onClick={() => handleTemplateSelect(template)}
                  className={`w-full text-left p-3 rounded border-2 transition-colors ${
                    selectedTemplate?.templateId === template.templateId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-sm text-gray-500">
                    {template.category} • {template.templateSchema ? '✓ Has Schema' : '✗ No Schema'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Schema Editor */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedTemplate.name}</h2>
                  <p className="text-sm text-gray-500">Template ID: {selectedTemplate.templateId}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerateSchema}
                    disabled={regenerating}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {regenerating ? 'Regenerating...' : '🔄 Regenerate Schema'}
                  </button>
                  <button
                    onClick={handleSaveSchema}
                    disabled={saving || !editingSchema}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {saving ? 'Saving...' : '💾 Save Schema'}
                  </button>
                </div>
              </div>

              {schema ? (
                <div>
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Sections:</span> {schema.sections?.length || 0}
                      </div>
                      <div>
                        <span className="font-medium">Has Image:</span> {schema.hasImage ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Layout:</span> {schema.layoutType || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Total Fields:</span>{' '}
                        {schema.sections?.reduce((sum, s) => sum + (s.fields?.length || 0), 0) || 0}
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="block text-sm font-medium mb-1">Schema JSON (Editable)</label>
                    <textarea
                      value={editingSchema || ''}
                      onChange={(e) => setEditingSchema(e.target.value)}
                      className="w-full h-96 font-mono text-sm border rounded p-3"
                      placeholder="Schema JSON will appear here..."
                    />
                  </div>

                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Schema Preview</h3>
                    <div className="bg-gray-50 rounded p-4 max-h-64 overflow-y-auto">
                      <pre className="text-xs">{JSON.stringify(schema, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No schema found for this template</p>
                  <button
                    onClick={handleRegenerateSchema}
                    disabled={regenerating}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {regenerating ? 'Generating...' : 'Generate Schema'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">Select a template to view/edit its schema</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminTemplateSchemas;
