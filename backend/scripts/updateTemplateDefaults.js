/**
 * Update all templates with default name and email
 * Also populate SaarthiX Special template with full resume data
 * 
 * Usage: node scripts/updateTemplateDefaults.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

// Default data
const DEFAULT_NAME = 'Richard Hendricks';
const DEFAULT_EMAIL = 'richard@piedpiper.com';
const DEFAULT_PHONE = '(123) 456-7890';
const DEFAULT_LOCATION = 'Palo Alto, CA';
const DEFAULT_LINKEDIN = 'linkedin.com/in/richardhendricks';

// Full resume data for SaarthiX template
const FULL_RESUME_DATA = {
  name: DEFAULT_NAME,
  firstName: 'Richard',
  lastName: 'Hendricks',
  email: DEFAULT_EMAIL,
  phone: DEFAULT_PHONE,
  location: DEFAULT_LOCATION,
  linkedin: DEFAULT_LINKEDIN,
  summary: 'Richard hails from Tulsa. He has earned degrees from the University of Oklahoma and Stanford. As a graduate student, he founded Pied Piper, a startup company that uses a data compression algorithm.',
  experience: [
    {
      role: 'CEO/President',
      company: 'Pied Piper, Palo Alto, CA',
      startDate: '2013',
      endDate: '2014',
      current: false,
      achievements: [
        'Founded Pied Piper, a startup company that uses a data compression algorithm',
        'Led the company through initial funding rounds',
        'Developed innovative compression technology'
      ]
    }
  ],
  education: [
    {
      degree: 'B.tech',
      institution: 'Bundelkhand University',
      startDate: '2022',
      endDate: '2023',
      gpa: '3.8'
    }
  ],
  skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Data Compression'],
  certifications: [],
  projects: [],
  achievements: ['Digital Compression Pioneer Award - Techcrunch, 2014']
};

// Function to replace placeholders in HTML
function replacePlaceholders(html, data) {
  let updated = html;
  let changed = false;
  
  // Replace name variations - be more aggressive
  const namePatterns = [
    /\{\{name\}\}/gi,
    /\{\{Name\}\}/gi,
    /\{\{NAME\}\}/gi,
    /\{\{First name\}\}/gi,
    /\{\{first name\}\}/gi,
    /\{\{First Name\}\}/gi,
    /\{\{last name\}\}/gi,
    /\{\{Last name\}\}/gi,
    /\{\{Last Name\}\}/gi,
    /\{\{fullName\}\}/gi,
    /\{\{full name\}\}/gi,
    /\{\{Full Name\}\}/gi
  ];
  
  namePatterns.forEach(pattern => {
    if (pattern.test(updated)) {
      updated = updated.replace(pattern, data.name || DEFAULT_NAME);
      changed = true;
    }
  });
  
  // Replace email variations - be more aggressive
  const emailPatterns = [
    /\{\{email\}\}/gi,
    /\{\{Email\}\}/gi,
    /\{\{EMAIL\}\}/gi,
    /\{\{abc@xyz\.com\}\}/gi,
    /\{\{.*@.*\}\}/gi,
    /\{\{[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\}\}/gi
  ];
  
  emailPatterns.forEach(pattern => {
    if (pattern.test(updated)) {
      updated = updated.replace(pattern, data.email || DEFAULT_EMAIL);
      changed = true;
    }
  });
  
  // Replace phone variations
  const phonePatterns = [
    /\{\{phone\}\}/gi,
    /\{\{Phone\}\}/gi,
    /\{\{XXXXXXXXXX\}\}/gi,
    /\{\{\+91 .*\}\}/gi
  ];
  
  phonePatterns.forEach(pattern => {
    if (pattern.test(updated)) {
      updated = updated.replace(pattern, data.phone || DEFAULT_PHONE);
      changed = true;
    }
  });
  
  // Replace location variations
  const locationPatterns = [
    /\{\{location\}\}/gi,
    /\{\{Location\}\}/gi,
    /\{\{abc\}\}/gi,
    /\{\{City:.*\}\}/gi,
    /\{\{city\}\}/gi
  ];
  
  locationPatterns.forEach(pattern => {
    if (pattern.test(updated)) {
      updated = updated.replace(pattern, data.location || DEFAULT_LOCATION);
      changed = true;
    }
  });
  
  // Replace LinkedIn
  const linkedinPatterns = [
    /\{\{link\}\}/gi,
    /\{\{Link\}\}/gi,
    /\{\{linkedin\}\}/gi,
    /\{\{LinkedIn\}\}/gi
  ];
  
  linkedinPatterns.forEach(pattern => {
    if (pattern.test(updated)) {
      updated = updated.replace(pattern, data.linkedin || DEFAULT_LINKEDIN);
      changed = true;
    }
  });
  
  // Replace summary
  if (data.summary) {
    const summaryPatterns = [
      /\{\{summary\}\}/gi,
      /\{\{Summary\}\}/gi,
      /\{\{About.*\}\}/gi
    ];
    
    summaryPatterns.forEach(pattern => {
      if (pattern.test(updated)) {
        updated = updated.replace(pattern, data.summary);
        changed = true;
      }
    });
  }
  
  return { html: updated, changed };
}

// Function to populate SaarthiX template with full data
function populateSaarthiXTemplate(html) {
  let updated = html;
  const data = FULL_RESUME_DATA;
  
  // Replace name - handle all variations
  updated = updated.replace(/\{\{First name\}\}/g, data.firstName);
  updated = updated.replace(/\{\{first name\}\}/gi, data.firstName);
  updated = updated.replace(/\{\{First Name\}\}/g, data.firstName);
  updated = updated.replace(/\{\{last name\}\}/g, data.lastName);
  updated = updated.replace(/\{\{Last name\}\}/g, data.lastName);
  updated = updated.replace(/\{\{Last Name\}\}/g, data.lastName);
  
  // Replace email - handle all variations
  updated = updated.replace(/\{\{abc@xyz\.com\}\}/gi, data.email);
  updated = updated.replace(/\{\{[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\}\}/gi, data.email);
  
  // Replace phone
  updated = updated.replace(/\{\{XXXXXXXXXX\}\}/g, data.phone);
  updated = updated.replace(/\{\{\+91 XXXXXXXXXX\}\}/gi, `+91 ${data.phone}`);
  
  // Replace location
  updated = updated.replace(/\{\{abc\}\}/g, data.location);
  updated = updated.replace(/\{\{City:\}\}/gi, data.location);
  
  // Replace LinkedIn
  updated = updated.replace(/\{\{link\}\}/gi, data.linkedin);
  
  // Replace summary
  updated = updated.replace(/\{\{About 25 words executive summary of student\}\}/gi, data.summary);
  updated = updated.replace(/\{\{About your current role or status\}\}/gi, 'CEO/President at Pied Piper');
  
  // Replace skills
  if (data.skills && data.skills.length > 0) {
    updated = updated.replace(/\{\{skills\}\}/gi, data.skills.join(', '));
  }
  
  // Replace experience - handle multiple entries
  if (data.experience && data.experience.length > 0) {
    // Replace first experience entry
    const exp = data.experience[0];
    const expMatches = updated.match(/Internship – \{\{Company Name, City\}\}/g);
    if (expMatches && expMatches.length > 0) {
      updated = updated.replace(/Internship – \{\{Company Name, City\}\}/, `Internship – ${exp.company || ''}`);
    }
    updated = updated.replace(/\{\{Company Name, City\}\}/g, exp.company || '');
    updated = updated.replace(/\{\{role\}\}/gi, exp.role || '');
    
    // Replace dates - handle multiple occurrences
    const dateMatches = updated.match(/\{\{DD\/MM\/YY\}\}/g);
    if (dateMatches) {
      dateMatches.forEach((match, idx) => {
        if (idx === 0) {
          updated = updated.replace(match, exp.startDate || '');
        } else if (idx === 1) {
          updated = updated.replace(match, exp.endDate || '');
        }
      });
    }
    
    if (exp.achievements && exp.achievements.length > 0) {
      updated = updated.replace(/\{\{Project description\}\}/gi, exp.achievements[0] || '');
      updated = updated.replace(/\{\{My role\}\}/gi, exp.achievements[1] || exp.achievements[0] || '');
      updated = updated.replace(/\{\{Key skills used\}\}/gi, exp.achievements[2] || data.skills?.join(', ') || '');
      updated = updated.replace(/\{\{Achievements\}\}/gi, exp.achievements[3] || exp.achievements[0] || '');
    }
  }
  
  // Replace education - handle multiple entries
  if (data.education && data.education.length > 0) {
    const edu = data.education[0];
    updated = updated.replace(/\{\{Graduation Degree\}\}/gi, edu.degree || '');
    updated = updated.replace(/\{\{College Name, City\}\}/gi, edu.institution || '');
    
    // Replace dates for education
    const eduDateMatches = updated.match(/\{\{MM\/YY\}\}/g);
    if (eduDateMatches) {
      eduDateMatches.forEach((match, idx) => {
        if (idx === 0) {
          updated = updated.replace(match, edu.startDate || '');
        } else if (idx === 1) {
          updated = updated.replace(match, edu.endDate || '');
        }
      });
    }
    
    updated = updated.replace(/\{\{CGPA\}\}/gi, edu.gpa || '');
    
    // Replace XII and X placeholders if we have more education entries
    if (data.education.length > 1) {
      const edu2 = data.education[1];
      updated = updated.replace(/\{\{XII\}\}/gi, edu2.degree || 'XII');
      updated = updated.replace(/\{\{School Name\}\}/gi, edu2.institution || '');
    }
    if (data.education.length > 2) {
      const edu3 = data.education[2];
      updated = updated.replace(/\{\{X\}\}/gi, edu3.degree || 'X');
    }
  }
  
  // Replace achievements and recognitions
  if (data.achievements && data.achievements.length > 0) {
    updated = updated.replace(/\{\{One\}\}/gi, data.achievements[0] || '');
    updated = updated.replace(/\{\{Two\}\}/gi, data.achievements[0] || '');
    updated = updated.replace(/\{\{Three\}\}/gi, data.achievements[0] || '');
    updated = updated.replace(/\{\{25 words accomplishment\}\}/gi, data.achievements[0] || '');
    
    // Replace character placeholders
    updated = updated.replace(/\{\{Character One\}\}/gi, 'Entrepreneurial Mindset');
    updated = updated.replace(/\{\{Character Two\}\}/gi, 'Technical Leadership');
    updated = updated.replace(/\{\{Character Three\}\}/gi, 'Innovation');
    updated = updated.replace(/\{\{Capability\}\}/gi, 'Led innovative startup');
  }
  
  return updated;
}

async function updateTemplates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
    console.log('Connected to MongoDB');

    // Get all templates
    const templates = await ResumeTemplate.find({});
    console.log(`Found ${templates.length} templates to update\n`);

    let updatedCount = 0;
    let saarthixUpdated = false;

    for (const template of templates) {
      let html = template.templateConfig?.html || '';
      let updated = false;

      if (!html) {
        console.log(`⚠ Skipping ${template.name} - no HTML content`);
        continue;
      }

      // Check if this is SaarthiX Special template
      if (template.templateId === 'saarthix-special-1') {
        const originalHtml = html;
        html = populateSaarthiXTemplate(html);
        if (html !== originalHtml) {
          updated = true;
          saarthixUpdated = true;
          console.log(`✓ Updated SaarthiX Special 1 with full resume data`);
        }
      } else {
        // For other templates, update name and email
        const result = replacePlaceholders(html, {
          name: DEFAULT_NAME,
          firstName: 'Richard',
          lastName: 'Hendricks',
          email: DEFAULT_EMAIL,
          phone: DEFAULT_PHONE,
          location: DEFAULT_LOCATION,
          linkedin: DEFAULT_LINKEDIN
        });
        
        let finalHtml = result.html;
        let wasChanged = result.changed;
        
        // If no placeholders were found, try to inject data directly into HTML structure
        if (!wasChanged) {
          // Try to find and replace name in common HTML patterns
          const namePatterns = [
            /<h1[^>]*>([^<]*)<\/h1>/i,
            /<h2[^>]*>([^<]*)<\/h2>/i,
            /<div[^>]*class=["'][^"']*name[^"']*["'][^>]*>([^<]*)<\/div>/i,
            /<span[^>]*class=["'][^"']*name[^"']*["'][^>]*>([^<]*)<\/span>/i
          ];
          
          for (const pattern of namePatterns) {
            const match = finalHtml.match(pattern);
            if (match && match[1] && !match[1].includes('Richard') && !match[1].includes('{{')) {
              finalHtml = finalHtml.replace(pattern, (fullMatch, content) => {
                return fullMatch.replace(content, DEFAULT_NAME);
              });
              wasChanged = true;
              break;
            }
          }
          
          // Try to find and replace email in mailto links or text
          // First check if email already exists
          if (!finalHtml.includes(DEFAULT_EMAIL)) {
            // Try mailto links
            const mailtoPattern = /<a[^>]*href=["']mailto:([^"']*)["'][^>]*>([^<]*)<\/a>/gi;
            if (mailtoPattern.test(finalHtml)) {
              finalHtml = finalHtml.replace(mailtoPattern, (match, email, linkText) => {
                return match.replace(/mailto:[^"']*/gi, `mailto:${DEFAULT_EMAIL}`).replace(/>[^<]*</, `>${DEFAULT_EMAIL}<`);
              });
              wasChanged = true;
            } else {
              // Try to find email in text nodes
              const emailInTextPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
              if (emailInTextPattern.test(finalHtml)) {
                finalHtml = finalHtml.replace(emailInTextPattern, DEFAULT_EMAIL);
                wasChanged = true;
              } else {
                // Try to inject email near contact info
                const contactPattern = /(<div[^>]*class=["'][^"']*contact[^"']*["'][^>]*>)/i;
                const emailPattern = /(<span[^>]*>.*?<\/span>)/i;
                if (contactPattern.test(finalHtml)) {
                  finalHtml = finalHtml.replace(contactPattern, (match) => {
                    return match + `<span>${DEFAULT_EMAIL}</span>`;
                  });
                  wasChanged = true;
                }
              }
            }
          }
        }
        
        if (wasChanged) {
          html = finalHtml;
          updated = true;
        }
      }

      if (updated) {
        template.templateConfig.html = html;
        await template.save();
        updatedCount++;
        if (template.templateId !== 'saarthix-special-1') {
          console.log(`✓ Updated ${template.name} (${template.templateId})`);
        }
      } else {
        console.log(`- No changes needed for ${template.name} (${template.templateId})`);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} templates`);
    if (saarthixUpdated) {
      console.log(`✅ SaarthiX Special template populated with full resume data`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error updating templates:', error);
    process.exit(1);
  }
}

updateTemplates();
