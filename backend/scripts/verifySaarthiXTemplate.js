const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const template = await ResumeTemplate.findOne({ templateId: 'saarthix-special-1' });
  
  console.log('\n=== SaarthiX Special 1 Schema ===\n');
  console.log(`Sections: ${template.templateSchema.sections.length}\n`);
  
  template.templateSchema.sections.forEach((s, i) => {
    console.log(`Section ${i+1}: ${s.title}`);
    console.log(`  Selector: ${s.selector}`);
    console.log(`  Type: ${s.type}`);
    console.log(`  IsArray: ${s.isArray}`);
    console.log(`  Fields: ${s.fields?.length || 0}`);
    s.fields?.forEach((f, fi) => {
      console.log(`    ${fi+1}. ${f.name} (${f.type})`);
      console.log(`       Selector: ${f.selector}`);
    });
    console.log('');
  });
  
  // Check for invalid selectors
  console.log('\n=== Checking for Invalid Selectors ===\n');
  let hasInvalid = false;
  template.templateSchema.sections.forEach(s => {
    s.fields?.forEach(f => {
      if (f.selector && (f.selector.includes(':contains') || f.selector.includes(':has'))) {
        console.log(`❌ Invalid selector in ${s.title} > ${f.name}: ${f.selector}`);
        hasInvalid = true;
      }
    });
  });
  
  if (!hasInvalid) {
    console.log('✅ All selectors are valid!');
  }
  
  process.exit(0);
})();
