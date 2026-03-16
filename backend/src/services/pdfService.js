const puppeteer = require('puppeteer');
const ResumeTemplate = require('../models/ResumeTemplate');

class PDFService {
  /**
   * Generate PDF from resume
   */
  async generatePDF(resume, template) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Render HTML from template
      const html = this.renderResumeHTML(resume, template);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      await browser.close();
      return pdf;
    } catch (error) {
      if (browser) await browser.close();
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Render resume HTML from template
   */
  renderResumeHTML(resume, template) {
    const originalHtml = template.templateConfig.html || '';
    const originalIsFullDocument = /<!doctype|<html[\s>]/i.test(originalHtml);
    let html = originalHtml;
    const css = template.templateConfig.css;

    // Prepare base data
    const data = {
      name: resume.personalInfo?.fullName || '',
      email: resume.personalInfo?.email || '',
      phone: resume.personalInfo?.phone || '',
      location: resume.personalInfo?.location || '',
      linkedin: resume.personalInfo?.linkedin || '',
      portfolio: resume.personalInfo?.portfolio || '',
      summary: resume.summary || '',
      experience: resume.experience || [],
      education: resume.education || [],
      skills: resume.skills || [],
      certifications: resume.certifications || [],
      projects: resume.projects || [],
      achievements: resume.achievements || [],
      hobbies: resume.hobbies || [],
      languages: resume.languages || []
    };

    // Replace simple variables first
    Object.keys(data).forEach(key => {
      if (typeof data[key] !== 'object' || !Array.isArray(data[key])) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        html = html.replace(regex, String(data[key] || ''));
      }
    });

    // Replace {{#if variable}}...{{/if}} blocks
    html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
      const value = data[key];
      if (value && (Array.isArray(value) ? value.length > 0 : value)) {
        return content;
      }
      return '';
    });

    // Replace {{#each array}}...{{/each}} blocks - this is the key part!
    html = html.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
      const items = data[key] || [];
      if (!Array.isArray(items) || items.length === 0) {
        return '';
      }
      
      return items.map((item) => {
        let itemContent = content;
        
        // Replace object properties within the loop
        if (typeof item === 'object') {
          Object.keys(item).forEach(prop => {
            // Handle nested {{#each achievements}} within experience items
            if (prop === 'achievements' && Array.isArray(item[prop])) {
              const achievementsPattern = /\{\{#each achievements\}\}([\s\S]*?)\{\{\/each\}\}/g;
              itemContent = itemContent.replace(achievementsPattern, (achMatch, achContent) => {
                return item[prop].map(ach => {
                  return achContent.replace(/\{\{this\}\}/g, String(ach || ''));
                }).join('');
              });
            } else {
              // Replace regular properties
              const propRegex = new RegExp(`\\{\\{${prop}\\}\\}`, 'g');
              let propValue = item[prop];
              
              // Handle boolean values like 'current'
              if (prop === 'current') {
                propValue = item[prop] ? 'Present' : (item.endDate || '');
              }
              
              itemContent = itemContent.replace(propRegex, String(propValue || ''));
            }
          });
        } else {
          // Replace {{this}} for simple arrays
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
        }
        
        return itemContent;
      }).join('');
    });

    // Apply custom colors
    if (resume.customization?.colors) {
      const colors = resume.customization.colors;
      html = html.replace(/\{\{primaryColor\}\}/g, colors.primary || '#000000');
      html = html.replace(/\{\{secondaryColor\}\}/g, colors.secondary || '#666666');
      html = html.replace(/\{\{accentColor\}\}/g, colors.accent || '#0066cc');
    }

    // Heuristic binding for imported/static HTML templates (hardcoded demo data)
    const bindStaticHtml = (doc) => {
      let out = doc;
      const { name, email, phone, location } = data;

      if (name) {
        out = out.replace(/(<title>)[\s\S]*?(<\/title>)/i, `$1${name}$2`);
        out = out.replace(/(<h1[^>]*(?:id|class)=['"][^'"]*name[^'"]*['"][^>]*>)[\s\S]*?(<\/h1>)/i, `$1${name}$2`);
        out = out.replace(/(<h1[^>]*id=['"]name['"][^>]*>)[\s\S]*?(<\/h1>)/i, `$1${name}$2`);
        out = out.replace(/(<h1\b[^>]*>)[\s\S]*?(<\/h1>)/i, `$1${name}$2`);
      }

      if (email) {
        out = out.replace(/(<a[^>]+href=['"]mailto:)[^'"]+(['"][^>]*>)([\s\S]*?)(<\/a>)/gi, `$1${email}$2${email}$4`);
        out = out.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, email);
      }

      if (phone) {
        out = out.replace(/(<a[^>]+href=['"]tel:)[^'"]+(['"][^>]*>)([\s\S]*?)(<\/a>)/gi, `$1${encodeURIComponent(phone)}$2${phone}$4`);
        out = out.replace(/\(\d{3}\)\s*\d{3}-\d{4}/g, phone);
      }

      if (location) {
        out = out.replace(/(<[^>]*class=['"][^'"]*location[^'"]*['"][^>]*>)[\s\S]*?(<\/[^>]+>)/i, `$1${location}$2`);
      }

      return out;
    };

    html = bindStaticHtml(html);

    if (originalIsFullDocument) {
      return html;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${css}
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
  }

  // These methods are no longer used - templates have their own HTML structure
  // Keeping them for backward compatibility but they won't be called
  renderExperience(experience) {
    return '';
  }

  renderEducation(education) {
    return '';
  }

  renderSkills(skills) {
    return '';
  }

  renderCertifications(certifications) {
    return '';
  }

  renderProjects(projects) {
    return '';
  }

  renderAchievements(achievements) {
    return '';
  }

  renderHobbies(hobbies) {
    return '';
  }

  renderLanguages(languages) {
    return '';
  }
}

module.exports = new PDFService();
