/**
 * Hard reset: delete all saved resumes and clear any template overrides.
 *
 * Usage:
 *   node scripts/resetAllResumes.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Resume = require('../src/models/Resume');

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
  const res = await Resume.deleteMany({});
  console.log(`✅ Deleted ${res.deletedCount || 0} resumes`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('❌ Failed to reset resumes', e);
  process.exit(1);
});

