const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const t = await ResumeTemplate.findOne({ templateId: 'saarthix-special-1' });
  const html = t.templateConfig.html;
  
  console.log('SaarthiX data check:');
  console.log('Has Richard Hendricks:', html.includes('Richard Hendricks'));
  console.log('Has richard@piedpiper.com:', html.includes('richard@piedpiper.com'));
  console.log('Has Pied Piper:', html.includes('Pied Piper'));
  console.log('Has Bundelkhand:', html.includes('Bundelkhand'));
  console.log('Has CEO/President:', html.includes('CEO/President'));
  
  const firstNameMatch = html.match(/<div class="first-name">([^<]+)<\/div>/);
  const lastNameMatch = html.match(/<div class="last-name">([^<]+)<\/div>/);
  console.log('First name in HTML:', firstNameMatch ? firstNameMatch[1] : 'Not found');
  console.log('Last name in HTML:', lastNameMatch ? lastNameMatch[1] : 'Not found');
  
  process.exit(0);
})();
