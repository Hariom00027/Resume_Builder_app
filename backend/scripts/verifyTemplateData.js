/**
 * Verify template data
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

async function verifyTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
    console.log('Connected to MongoDB\n');

    const templates = await ResumeTemplate.find({});
    
    console.log('Template Verification Report:');
    console.log('='.repeat(60));
    
    templates.forEach(t => {
      const html = t.templateConfig.html || '';
      // Check for name - can be "Richard Hendricks" together or "Richard" and "Hendricks" separately
      const hasName = html.includes('Richard Hendricks') || 
                     (html.includes('Richard') && html.includes('Hendricks') && 
                      !html.includes('{{First name}}') && !html.includes('{{last name}}'));
      const hasEmail = html.includes('richard@piedpiper.com');
      
      const status = (hasName && hasEmail) ? '✓' : '✗';
      console.log(`${status} ${t.name.padEnd(30)} Name: ${hasName ? 'Yes' : 'No'}, Email: ${hasEmail ? 'Yes' : 'No'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyTemplates();
