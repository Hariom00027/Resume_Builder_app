/**
 * Template Seeding Script
 * 
 * This script seeds the database with 5 beautiful, distinct resume templates.
 * 
 * Usage: node scripts/seedTemplates.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ResumeTemplate = require('../src/models/ResumeTemplate');

dotenv.config();

// 5 Beautifully Different Resume Templates
const templates = [
  {
    templateId: 'santiago',
    name: 'Traditional',
    category: 'professional',
    description: 'Classic and elegant resume template with serif typography - perfect for conservative industries',
    previewImage: '/templates/santiago-preview.png',
    thumbnailImage: '/templates/santiago-thumb.png',
    templateConfig: {
      html: `
        <div class="resume traditional">
          <header class="header">
            <h1 class="name">{{name}}</h1>
            <div class="contact-info">
              <span>{{email}}</span> • <span>{{phone}}</span> • <span>{{location}}</span>
              {{#if linkedin}}<span> • <a href="{{linkedin}}">LinkedIn</a></span>{{/if}}
            </div>
          </header>
          
          {{#if summary}}
          <section class="section">
            <h2 class="section-title">Professional Summary</h2>
            <p class="summary-text">{{summary}}</p>
          </section>
          {{/if}}
          
          {{#if experience}}
          <section class="section">
            <h2 class="section-title">Professional Experience</h2>
            {{#each experience}}
            <div class="experience-item">
              <div class="exp-header">
                <h3 class="job-title">{{role}}</h3>
                <span class="exp-meta">{{company}} | {{startDate}} - {{#if current}}Present{{else}}{{endDate}}{{/if}}</span>
              </div>
              <ul class="achievements">
                {{#each achievements}}
                <li>{{this}}</li>
                {{/each}}
              </ul>
            </div>
            {{/each}}
          </section>
          {{/if}}
          
          {{#if education}}
          <section class="section">
            <h2 class="section-title">Education</h2>
            {{#each education}}
            <div class="education-item">
              <h3 class="degree">{{degree}}</h3>
              <p class="edu-meta">{{institution}}{{#if gpa}} • GPA: {{gpa}}{{/if}} • {{startDate}} - {{endDate}}</p>
            </div>
            {{/each}}
          </section>
          {{/if}}
          
          {{#if skills}}
          <section class="section">
            <h2 class="section-title">Skills</h2>
            <p class="skills-text">{{#each skills}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</p>
          </section>
          {{/if}}
          
          {{#if certifications}}
          <section class="section">
            <h2 class="section-title">Certifications</h2>
            {{#each certifications}}
            <p class="cert-item"><strong>{{name}}</strong> - {{issuer}}{{#if date}} ({{date}}){{/if}}</p>
            {{/each}}
          </section>
          {{/if}}
        </div>
      `,
      css: `
        .resume.traditional {
          font-family: 'Georgia', 'Times New Roman', serif;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.75in;
          color: #1a1a1a;
          line-height: 1.7;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 3px double #000;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .name {
          font-size: 32px;
          font-weight: normal;
          margin: 0 0 12px 0;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #000;
        }
        .contact-info {
          font-size: 11px;
          color: #333;
          letter-spacing: 0.5px;
        }
        .contact-info a {
          color: #000;
          text-decoration: none;
        }
        .section {
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 16px;
          font-weight: normal;
          text-transform: uppercase;
          letter-spacing: 3px;
          border-bottom: 1px solid #000;
          padding-bottom: 6px;
          margin-bottom: 16px;
          color: #000;
        }
        .experience-item {
          margin-bottom: 22px;
        }
        .exp-header {
          margin-bottom: 8px;
        }
        .job-title {
          font-size: 14px;
          font-weight: bold;
          font-style: italic;
          margin: 0 0 4px 0;
          color: #000;
        }
        .exp-meta {
          font-size: 11px;
          color: #666;
          font-style: italic;
        }
        .achievements {
          margin: 10px 0 0 25px;
          padding: 0;
        }
        .achievements li {
          margin-bottom: 6px;
          font-size: 11px;
          color: #333;
        }
        .education-item {
          margin-bottom: 18px;
        }
        .degree {
          font-size: 13px;
          font-weight: bold;
          margin: 0 0 4px 0;
          color: #000;
        }
        .edu-meta {
          font-size: 11px;
          color: #666;
          margin: 0;
        }
        .skills-text {
          font-size: 11px;
          color: #333;
          margin: 0;
        }
        .summary-text {
          font-size: 11px;
          text-align: justify;
          color: #333;
          margin: 0;
          line-height: 1.8;
        }
        .cert-item {
          font-size: 11px;
          margin-bottom: 8px;
          color: #333;
        }
      `,
      sections: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'certifications'],
      layout: 'single-column',
      colors: { primary: '#000000', secondary: '#666666' }
    },
    isPremium: false,
    isActive: true
  },
  {
    templateId: 'dublin',
    name: 'Professional',
    category: 'professional',
    description: 'Modern professional design with clean lines and blue accents - ideal for corporate roles',
    previewImage: '/templates/dublin-preview.png',
    thumbnailImage: '/templates/dublin-thumb.png',
    templateConfig: {
      html: `
        <div class="resume professional">
          <header class="header">
            <div class="header-content">
              <h1 class="name">{{name}}</h1>
              <div class="contact-info">
                <div class="contact-item"><span class="icon">📧</span>{{email}}</div>
                <div class="contact-item"><span class="icon">📱</span>{{phone}}</div>
                <div class="contact-item"><span class="icon">📍</span>{{location}}</div>
                {{#if linkedin}}<div class="contact-item"><span class="icon">💼</span><a href="{{linkedin}}">LinkedIn</a></div>{{/if}}
              </div>
            </div>
          </header>
          
          {{#if summary}}
          <section class="section">
            <h2 class="section-title"><span class="title-bar"></span>Summary</h2>
            <p class="summary-text">{{summary}}</p>
          </section>
          {{/if}}
          
          {{#if experience}}
          <section class="section">
            <h2 class="section-title"><span class="title-bar"></span>Experience</h2>
            {{#each experience}}
            <div class="experience-item">
              <div class="exp-left">
                <h3 class="job-title">{{role}}</h3>
                <p class="company">{{company}}</p>
              </div>
              <div class="exp-right">
                <span class="date">{{startDate}} - {{#if current}}Present{{else}}{{endDate}}{{/if}}</span>
                <ul class="achievements">
                  {{#each achievements}}
                  <li>{{this}}</li>
                  {{/each}}
                </ul>
              </div>
            </div>
            {{/each}}
          </section>
          {{/if}}
          
          {{#if education}}
          <section class="section">
            <h2 class="section-title"><span class="title-bar"></span>Education</h2>
            {{#each education}}
            <div class="education-item">
              <div class="edu-left">
                <h3 class="degree">{{degree}}</h3>
                <p class="institution">{{institution}}</p>
              </div>
              <div class="edu-right">
                <span class="date">{{startDate}} - {{endDate}}</span>
                {{#if gpa}}<span class="gpa">GPA: {{gpa}}</span>{{/if}}
              </div>
            </div>
            {{/each}}
          </section>
          {{/if}}
          
          {{#if skills}}
          <section class="section">
            <h2 class="section-title"><span class="title-bar"></span>Skills</h2>
            <div class="skills-grid">
              {{#each skills}}
              <div class="skill-badge">{{this}}</div>
              {{/each}}
            </div>
          </section>
          {{/if}}
        </div>
      `,
      css: `
        .resume.professional {
          font-family: 'Segoe UI', 'Arial', sans-serif;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.6in;
          color: #2c3e50;
          line-height: 1.6;
          background: #fff;
        }
        .header {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
          padding: 30px;
          margin: -0.6in -0.6in 30px -0.6in;
          border-radius: 0;
        }
        .name {
          font-size: 36px;
          font-weight: 600;
          margin: 0 0 15px 0;
          color: white;
          letter-spacing: -0.5px;
        }
        .contact-info {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 12px;
        }
        .contact-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .icon {
          font-size: 14px;
        }
        .contact-item a {
          color: white;
          text-decoration: none;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .title-bar {
          width: 4px;
          height: 20px;
          background: #3498db;
          display: inline-block;
        }
        .experience-item {
          display: flex;
          gap: 20px;
          margin-bottom: 25px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ecf0f1;
        }
        .exp-left {
          flex: 0 0 200px;
        }
        .exp-right {
          flex: 1;
        }
        .job-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 5px 0;
          color: #2c3e50;
        }
        .company {
          font-size: 13px;
          color: #3498db;
          margin: 0;
          font-weight: 500;
        }
        .date {
          font-size: 12px;
          color: #7f8c8d;
          font-weight: 500;
          display: block;
          margin-bottom: 10px;
        }
        .achievements {
          margin: 0;
          padding-left: 20px;
        }
        .achievements li {
          margin-bottom: 6px;
          font-size: 12px;
          color: #34495e;
        }
        .education-item {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        .edu-left {
          flex: 0 0 200px;
        }
        .edu-right {
          flex: 1;
        }
        .degree {
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #2c3e50;
        }
        .institution {
          font-size: 13px;
          color: #7f8c8d;
          margin: 0;
        }
        .gpa {
          font-size: 12px;
          color: #3498db;
          font-weight: 500;
          display: block;
          margin-top: 4px;
        }
        .skills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .skill-badge {
          background: #ecf0f1;
          color: #2c3e50;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #bdc3c7;
        }
        .summary-text {
          font-size: 13px;
          color: #34495e;
          margin: 0;
          line-height: 1.7;
        }
      `,
      sections: ['personalInfo', 'summary', 'experience', 'education', 'skills'],
      layout: 'single-column',
      colors: { primary: '#3498db', secondary: '#2c3e50' }
    },
    isPremium: false,
    isActive: true
  },
  {
    templateId: 'helsinki',
    name: 'Prime ATS',
    category: 'ats',
    description: 'Ultra-clean ATS-optimized template with maximum compatibility - perfect for automated systems',
    previewImage: '/templates/helsinki-preview.png',
    thumbnailImage: '/templates/helsinki-thumb.png',
    templateConfig: {
      html: `
        <div class="resume ats">
          <header class="header">
            <h1 class="name">{{name}}</h1>
            <div class="contact-info">
              {{email}} | {{phone}} | {{location}}{{#if linkedin}} | LinkedIn: {{linkedin}}{{/if}}
            </div>
          </header>
          
          {{#if summary}}
          <section class="section">
            <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
            <p class="summary-text">{{summary}}</p>
          </section>
          {{/if}}
          
          {{#if experience}}
          <section class="section">
            <h2 class="section-title">PROFESSIONAL EXPERIENCE</h2>
            {{#each experience}}
            <div class="experience-item">
              <div class="exp-line">
                <strong>{{role}}</strong> | {{company}} | {{startDate}} - {{#if current}}Present{{else}}{{endDate}}{{/if}}
              </div>
              <ul class="achievements">
                {{#each achievements}}
                <li>{{this}}</li>
                {{/each}}
              </ul>
            </div>
            {{/each}}
          </section>
          {{/if}}
          
          {{#if education}}
          <section class="section">
            <h2 class="section-title">EDUCATION</h2>
            {{#each education}}
            <div class="education-item">
              <strong>{{degree}}</strong> | {{institution}} | {{startDate}} - {{endDate}}{{#if gpa}} | GPA: {{gpa}}{{/if}}
            </div>
            {{/each}}
          </section>
          {{/if}}
          
          {{#if skills}}
          <section class="section">
            <h2 class="section-title">SKILLS</h2>
            <p class="skills-text">{{#each skills}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}</p>
          </section>
          {{/if}}
          
          {{#if certifications}}
          <section class="section">
            <h2 class="section-title">CERTIFICATIONS</h2>
            {{#each certifications}}
            <div class="cert-item">{{name}} - {{issuer}}{{#if date}} ({{date}}){{/if}}</div>
            {{/each}}
          </section>
          {{/if}}
        </div>
      `,
      css: `
        .resume.ats {
          font-family: Arial, Helvetica, sans-serif;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
          color: #000;
          line-height: 1.5;
          font-size: 11pt;
          background: #fff;
        }
        .header {
          margin-bottom: 20px;
          text-align: center;
        }
        .name {
          font-size: 20pt;
          font-weight: bold;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          color: #000;
        }
        .contact-info {
          font-size: 10pt;
          color: #000;
        }
        .section {
          margin-bottom: 18px;
        }
        .section-title {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 10px;
          color: #000;
          border-bottom: 2px solid #000;
          padding-bottom: 3px;
        }
        .experience-item {
          margin-bottom: 15px;
        }
        .exp-line {
          font-size: 11pt;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .achievements {
          margin: 8px 0 0 25px;
          padding: 0;
        }
        .achievements li {
          margin-bottom: 4px;
          font-size: 10pt;
          color: #000;
        }
        .education-item {
          font-size: 10pt;
          margin-bottom: 10px;
        }
        .skills-text {
          font-size: 10pt;
          color: #000;
          margin: 0;
        }
        .summary-text {
          font-size: 10pt;
          margin: 0;
          color: #000;
          text-align: left;
        }
        .cert-item {
          font-size: 10pt;
          margin-bottom: 6px;
          color: #000;
        }
      `,
      sections: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'certifications'],
      layout: 'single-column',
      colors: { primary: '#000000', secondary: '#000000' }
    },
    isPremium: false,
    isActive: true
  },
  {
    templateId: 'tokyo',
    name: 'Modern',
    category: 'modern',
    description: 'Contemporary design with vibrant colors and modern typography - perfect for creative and tech roles',
    previewImage: '/templates/tokyo-preview.png',
    thumbnailImage: '/templates/tokyo-thumb.png',
    templateConfig: {
      html: `
        <div class="resume modern">
          <header class="header">
            <div class="header-left">
              <h1 class="name">{{name}}</h1>
              <div class="contact-info">
                <span class="contact-badge">📧 {{email}}</span>
                <span class="contact-badge">📱 {{phone}}</span>
                <span class="contact-badge">📍 {{location}}</span>
                {{#if linkedin}}<span class="contact-badge">💼 <a href="{{linkedin}}">LinkedIn</a></span>{{/if}}
              </div>
            </div>
          </header>
          
          {{#if summary}}
          <section class="section">
            <h2 class="section-title">
              <span class="title-icon">✨</span>
              About
            </h2>
            <p class="summary-text">{{summary}}</p>
          </section>
          {{/if}}
          
          {{#if experience}}
          <section class="section">
            <h2 class="section-title">
              <span class="title-icon">💼</span>
              Experience
            </h2>
            {{#each experience}}
            <div class="experience-item">
              <div class="exp-timeline">
                <div class="timeline-dot"></div>
                <div class="timeline-line"></div>
              </div>
              <div class="exp-content">
                <h3 class="job-title">{{role}}</h3>
                <p class="company">{{company}}</p>
                <span class="date">{{startDate}} - {{#if current}}Present{{else}}{{endDate}}{{/if}}</span>
                <ul class="achievements">
                  {{#each achievements}}
                  <li>{{this}}</li>
                  {{/each}}
                </ul>
              </div>
            </div>
            {{/each}}
          </section>
          {{/if}}
          
          {{#if education}}
          <section class="section">
            <h2 class="section-title">
              <span class="title-icon">🎓</span>
              Education
            </h2>
            {{#each education}}
            <div class="education-item">
              <h3 class="degree">{{degree}}</h3>
              <p class="institution">{{institution}}</p>
              <span class="date">{{startDate}} - {{endDate}}</span>
              {{#if gpa}}<span class="gpa-badge">GPA: {{gpa}}</span>{{/if}}
            </div>
            {{/each}}
          </section>
          {{/if}}
          
          {{#if skills}}
          <section class="section">
            <h2 class="section-title">
              <span class="title-icon">🚀</span>
              Skills
            </h2>
            <div class="skills-container">
              {{#each skills}}
              <div class="skill-pill">{{this}}</div>
              {{/each}}
            </div>
          </section>
          {{/if}}
        </div>
      `,
      css: `
        .resume.modern {
          font-family: 'Inter', 'Segoe UI', sans-serif;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.7in;
          color: #1a1a1a;
          line-height: 1.6;
          background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 35px;
          margin: -0.7in -0.7in 35px -0.7in;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .name {
          font-size: 38px;
          font-weight: 700;
          margin: 0 0 20px 0;
          color: white;
          letter-spacing: -1px;
        }
        .contact-info {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .contact-badge {
          background: rgba(255,255,255,0.2);
          color: white;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 11px;
          backdrop-filter: blur(10px);
        }
        .contact-badge a {
          color: white;
          text-decoration: none;
        }
        .section {
          margin-bottom: 35px;
          background: white;
          padding: 25px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .section-title {
          font-size: 22px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .title-icon {
          font-size: 24px;
        }
        .experience-item {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          position: relative;
        }
        .exp-timeline {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .timeline-dot {
          width: 12px;
          height: 12px;
          background: #667eea;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 2px #667eea;
        }
        .timeline-line {
          width: 2px;
          flex: 1;
          background: #e0e0e0;
          margin-top: 5px;
        }
        .exp-content {
          flex: 1;
        }
        .job-title {
          font-size: 17px;
          font-weight: 600;
          margin: 0 0 5px 0;
          color: #1a1a1a;
        }
        .company {
          font-size: 14px;
          color: #667eea;
          margin: 0 0 8px 0;
          font-weight: 500;
        }
        .date {
          font-size: 12px;
          color: #888;
          display: block;
          margin-bottom: 12px;
        }
        .achievements {
          margin: 0;
          padding-left: 20px;
        }
        .achievements li {
          margin-bottom: 8px;
          font-size: 13px;
          color: #444;
        }
        .education-item {
          background: #f8f9fa;
          padding: 18px;
          border-radius: 6px;
          margin-bottom: 15px;
          border-left: 4px solid #667eea;
        }
        .degree {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 5px 0;
          color: #1a1a1a;
        }
        .institution {
          font-size: 13px;
          color: #666;
          margin: 0 0 5px 0;
        }
        .gpa-badge {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-top: 5px;
        }
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .skill-pill {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 10px 18px;
          border-radius: 25px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(102,126,234,0.3);
        }
        .summary-text {
          font-size: 13px;
          color: #444;
          margin: 0;
          line-height: 1.8;
        }
      `,
      sections: ['personalInfo', 'summary', 'experience', 'education', 'skills'],
      layout: 'single-column',
      colors: { primary: '#667eea', secondary: '#764ba2' }
    },
    isPremium: false,
    isActive: true
  },
  {
    templateId: 'brussels',
    name: 'Two Column ATS',
    category: 'ats',
    description: 'Two-column layout with colored sidebar - combines visual appeal with ATS compatibility',
    previewImage: '/templates/brussels-preview.png',
    thumbnailImage: '/templates/brussels-thumb.png',
    templateConfig: {
      html: `
        <div class="resume two-column">
          <div class="left-column">
            <header class="header">
              <h1 class="name">{{name}}</h1>
              <div class="contact-info">
                <div class="contact-line">{{email}}</div>
                <div class="contact-line">{{phone}}</div>
                <div class="contact-line">{{location}}</div>
                {{#if linkedin}}<div class="contact-line"><a href="{{linkedin}}">LinkedIn Profile</a></div>{{/if}}
              </div>
            </header>
            
            {{#if skills}}
            <section class="section">
              <h2 class="section-title">SKILLS</h2>
              <div class="skills-list">
                {{#each skills}}
                <div class="skill-item">{{this}}</div>
                {{/each}}
              </div>
            </section>
            {{/if}}
            
            {{#if education}}
            <section class="section">
              <h2 class="section-title">EDUCATION</h2>
              {{#each education}}
              <div class="education-item">
                <h3 class="degree">{{degree}}</h3>
                <p class="institution">{{institution}}</p>
                <p class="date">{{startDate}} - {{endDate}}</p>
                {{#if gpa}}<p class="gpa">GPA: {{gpa}}</p>{{/if}}
              </div>
              {{/each}}
            </section>
            {{/if}}
            
            {{#if certifications}}
            <section class="section">
              <h2 class="section-title">CERTIFICATIONS</h2>
              {{#each certifications}}
              <div class="cert-item">
                <strong>{{name}}</strong><br>
                {{issuer}}{{#if date}}<br>{{date}}{{/if}}
              </div>
              {{/each}}
            </section>
            {{/if}}
          </div>
          
          <div class="right-column">
            {{#if summary}}
            <section class="section">
              <h2 class="section-title">PROFESSIONAL SUMMARY</h2>
              <p class="summary-text">{{summary}}</p>
            </section>
            {{/if}}
            
            {{#if experience}}
            <section class="section">
              <h2 class="section-title">EXPERIENCE</h2>
              {{#each experience}}
              <div class="experience-item">
                <h3 class="job-title">{{role}}</h3>
                <p class="company-date">{{company}} | {{startDate}} - {{#if current}}Present{{else}}{{endDate}}{{/if}}</p>
                <ul class="achievements">
                  {{#each achievements}}
                  <li>{{this}}</li>
                  {{/each}}
                </ul>
              </div>
              {{/each}}
            </section>
            {{/if}}
          </div>
        </div>
      `,
      css: `
        .resume.two-column {
          font-family: 'Calibri', 'Arial', sans-serif;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0;
          color: #000;
          line-height: 1.5;
          display: flex;
          background: #fff;
        }
        .left-column {
          width: 35%;
          background: #2c3e50;
          color: white;
          padding: 30px 25px;
        }
        .right-column {
          width: 65%;
          padding: 30px 35px;
          background: #fff;
        }
        .header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3498db;
        }
        .name {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 20px 0;
          text-transform: uppercase;
          color: white;
          letter-spacing: 1px;
        }
        .contact-info {
          font-size: 10px;
          line-height: 1.8;
        }
        .contact-line {
          margin-bottom: 8px;
          color: #ecf0f1;
        }
        .contact-line a {
          color: #3498db;
          text-decoration: none;
        }
        .section {
          margin-bottom: 28px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          text-transform: uppercase;
          margin-bottom: 15px;
          color: white;
          border-bottom: 2px solid #3498db;
          padding-bottom: 6px;
          letter-spacing: 1px;
        }
        .right-column .section-title {
          color: #2c3e50;
          border-bottom-color: #2c3e50;
        }
        .experience-item {
          margin-bottom: 22px;
          padding-bottom: 18px;
          border-bottom: 1px solid #ecf0f1;
        }
        .job-title {
          font-size: 15px;
          font-weight: bold;
          margin: 0 0 6px 0;
          color: #2c3e50;
        }
        .company-date {
          font-size: 12px;
          color: #7f8c8d;
          margin: 0 0 10px 0;
          font-weight: 500;
        }
        .achievements {
          margin: 0;
          padding-left: 20px;
        }
        .achievements li {
          margin-bottom: 6px;
          font-size: 11px;
          color: #34495e;
        }
        .skills-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .skill-item {
          background: rgba(52,152,219,0.2);
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 11px;
          border-left: 3px solid #3498db;
          color: white;
        }
        .education-item {
          margin-bottom: 18px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .degree {
          font-size: 13px;
          font-weight: bold;
          margin: 0 0 5px 0;
          color: white;
        }
        .institution {
          font-size: 11px;
          color: #bdc3c7;
          margin: 0 0 4px 0;
        }
        .date, .gpa {
          font-size: 10px;
          color: #95a5a6;
          margin: 3px 0 0 0;
        }
        .summary-text {
          font-size: 11px;
          color: #34495e;
          margin: 0;
          line-height: 1.7;
        }
        .cert-item {
          font-size: 10px;
          margin-bottom: 12px;
          color: #ecf0f1;
          line-height: 1.5;
        }
        .cert-item strong {
          color: white;
          display: block;
          margin-bottom: 3px;
        }
      `,
      sections: ['personalInfo', 'summary', 'experience', 'education', 'skills', 'certifications'],
      layout: 'two-column',
      colors: { primary: '#2c3e50', secondary: '#3498db' }
    },
    isPremium: false,
    isActive: true
  }
];

async function seedTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resume_builder');
    console.log('Connected to MongoDB');

    // Clear existing templates
    await ResumeTemplate.deleteMany({});
    console.log('Cleared existing templates');

    // Insert templates
    for (const templateData of templates) {
      const template = new ResumeTemplate(templateData);
      await template.save();
      console.log(`✓ Seeded template: ${templateData.name} (${templateData.templateId})`);
    }

    console.log(`\n✅ Successfully seeded ${templates.length} beautiful, distinct templates!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding templates:', error);
    process.exit(1);
  }
}

seedTemplates();
