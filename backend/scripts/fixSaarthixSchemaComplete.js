/**
 * Complete fix for SaarthiX Special template schema
 * Based on actual HTML structure analysis
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

async function fixSaarthixSchemaComplete() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
    console.log('Connected to MongoDB');

    const template = await ResumeTemplate.findOne({ templateId: 'saarthix-special-1' });
    if (!template) {
      console.error('Template not found');
      process.exit(1);
    }

    console.log('Fixing schema for:', template.name);

    // Fixed schema with precise selectors based on actual HTML structure
    const fixedSchema = {
      sections: [
        {
          title: "Profile Image",
          selector: ".photo",
          type: "image",
          description: "Profile image section",
          isArray: false,
          fields: [
            {
              name: "profileImage",
              label: "Profile Image",
              type: "image",
              selector: ".photo img",
              required: false,
              placeholder: "",
              description: "Profile image"
            }
          ]
        },
        {
          title: "Contact Information",
          selector: ".contact",
          type: "contact",
          description: "Contact information in left sidebar",
          isArray: false,
          fields: [
            {
              name: "phone",
              label: "Phone Number",
              type: "tel",
              selector: ".contact p:nth-of-type(1)",
              required: false,
              placeholder: "(123) 456-7890",
              description: "Phone number - updates text after PHONE: label",
              updateStrategy: "afterBoldLabel" // Custom strategy
            },
            {
              name: "city",
              label: "City",
              type: "text",
              selector: ".contact p:nth-of-type(2)",
              required: false,
              placeholder: "City, State",
              description: "City - updates text after City: label",
              updateStrategy: "afterBoldLabel"
            },
            {
              name: "linkedin",
              label: "LinkedIn",
              type: "url",
              selector: ".contact p:nth-of-type(3) a",
              required: false,
              placeholder: "LinkedIn URL",
              description: "LinkedIn profile link"
            },
            {
              name: "email",
              label: "Email",
              type: "email",
              selector: ".contact p:nth-of-type(4)",
              required: false,
              placeholder: "email@example.com",
              description: "Email address - updates text after Email: label",
              updateStrategy: "afterBoldLabel"
            }
          ]
        },
        {
          title: "Name Header",
          selector: ".header",
          type: "contact",
          description: "Name and tagline in header",
          isArray: false,
          fields: [
            {
              name: "firstName",
              label: "First Name",
              type: "text",
              selector: ".first-name",
              required: true,
              placeholder: "FIRST",
              description: "First name"
            },
            {
              name: "lastName",
              label: "Last Name",
              type: "text",
              selector: ".last-name",
              required: true,
              placeholder: "LAST",
              description: "Last name"
            },
            {
              name: "tagline",
              label: "Tagline",
              type: "text",
              selector: ".tagline",
              required: false,
              placeholder: "Your Title",
              description: "Professional tagline"
            }
          ]
        },
        {
          title: "Profile Summary (Left)",
          selector: ".left",
          type: "summary",
          description: "Profile summary in left sidebar",
          isArray: false,
          fields: [
            {
              name: "profileSummary",
              label: "Profile Summary",
              type: "textarea",
              selector: ".left h2:first-of-type + p",
              required: false,
              placeholder: "",
              description: "Profile summary paragraph"
            }
          ]
        },
        {
          title: "Key Recognitions",
          selector: ".left",
          type: "awards",
          description: "Key recognitions list in left sidebar",
          isArray: false,
          fields: [
            {
              name: "recognitions",
              label: "Recognitions",
              type: "list",
              selector: ".left h2:nth-of-type(2) + ul",
              required: false,
              placeholder: "",
              description: "List of recognitions"
            }
          ]
        },
        {
          title: "Key Accomplishments",
          selector: ".left",
          type: "certifications",
          description: "Key accomplishments in left sidebar",
          isArray: false,
          fields: [
            {
              name: "accomplishments",
              label: "Accomplishments",
              type: "list",
              selector: ".left h2:last-of-type + p",
              required: false,
              placeholder: "",
              description: "Accomplishments - updates all p tags after the heading",
              updateStrategy: "multipleParagraphs"
            }
          ]
        },
        {
          title: "My DNA",
          selector: ".right .section:first-of-type",
          type: "summary",
          description: "My DNA – core strengths and competency highlights (right panel)",
          isArray: false,
          fields: [
            {
              name: "entrepreneurialMindset",
              label: "Entrepreneurial Mindset",
              type: "list",
              selector: ".right .section:first-of-type ul:first-of-type",
              required: false,
              placeholder: "",
              description: "Entrepreneurial mindset list"
            },
            {
              name: "technicalLeadership",
              label: "Technical Leadership",
              type: "list",
              selector: ".right .section:first-of-type ul:nth-of-type(2)",
              required: false,
              placeholder: "",
              description: "Technical leadership list"
            },
            {
              name: "innovation",
              label: "Innovation",
              type: "list",
              selector: ".right .section:first-of-type ul:nth-of-type(3)",
              required: false,
              placeholder: "",
              description: "Innovation list"
            }
          ]
        },
        {
          title: "Skills",
          selector: ".right .section:nth-of-type(2)",
          type: "skills",
          description: "Skills section",
          isArray: false,
          fields: [
            {
              name: "technicalSkills",
              label: "Technical Skills",
              type: "list",
              selector: ".right .section:nth-of-type(2) ul li:first-of-type",
              required: false,
              placeholder: "",
              description: "Technical skills - updates text after Technical: label",
              updateStrategy: "afterBoldLabel"
            },
            {
              name: "nonTechnicalSkills",
              label: "Non-Technical Skills",
              type: "list",
              selector: ".right .section:nth-of-type(2) ul li:last-of-type",
              required: false,
              placeholder: "",
              description: "Non-technical skills - updates text after Non-Technical: label",
              updateStrategy: "afterBoldLabel"
            }
          ]
        },
        {
          title: "Experience",
          selector: ".right .section:nth-of-type(3)",
          type: "experience",
          description: "Work experience entries",
          isArray: true,
          fields: [
            {
              name: "role",
              label: "Role/Title",
              type: "text",
              selector: "h3",
              required: false,
              placeholder: "Job Title",
              description: "Job role - updates the h3 element (contains role and company)",
              updateStrategy: "roleAndCompany"
            },
            {
              name: "company",
              label: "Company",
              type: "text",
              selector: "h3",
              required: false,
              placeholder: "Company Name",
              description: "Company name - part of h3 element",
              updateStrategy: "roleAndCompany"
            },
            {
              name: "date",
              label: "Date",
              type: "date",
              selector: ".date",
              required: false,
              placeholder: "2020 - 2024",
              description: "Employment dates"
            },
            {
              name: "responsibilities",
              label: "Responsibilities",
              type: "list",
              selector: "ul",
              required: false,
              placeholder: "",
              description: "Responsibilities list"
            }
          ]
        },
        {
          title: "Education",
          selector: ".right .section:last-of-type",
          type: "education",
          description: "Education entries",
          isArray: true,
          fields: [
            {
              name: "degree",
              label: "Degree",
              type: "text",
              selector: "h3",
              required: false,
              placeholder: "Degree",
              description: "Degree obtained"
            },
            {
              name: "institution",
              label: "Institution",
              type: "text",
              selector: "p:first-of-type",
              required: false,
              placeholder: "University Name",
              description: "Institution name"
            },
            {
              name: "dates",
              label: "Dates",
              type: "date",
              selector: "p:nth-of-type(2)",
              required: false,
              placeholder: "2020 - 2024",
              description: "Education dates"
            },
            {
              name: "gpa",
              label: "GPA",
              type: "text",
              selector: "p:last-of-type",
              required: false,
              placeholder: "3.8",
              description: "GPA"
            }
          ]
        }
      ],
      hasImage: true,
      imageSelector: ".photo img",
      layoutType: "two-column",
      notes: "Complete fix with precise selectors and update strategies for SaarthiX Special 1"
    };

    template.templateSchema = fixedSchema;
    await template.save();

    console.log('✅ Schema fixed successfully!');
    console.log(`   Sections: ${fixedSchema.sections.length}`);
    console.log(`   Total fields: ${fixedSchema.sections.reduce((sum, s) => sum + (s.fields?.length || 0), 0)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing schema:', error);
    process.exit(1);
  }
}

fixSaarthixSchemaComplete();
