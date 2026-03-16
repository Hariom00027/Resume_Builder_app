const ResumeTemplate = require('../models/ResumeTemplate');

class TemplateController {
  // Get all templates
  async getAllTemplates(req, res) {
    try {
      const { category } = req.query;
      const query = { isActive: true };
      if (category) {
        query.category = category;
      }
      const templates = await ResumeTemplate.find(query).sort({ name: 1 });
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get template by ID
  async getTemplateById(req, res) {
    try {
      const template = await ResumeTemplate.findOne({ templateId: req.params.id });
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create template (for admin use)
  async createTemplate(req, res) {
    try {
      const template = new ResumeTemplate(req.body);
      await template.save();
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update template
  async updateTemplate(req, res) {
    try {
      const template = await ResumeTemplate.findOneAndUpdate(
        { templateId: req.params.id },
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update template schema only
  async updateTemplateSchema(req, res) {
    try {
      const { templateId } = req.params;
      const { templateSchema } = req.body;
      
      const template = await ResumeTemplate.findOneAndUpdate(
        { templateId },
        { templateSchema, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json({ 
        success: true, 
        template: template,
        message: 'Template schema updated successfully' 
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Regenerate schema for a template
  async regenerateSchema(req, res) {
    try {
      const { templateId } = req.params;
      const template = await ResumeTemplate.findOne({ templateId });
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Import the service dynamically to avoid circular dependencies
      const openaiService = require('../services/openaiService');
      const analysis = await openaiService.analyzeTemplateStructure(template.templateConfig.html);
      
      // Convert analysis to schema format
      const templateSchema = {
        sections: analysis.sections.map(section => ({
          title: section.title,
          selector: section.selector,
          type: section.type || 'other',
          description: section.description || '',
          isArray: section.isArray || false,
          fields: (section.fields || []).map(field => ({
            name: field.name,
            label: field.label,
            type: field.type || 'text',
            selector: field.selector || '',
            required: field.required || false,
            placeholder: field.placeholder || '',
            description: field.description || ''
          }))
        })),
        hasImage: analysis.sections.some(s => s.fields?.some(f => f.type === 'image')),
        imageSelector: (() => {
          const imageSection = analysis.sections.find(s => s.fields?.some(f => f.type === 'image'));
          if (imageSection) {
            const imageField = imageSection.fields.find(f => f.type === 'image');
            return imageField?.selector || '';
          }
          return '';
        })(),
        layoutType: template.templateConfig.layout || 'single-column',
        notes: `Auto-regenerated schema for ${template.name}`
      };
      
      template.templateSchema = templateSchema;
      await template.save();
      
      res.json({ 
        success: true, 
        templateSchema,
        message: 'Schema regenerated successfully' 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new TemplateController();
