/**
 * Adds editable heading fields (heading1 / heading2 / heading3) to the
 * "My DNA" section of the SaarthiX Special 1 template schema.
 *
 * These fields map to the <b> label elements before each DNA category list.
 * They bypass AI and are injected directly so the user can rename them freely.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
  console.log('Connected to MongoDB');

  const template = await ResumeTemplate.findOne({ templateId: 'saarthix-special-1' });
  if (!template) {
    console.error('Template not found');
    process.exit(1);
  }

  const sections = template.templateSchema?.sections;
  if (!Array.isArray(sections)) {
    console.error('No sections in schema');
    process.exit(1);
  }

  const dnaIdx = sections.findIndex(s => s.title === 'My DNA');
  if (dnaIdx === -1) {
    console.error('My DNA section not found');
    process.exit(1);
  }

  const dnaSection = sections[dnaIdx];
  const fields = dnaSection.fields || [];

  // Remove any existing heading fields to avoid duplicates on re-run
  const cleaned = fields.filter(f => !['heading1','heading2','heading3'].includes(f.name));

  // New heading fields interleaved before each list field
  const headingFields = [
    {
      name: 'heading1',
      label: 'Category 1 Label',
      type: 'text',
      selector: `.right .section:first-of-type b:nth-of-type(1)`,
      required: false,
      placeholder: 'Entrepreneurial Mindset',
      description: 'Heading label for the first DNA category'
    },
    {
      name: 'heading2',
      label: 'Category 2 Label',
      type: 'text',
      selector: `.right .section:first-of-type b:nth-of-type(2)`,
      required: false,
      placeholder: 'Technical Leadership',
      description: 'Heading label for the second DNA category'
    },
    {
      name: 'heading3',
      label: 'Category 3 Label',
      type: 'text',
      selector: `.right .section:first-of-type b:nth-of-type(3)`,
      required: false,
      placeholder: 'Innovation',
      description: 'Heading label for the third DNA category'
    }
  ];

  // Interleave: heading1, list1, heading2, list2, heading3, list3
  const reordered = [];
  const listFields = cleaned; // entrepreneurialMindset, technicalLeadership, innovation in order
  headingFields.forEach((hf, i) => {
    reordered.push(hf);
    if (listFields[i]) reordered.push(listFields[i]);
  });
  // append any remaining list fields if there are more than 3
  listFields.slice(3).forEach(f => reordered.push(f));

  // Build a plain-object copy of every section to avoid Mongoose subdoc quirks
  const plainSections = sections.map((s, i) => {
    const plain = {
      title: s.title,
      selector: s.selector,
      type: s.type,
      description: s.description || '',
      isArray: !!s.isArray,
      fields: (s.fields || []).map(f => ({
        name: f.name,
        label: f.label,
        type: f.type,
        selector: f.selector || '',
        required: !!f.required,
        placeholder: f.placeholder || '',
        description: f.description || '',
        ...(f.updateStrategy ? { updateStrategy: f.updateStrategy } : {})
      }))
    };
    if (i === dnaIdx) plain.fields = reordered.map(f => ({
      name: f.name,
      label: f.label,
      type: f.type,
      selector: f.selector || '',
      required: !!f.required,
      placeholder: f.placeholder || '',
      description: f.description || '',
    }));
    return plain;
  });

  template.templateSchema = {
    sections: plainSections,
    hasImage: template.templateSchema?.hasImage ?? true,
    imageSelector: template.templateSchema?.imageSelector || '.photo img',
    layoutType: template.templateSchema?.layoutType || 'two-column',
    notes: template.templateSchema?.notes || ''
  };
  template.markModified('templateSchema');
  await template.save();

  console.log('✅ My DNA heading fields added successfully!');
  console.log(`   DNA section now has ${reordered.length} fields`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
