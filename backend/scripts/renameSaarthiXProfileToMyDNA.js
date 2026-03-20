/**
 * Rename the "Profile" heading in the right column of SaarthiX Special 1
 * to "My DNA", and update the stored templateSchema section title to match.
 *
 * Usage:
 *   node scripts/renameSaarthiXProfileToMyDNA.js
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
    console.error('❌ saarthix-special-1 not found');
    process.exit(1);
  }

  // --- 1. Update the template HTML ---
  // We only want to replace the <h2>Profile</h2> that lives inside the .right panel,
  // not the one in .left sidebar.  We do this by finding the right-column section
  // block and replacing its heading text.
  const parser =
    typeof DOMParser !== 'undefined'
      ? new DOMParser()
      : (() => {
          // Node environment: use JSDOM if available, otherwise use string replace with a
          // narrow enough regex that only hits the right-column first .section h2.
          return null;
        })();

  let html = template.templateConfig.html || '';

  if (parser) {
    // Browser-like environment (shouldn't happen for a Node script, but just in case)
    const doc = parser.parseFromString(html, 'text/html');
    const rightSections = doc.querySelectorAll('.right .section');
    if (rightSections[0]) {
      const h2 = rightSections[0].querySelector('h2');
      if (h2 && /^profile$/i.test(h2.textContent.trim())) {
        h2.textContent = 'My DNA';
        html = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      }
    }
  } else {
    // Node string-based replacement: the right column's first section's h2 is the first
    // occurrence of <h2>Profile</h2> that appears AFTER the <!-- RIGHT PANEL --> comment
    // or the <div class="right"> opening.
    const rightPanelMarker = html.indexOf('<div class="right">');
    if (rightPanelMarker !== -1) {
      const rightHalf = html.slice(rightPanelMarker);
      const updatedRightHalf = rightHalf.replace(/<h2>Profile<\/h2>/, '<h2>My DNA</h2>');
      html = html.slice(0, rightPanelMarker) + updatedRightHalf;
    } else {
      // Fallback: replace first occurrence that looks like the right-panel profile heading.
      // The right panel heading appears after all left-panel headings, so a targeted replace
      // of the second <h2>Profile</h2> is the safest approach.
      let count = 0;
      html = html.replace(/<h2>Profile<\/h2>/g, (match) => {
        count++;
        // First occurrence is the left sidebar "Profile" heading — keep it.
        // Second occurrence is the right panel "Profile" section — rename it.
        return count === 2 ? '<h2>My DNA</h2>' : match;
      });
    }
  }

  template.templateConfig.html = html;

  // --- 2. Update the templateSchema section title ---
  if (template.templateSchema?.sections) {
    template.templateSchema.sections = template.templateSchema.sections.map((section) => {
      if (section.title === 'Profile Section (Right)' || section.title === 'Profile') {
        return {
          ...section,
          title: 'My DNA',
          description: 'My DNA – core strengths and competency highlights (right panel)',
        };
      }
      return section;
    });
    template.markModified('templateSchema');
  }

  template.markModified('templateConfig');
  await template.save();

  console.log('✅ Updated SaarthiX Special 1:');
  console.log('   • HTML: right-panel <h2>Profile</h2> → <h2>My DNA</h2>');
  console.log('   • Schema: section title → "My DNA"');
  process.exit(0);
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
