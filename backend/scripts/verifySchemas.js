const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const templates = await ResumeTemplate.find({});
  const withSchemas = templates.filter(t => t.templateSchema && t.templateSchema.sections);
  
  console.log(`\n📊 Schema Status Report:`);
  console.log(`Total templates: ${templates.length}`);
  console.log(`Templates with schemas: ${withSchemas.length}`);
  console.log(`Templates without schemas: ${templates.length - withSchemas.length}`);
  
  console.log(`\n✅ Templates WITH schemas:`);
  withSchemas.forEach(t => {
    const fieldCount = t.templateSchema.sections.reduce((sum, s) => sum + (s.fields?.length || 0), 0);
    console.log(`  - ${t.name}: ${t.templateSchema.sections.length} sections, ${fieldCount} fields, Image: ${t.templateSchema.hasImage ? 'Yes' : 'No'}`);
  });
  
  console.log(`\n❌ Templates WITHOUT schemas:`);
  templates.filter(t => !t.templateSchema || !t.templateSchema.sections).forEach(t => {
    console.log(`  - ${t.name} (${t.templateId})`);
  });
  
  process.exit(0);
})();
