const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

const DEFAULT_NAME = 'Richard Hendricks';
const DEFAULT_EMAIL = 'richard@piedpiper.com';

async function fixTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
    console.log('Connected to MongoDB\n');

    const elegant = await ResumeTemplate.findOne({ templateId: 'elegant' });
    const light = await ResumeTemplate.findOne({ templateId: 'light' });

    if (elegant) {
      let html = elegant.templateConfig.html;
      const originalHtml = html;
      
      // Try to inject name if missing
      if (!html.includes('Richard') || !html.includes('Hendricks')) {
        // Look for h1 or name elements
        html = html.replace(/<h1[^>]*>([^<]*)<\/h1>/i, (match, content) => {
          if (!content.includes('Richard')) {
            return match.replace(content, DEFAULT_NAME);
          }
          return match;
        });
        
        // Try name class
        html = html.replace(/<div[^>]*class=["'][^"']*name[^"']*["'][^>]*>([^<]*)<\/div>/i, (match, content) => {
          if (!content.includes('Richard')) {
            return match.replace(content, DEFAULT_NAME);
          }
          return match;
        });
      }
      
      if (html !== originalHtml) {
        elegant.templateConfig.html = html;
        await elegant.save();
        console.log('✓ Fixed Elegant template');
      }
    }

    if (light) {
      let html = light.templateConfig.html;
      const originalHtml = html;
      
      // Try to inject email if missing
      if (!html.includes(DEFAULT_EMAIL)) {
        // Look for mailto links
        html = html.replace(/<a[^>]*href=["']mailto:([^"']*)["'][^>]*>([^<]*)<\/a>/gi, (match, email, text) => {
          return match.replace(/mailto:[^"']*/gi, `mailto:${DEFAULT_EMAIL}`).replace(/>[^<]*</, `>${DEFAULT_EMAIL}<`);
        });
        
        // Try to find email in text
        html = html.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, DEFAULT_EMAIL);
      }
      
      if (html !== originalHtml) {
        light.templateConfig.html = html;
        await light.save();
        console.log('✓ Fixed Light template');
      }
    }

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixTemplates();
