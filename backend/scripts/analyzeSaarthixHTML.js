/**
 * Analyze the HTML structure of SaarthiX Special template
 * to understand the exact structure for fixing selectors
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');
const fs = require('fs');

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const template = await ResumeTemplate.findOne({ templateId: 'saarthix-special-1' });
  
  const html = template.templateConfig.html;
  
  // Extract and analyze different sections
  console.log('=== ANALYZING SAARTHIX SPECIAL TEMPLATE HTML ===\n');
  
  // Contact section
  const contactMatch = html.match(/<div class="contact">[\s\S]*?<\/div>/);
  if (contactMatch) {
    console.log('=== CONTACT SECTION ===');
    console.log(contactMatch[0]);
    console.log('\n');
  }
  
  // Left sidebar sections
  const leftMatch = html.match(/<div class="left">[\s\S]*?<\/div>/);
  if (leftMatch) {
    console.log('=== LEFT SIDEBAR ===');
    console.log(leftMatch[0].substring(0, 2000));
    console.log('\n');
  }
  
  // Right sections
  const rightMatch = html.match(/<div class="right">[\s\S]*?<\/div>/);
  if (rightMatch) {
    console.log('=== RIGHT SECTION ===');
    const rightHTML = rightMatch[0];
    
    // Extract experience section
    const expMatch = rightHTML.match(/<div class="section">[\s\S]*?<h2>Experience<\/h2>[\s\S]*?<\/div>/);
    if (expMatch) {
      console.log('=== EXPERIENCE SECTION ===');
      console.log(expMatch[0].substring(0, 1500));
      console.log('\n');
    }
    
    // Extract education section
    const eduMatch = rightHTML.match(/<div class="section">[\s\S]*?<h2>Education<\/h2>[\s\S]*?<\/div>/);
    if (eduMatch) {
      console.log('=== EDUCATION SECTION ===');
      console.log(eduMatch[0].substring(0, 1000));
      console.log('\n');
    }
    
    // Extract skills section
    const skillsMatch = rightHTML.match(/<div class="section">[\s\S]*?<h2>Skills<\/h2>[\s\S]*?<\/div>/);
    if (skillsMatch) {
      console.log('=== SKILLS SECTION ===');
      console.log(skillsMatch[0].substring(0, 800));
      console.log('\n');
    }
    
    // Extract profile section
    const profileMatch = rightHTML.match(/<div class="section">[\s\S]*?<h2>Profile<\/h2>[\s\S]*?<\/div>/);
    if (profileMatch) {
      console.log('=== PROFILE SECTION (RIGHT) ===');
      console.log(profileMatch[0].substring(0, 1500));
      console.log('\n');
    }
  }
  
  // Save full HTML to file for easier analysis
  fs.writeFileSync('saarthix-html-analysis.html', html);
  console.log('Full HTML saved to saarthix-html-analysis.html');
  
  process.exit(0);
})();
