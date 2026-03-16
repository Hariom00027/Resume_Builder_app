const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const t = await ResumeTemplate.findOne({ templateId: 'saarthix-special-1' });
  const html = t.templateConfig.html;
  
  console.log('Checking SaarthiX Template Data:');
  console.log('='.repeat(60));
  
  // Check if data is populated
  console.log('Has RICHARD:', html.includes('RICHARD'));
  console.log('Has HENDRICKS:', html.includes('HENDRICKS'));
  console.log('Has richard@piedpiper.com:', html.includes('richard@piedpiper.com'));
  console.log('Has Pied Piper:', html.includes('Pied Piper'));
  console.log('Has Entrepreneurial Mindset:', html.includes('Entrepreneurial Mindset'));
  console.log('Has Technical Leadership:', html.includes('Technical Leadership'));
  console.log('Has Innovation:', html.includes('Innovation'));
  console.log('Has varied content (not all "Led innovative startup"):', !html.match(/Led innovative startup/g) || html.match(/Led innovative startup/g).length < 3);
  
  // Check for placeholders
  const hasPlaceholders = html.includes('{{First name}}') || html.includes('{{last name}}') || 
                          html.includes('{{Capability}}') || html.includes('{{Character One}}');
  console.log('Has placeholders (should be NO):', hasPlaceholders);
  
  // Check LinkedIn link
  const linkedinMatch = html.match(/LinkedIn.*?linkedin\.com\/in\/richardhendricks/i);
  console.log('LinkedIn link correct:', linkedinMatch ? 'YES' : 'NO');
  
  // Check Contact section count
  const contactCount = (html.match(/<h2>Contact<\/h2>/g) || []).length;
  console.log('Contact sections:', contactCount, contactCount === 1 ? '(Correct)' : '(ERROR)');
  
  process.exit(0);
})();
