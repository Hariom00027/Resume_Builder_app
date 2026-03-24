const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const ResumeTemplate = require('../src/models/ResumeTemplate');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
  const t = await ResumeTemplate.findOne({ templateId: 'saarthix-special-1' });
  if (!t) {
    console.error('Template not found: saarthix-special-1');
    process.exit(1);
  }

  const sections = (t.templateSchema?.sections || []).map((s) => ({
    title: s.title,
    selector: s.selector,
    type: s.type,
    isArray: s.isArray,
    fields: (s.fields || []).map((f) => ({
      name: f.name,
      type: f.type,
      selector: f.selector,
      required: f.required,
      placeholder: f.placeholder,
    })),
  }));

  console.log(JSON.stringify(sections, null, 2));
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

