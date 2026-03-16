/**
 * Generate template schemas for all templates
 * This creates a pre-analyzed structure that helps AI map fields correctly
 * 
 * Usage: node scripts/generateTemplateSchemas.js [templateId]
 * If templateId is provided, only that template will be processed
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

// Import after dotenv.config() to ensure env vars are loaded
const openaiService = require('../src/services/openaiService');

async function generateSchemaForTemplate(template) {
  try {
    console.log(`\n📋 Analyzing template: ${template.name} (${template.templateId})`);
    
    // Use AI to analyze the template
    const analysis = await openaiService.analyzeTemplateStructure(template.templateConfig.html);
    
    // Convert analysis to schema format
    const schema = {
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
      notes: `Auto-generated schema for ${template.name}`
    };
    
    // Update template with schema
    template.templateSchema = schema;
    await template.save();
    
    console.log(`✅ Generated schema with ${schema.sections.length} sections`);
    console.log(`   - Has image: ${schema.hasImage ? 'Yes' : 'No'}`);
    console.log(`   - Total fields: ${schema.sections.reduce((sum, s) => sum + (s.fields?.length || 0), 0)}`);
    
    return schema;
  } catch (error) {
    console.error(`❌ Failed to generate schema for ${template.name}:`, error.message);
    return null;
  }
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
    console.log('Connected to MongoDB');

    const templateId = process.argv[2]; // Optional template ID from command line
    
    let templates;
    if (templateId) {
      templates = await ResumeTemplate.find({ templateId });
      if (templates.length === 0) {
        console.error(`Template not found: ${templateId}`);
        process.exit(1);
      }
    } else {
      templates = await ResumeTemplate.find({ isActive: true });
    }

    console.log(`\n🔍 Found ${templates.length} template(s) to process\n`);

    let successCount = 0;
    let failCount = 0;

    for (const template of templates) {
      const schema = await generateSchemaForTemplate(template);
      if (schema) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Schema generation complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    process.exit(0);
  } catch (error) {
    console.error('Error generating schemas:', error);
    process.exit(1);
  }
}

main();
