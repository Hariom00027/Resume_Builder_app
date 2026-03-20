/**
 * Migration: update SaarthiX Special 2 template schema so that:
 * - Contact remains unchanged
 * - "My DNA" is edited via heading + subtext fields (2 fields)
 * - Skills are split into Technical and Non-Technical sections (2 sections)
 *
 * This updates the existing MongoDB template document for templateId:
 *   saartrhix-special-2
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
  console.log('Connected to MongoDB');

  const template = await ResumeTemplate.findOne({ templateId: 'saarthix-special-2' });
  if (!template) {
    console.error('Template saartrhix-special-2 not found');
    process.exit(1);
  }

  const schema = template.templateSchema;
  if (!schema || !Array.isArray(schema.sections)) {
    console.error('Template has no sections array in templateSchema');
    process.exit(1);
  }

  const sections = [...schema.sections];

  // 1) Update My DNA section fields
  const dnaIdx = sections.findIndex(
    (s) =>
      s &&
      typeof s.title === 'string' &&
      s.title.toLowerCase().includes('my dna') &&
      s.selector === '#container-dna'
  );
  if (dnaIdx === -1) {
    console.error('My DNA section not found in templateSchema.sections');
    process.exit(1);
  }

  sections[dnaIdx] = {
    ...sections[dnaIdx],
    title: 'My DNA',
    selector: '#container-dna',
    type: 'awards',
    isArray: true,
    fields: [
      { name: 'heading', label: 'DNA Heading', type: 'text', selector: '#container-dna li b', required: false },
      { name: 'subtext', label: 'DNA Subtext', type: 'textarea', selector: '#container-dna li', required: false }
    ]
  };

  // 2) Replace Skills section with Technical + Non-Technical sections
  const skillsIdx = sections.findIndex(
    (s) => s && typeof s.title === 'string' && s.title.trim().toLowerCase() === 'skills'
  );
  if (skillsIdx === -1) {
    console.error('Skills section not found in templateSchema.sections');
    process.exit(1);
  }

  const technicalSection = {
    title: 'Technical Skills',
    selector: '#container-skills li:first-of-type',
    type: 'skills',
    isArray: false,
    fields: [
      {
        name: 'technicalSkills',
        label: 'Technical Skills',
        type: 'textarea',
        selector: '#container-skills li:first-of-type',
        required: false
      }
    ]
  };

  const nonTechnicalSection = {
    title: 'Non-Technical Skills',
    selector: '#container-skills li:nth-of-type(2)',
    type: 'skills',
    isArray: false,
    fields: [
      {
        name: 'nonTechnicalSkills',
        label: 'Non-Technical Skills',
        type: 'textarea',
        selector: '#container-skills li:nth-of-type(2)',
        required: false
      }
    ]
  };

  sections.splice(skillsIdx, 1, technicalSection, nonTechnicalSection);

  template.templateSchema = {
    ...schema,
    sections
  };
  template.markModified('templateSchema');

  await template.save();
  console.log('✅ SaarthiX Special 2 template schema migrated successfully');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

