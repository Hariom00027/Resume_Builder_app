const mongoose = require('mongoose');

const PersonalInfoSchema = new mongoose.Schema({
  fullName: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  portfolio: { type: String, default: '' },
  profileImage: { type: String, default: '' }
});

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  role: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  current: { type: Boolean, default: false },
  achievements: [{ type: String }],
  description: { type: String, default: '' }
});

const EducationSchema = new mongoose.Schema({
  degree: { type: String, default: '' },
  institution: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  gpa: { type: String, default: '' },
  honors: { type: String, default: '' },
  description: { type: String, default: '' }
});

const CertificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  date: { type: String, default: '' },
  url: { type: String, default: '' }
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  description: { type: String, default: '' },
  technologies: [{ type: String }],
  url: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' }
});

const LanguageSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  proficiency: { type: String, default: '' }
});

const CustomSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  items: [{ type: String }]
});

const ColorsSchema = new mongoose.Schema({
  primary: { type: String, default: '#000000' },
  secondary: { type: String, default: '#666666' },
  accent: { type: String, default: '#0066cc' },
  text: { type: String, default: '#000000' }
});

const TypographySchema = new mongoose.Schema({
  fontSize: { type: String, default: '14px' },
  fontSpacing: { type: String, default: '1.5' },
  sectionSpacing: { type: String, default: '20px' },
  fontFamilyTitle: { type: String, default: 'Arial, sans-serif' },
  fontFamilyText: { type: String, default: 'Arial, sans-serif' },
  fontFamilySubheading: { type: String, default: 'Arial, sans-serif' }
});

const ResumeSchema = new mongoose.Schema({
  title: { type: String, default: 'My Resume' },
  templateId: { type: String, required: true },
  
  // Resume Data
  personalInfo: { type: PersonalInfoSchema, default: {} },
  summary: { type: String, default: '' },
  experience: [ExperienceSchema],
  education: [EducationSchema],
  skills: [{ type: String }],
  certifications: [CertificationSchema],
  projects: [ProjectSchema],
  achievements: [{ type: String }],
  hobbies: [{ type: String }],
  languages: [LanguageSchema],
  customSections: [CustomSectionSchema],

  /**
   * Template-driven overrides:
   * Key: CSS selector in the template document (e.g. "#employment", ".summary-section .summary")
   * Value: HTML string to replace element.innerHTML
   */
  templateOverrides: { type: Map, of: String, default: {} },
  
  // Customization
  customization: {
    colors: { type: ColorsSchema, default: {} },
    typography: { type: TypographySchema, default: {} },
    sectionOrder: [{ type: String }],
    sectionTitles: { type: Map, of: String, default: {} }
  },
  
  // Metadata
  atsScore: { type: Number, default: null },
  lastModified: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ResumeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resume', ResumeSchema);
