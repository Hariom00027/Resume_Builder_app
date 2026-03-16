import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5027/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Resume API
export const resumeAPI = {
  getAll: () => api.get('/resumes'),
  getById: (id) => api.get(`/resumes/${id}`),
  create: (data) => api.post('/resumes', data),
  update: (id, data) => api.put(`/resumes/${id}`, data),
  delete: (id) => api.delete(`/resumes/${id}`),
  duplicate: (id) => api.post(`/resumes/${id}/duplicate`),
  parse: (formData) => api.post('/resumes/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

// Template API
export const templateAPI = {
  getAll: (category) => {
    const params = category ? { category } : {};
    return api.get('/templates', { params });
  },
  getById: (id) => api.get(`/templates/${id}`),
  updateSchema: (templateId, templateSchema) => api.put(`/templates/${templateId}/schema`, { templateSchema }),
  regenerateSchema: (templateId) => api.post(`/templates/${templateId}/regenerate-schema`)
};

// AI API
export const aiAPI = {
  generateSummary: (data) => api.post('/ai/generate-summary', data),
  generateBullets: (data) => api.post('/ai/generate-bullets', data),
  matchJobDescription: (data) => api.post('/ai/match-job', data),
  autoTailorJob: (data) => api.post('/ai/auto-tailor-job', data),
  optimizeBullets: (data) => api.post('/ai/optimize-bullets', data),
  tailorResume: (data) => api.post('/ai/tailor-resume', data),
  suggestImprovements: (data) => api.post('/ai/suggest-improvements', data),
  parseJobDescription: (data) => api.post('/ai/parse-job-description', data),
  analyzeTemplate: (data) => api.post('/ai/analyze-template', data),
  injectTemplateData: (data) => api.post('/ai/inject-template-data', data)
};

// ATS API
export const atsAPI = {
  analyze: (id) => api.post(`/ats/analyze/${id}`),
  match: (data) => api.post('/ats/match', data)
};

// Real-time ATS Scoring API (Local Logic)
export const atsScoringAPI = {
  analyze: (data) => api.post('/ats-scoring/analyze', data)
};

// Export API
export const exportAPI = {
  pdf: (id) => api.post(`/export/pdf/${id}`, {}, { responseType: 'blob' })
};

export default api;
