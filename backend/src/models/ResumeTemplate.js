const mongoose = require('mongoose');

const TemplateConfigSchema = new mongoose.Schema({
  html: { type: String, required: true },
  css: { type: String, required: true },
  sections: [{ type: String }],
  layout: { type: String, enum: ['single-column', 'two-column', 'sidebar'], default: 'single-column' },
  colors: {
    primary: { type: String, default: '#000000' },
    secondary: { type: String, default: '#666666' }
  }
});

// Template Schema for AI mapping guidance
const TemplateSchemaSchema = new mongoose.Schema({
  sections: [{
    title: { type: String, required: true },
    selector: { type: String, required: true },
    type: { type: String, enum: ['contact', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'awards', 'languages', 'hobbies', 'references', 'volunteer', 'publications', 'image', 'other'], required: true },
    description: { type: String, default: '' },
    isArray: { type: Boolean, default: false },
    fields: [{
      name: { type: String, required: true },
      label: { type: String, required: true },
      type: { type: String, enum: ['text', 'email', 'tel', 'textarea', 'date', 'list', 'url', 'image'], required: true },
      selector: { type: String, required: true },
      required: { type: Boolean, default: false },
      placeholder: { type: String, default: '' },
      description: { type: String, default: '' }
    }]
  }],
  hasImage: { type: Boolean, default: false },
  imageSelector: { type: String, default: '' },
  layoutType: { type: String, enum: ['single-column', 'two-column', 'sidebar'], default: 'single-column' },
  notes: { type: String, default: '' } // Any special notes about this template
}, { _id: false });

const ResumeTemplateSchema = new mongoose.Schema({
  templateId: { type: String, required: true, unique: true }, // 'santiago', 'dublin', etc.
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['ats', 'modern', 'professional', 'simple', 'google-docs', 'word', 'saarthix-specials'],
    required: true 
  },
  description: { type: String, default: '' },
  previewImage: { type: String, default: '' },
  thumbnailImage: { type: String, default: '' },
  templateConfig: { type: TemplateConfigSchema, required: true },
  // Template schema for AI mapping guidance
  templateSchema: { type: TemplateSchemaSchema, default: null },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ResumeTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ResumeTemplate', ResumeTemplateSchema);
