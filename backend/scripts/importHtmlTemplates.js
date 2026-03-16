/**
 * Import HTML templates from ../resume-templates into MongoDB.
 *
 * Usage:
 *   node scripts/importHtmlTemplates.js
 */

const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'resume-templates');

function toTitleCase(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferCategory(slug) {
  const s = slug.toLowerCase();
  if (s.includes('ats')) return 'ats';
  if (['simple', 'short', 'compact', 'minimal', 'clean', 'light', 'paper'].some((k) => s.includes(k))) return 'simple';
  if (['business', 'academic'].some((k) => s.includes(k))) return 'professional';
  if (['modern', 'flat', 'classy', 'elegant', 'kendall', 'macchiato', 'orbit', 'stackoverflow', 'spartan'].some((k) => s.includes(k))) return 'modern';
  return 'professional';
}

function inferLayout(html) {
  const h = html.toLowerCase();
  if (h.includes('sidebar') || h.includes('sidebar-wrapper') || h.includes('left-column') || h.includes('right-column')) return 'two-column';
  return 'single-column';
}

async function main() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    console.error(`Templates directory not found: ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.toLowerCase().endsWith('.html'));
  if (files.length === 0) {
    console.error(`No .html files found in: ${TEMPLATES_DIR}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
  console.log('Connected to MongoDB');

  const imported = [];

  for (const file of files) {
    const filePath = path.join(TEMPLATES_DIR, file);
    const slug = path.basename(file, '.html');
    const html = fs.readFileSync(filePath, 'utf8');

    const templateDoc = {
      templateId: slug,
      name: toTitleCase(slug),
      category: inferCategory(slug),
      description: `Imported HTML template: ${file}`,
      previewImage: '',
      thumbnailImage: '',
      templateConfig: {
        // Store HTML exactly as-is. Many of these templates are complete documents (doctype/head/body).
        html,
        // Mongoose marks empty string as missing for `required: true`, so keep a harmless comment.
        css: '/* imported */',
        sections: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'achievements'],
        layout: inferLayout(html),
        colors: { primary: '#000000', secondary: '#666666' }
      },
      isPremium: false,
      isActive: true
    };

    await ResumeTemplate.findOneAndUpdate(
      { templateId: slug },
      templateDoc,
      { upsert: true, new: true, runValidators: true }
    );
    imported.push(slug);
    console.log(`✓ Imported ${slug}`);
  }

  console.log(`\n✅ Imported/updated ${imported.length} templates from ${TEMPLATES_DIR}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});

