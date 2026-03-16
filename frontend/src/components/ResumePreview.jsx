import React, { useEffect, useState, useCallback } from 'react';
import { templateAPI, aiAPI } from '../services/api';
import { applyTemplateOverrides } from '../utils/templateSectionScanner';

function ResumePreview({ resume, refreshTrigger, aiPreviewMode, setAiPreviewMode }) {
  const [template, setTemplate] = useState(null);
  const [renderedHTML, setRenderedHTML] = useState('');
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const loadTemplate = useCallback(async () => {
    if (!resume?.templateId) return;
    try {
      const response = await templateAPI.getById(resume.templateId);
      setTemplate(response.data);
    } catch (error) {
      console.error('Error loading template:', error);
    }
  }, [resume?.templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const renderTemplate = useCallback(() => {
    if (!template || !resume) return;

    const originalHtml = template.templateConfig.html || '';
    const originalIsFullDocument = /<!doctype|<html[\s>]/i.test(originalHtml);
    let html = originalHtml;
    const css = template.templateConfig.css || '';

    // If 'edit' mode (Show Template Data toggle), entirely bypass data injection 
    // and just render the raw template with its placeholder data intact.
    if (aiPreviewMode === 'edit') {
       const customization = resume.customization || {};
       const cc = customization.colors || {};
       const ty = customization.typography || {};
       const customizationCSS = `
         :root {
           --primary-color: ${cc.primary || '#000000'};
           --secondary-color: ${cc.secondary || '#666666'};
           --accent-color: ${cc.accent || '#0066cc'};
           --text-color: ${cc.text || '#000000'};
           --font-family-title: ${ty.fontFamilyTitle || 'Arial, sans-serif'};
           --font-family-text: ${ty.fontFamilyText || 'Arial, sans-serif'};
           --font-family-subheading: ${ty.fontFamilySubheading || 'Arial, sans-serif'};
           --font-size: ${ty.fontSize || '14px'};
           --line-height: ${ty.fontSpacing || '1.5'};
           --section-spacing: ${ty.sectionSpacing || '20px'};
         }
         h1, h2, h3, h4, h5, h6, .title, [class*="title"], [class*="heading"] {
           font-family: var(--font-family-title) !important;
           color: var(--primary-color) !important;
         }
         body, p, li, span, div {
           font-family: var(--font-family-text) !important;
           font-size: var(--font-size) !important;
           line-height: var(--line-height) !important;
           color: var(--text-color) !important;
         }
         /* Override for SaarthiX Special template names */
         .first-name, .last-name, .resume.layout-saarthix-2 .name {
           font-size: 32px !important;
           text-transform: uppercase !important;
           font-weight: 700 !important;
           letter-spacing: 1px !important;
           line-height: 1.1 !important;
         }
         .resume { box-sizing: border-box !important; }
         section, .section { margin-bottom: var(--section-spacing) !important; }
         a, [href] { color: var(--accent-color) !important; }
       `;

       if (originalIsFullDocument) {
         let rawHtml = html;
         const a4Styles = `
           ${customizationCSS}
           @page { size: A4; margin: 0; }
           @media print {
             html, body {
               width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden;
             }
           }
           @media screen {
             html { background: #e0e0e0; padding: 0; overflow: visible; height: auto; }
             body {
               width: 210mm; min-height: 297mm; margin: 0; padding: 0;
               background: white; box-shadow: 0 0 20px rgba(0,0,0,0.2);
               overflow: visible; height: auto;
             }
           }
         `;
         if (rawHtml.includes('</head>')) {
           rawHtml = rawHtml.replace('</head>', `<style>${a4Styles}</style></head>`);
         } else if (rawHtml.includes('<body>')) {
           rawHtml = rawHtml.replace('<body>', `<head><style>${a4Styles}</style></head><body>`);
         }
         setRenderedHTML(rawHtml);
         return;
       } else {
         const wrapped = `
           <!DOCTYPE html>
           <html>
             <head>
               <meta charset="UTF-8">
               <style>
                 ${customizationCSS}
                 ${css}
                 @page { size: A4; margin: 0; }
                 @media print {
                   html, body {
                     width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden;
                   }
                 }
                 @media screen {
                   html { background: #e0e0e0; padding: 20px; }
                   body {
                     width: 210mm; min-height: 297mm; margin: 0 auto; padding: 0;
                     background: white; box-shadow: 0 0 20px rgba(0,0,0,0.2);
                   }
                 }
               </style>
             </head>
             <body>
               ${html}
             </body>
           </html>
         `;
         setRenderedHTML(wrapped);
         return;
       }
    }

    // Prepare data
    const data = {
      name: resume.personalInfo?.fullName || '',
      email: resume.personalInfo?.email || '',
      phone: resume.personalInfo?.phone || '',
      location: resume.personalInfo?.location || '',
      linkedin: resume.personalInfo?.linkedin || '',
      portfolio: resume.personalInfo?.portfolio || '',
      profileImage: resume.personalInfo?.profileImage || '',
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

    // Replace simple variables
    Object.keys(data).forEach(key => {
      if (typeof data[key] !== 'object' || !Array.isArray(data[key])) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        html = html.replace(regex, String(data[key] || ''));
      }
    });

    // Replace {{#if variable}} blocks
    html = html.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
      const value = data[key];
      if (value && (Array.isArray(value) ? value.length > 0 : value)) {
        return content;
      }
      return '';
    });

    // Replace {{#each array}} blocks
    html = html.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, key, content) => {
      const items = data[key] || [];
      if (!Array.isArray(items) || items.length === 0) {
        return '';
      }
      
      return items.map((item) => {
        let itemContent = content;
        
        if (typeof item === 'object') {
          Object.keys(item).forEach(prop => {
            if (prop === 'achievements' && Array.isArray(item[prop])) {
              const achievementsPattern = /\{\{#each achievements\}\}([\s\S]*?)\{\{\/each\}\}/g;
              itemContent = itemContent.replace(achievementsPattern, (achMatch, achContent) => {
                return item[prop].map(ach => {
                  return achContent.replace(/\{\{this\}\}/g, String(ach || ''));
                }).join('');
              });
            } else {
              const propRegex = new RegExp(`\\{\\{${prop}\\}\\}`, 'g');
              let propValue = item[prop];
              if (prop === 'current') {
                propValue = item[prop] ? 'Present' : (item.endDate || '');
              }
              itemContent = itemContent.replace(propRegex, String(propValue || ''));
            }
          });
        } else {
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
        }
        
        return itemContent;
      }).join('');
    });

    // Apply colors
    if (resume.customization?.colors) {
      const colors = resume.customization.colors;
      html = html.replace(/\{\{primaryColor\}\}/g, colors.primary || '#000000');
      html = html.replace(/\{\{secondaryColor\}\}/g, colors.secondary || '#666666');
      html = html.replace(/\{\{accentColor\}\}/g, colors.accent || '#0066cc');
    }

    const bindImportedTemplate = (docHtml) => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(docHtml, 'text/html');

        const setText = (sel, text) => {
          const el = doc.querySelector(sel);
          if (el && text) el.textContent = text;
        };
        const setHrefText = (sel, href, text) => {
          const el = doc.querySelector(sel);
          if (!el) return;
          if (href) el.setAttribute('href', href);
          if (text) el.textContent = text;
        };

        if (data.name) setText('title', data.name);

        // Update profile image if available
        if (data.profileImage) {
          const imgEl = doc.querySelector('#resume-container img, .photo img, .profile-pic img, .avatar img');
          if (imgEl) {
            imgEl.setAttribute('src', data.profileImage);
            imgEl.setAttribute('alt', 'Profile');
          }
        }

        if (doc.querySelector('#resume-container')) {
          if (data.name) setText('#name', data.name);
          if (data.email) setHrefText('#contact a[href^="mailto:"]', `mailto:${data.email}`, data.email);
          if (data.phone) setHrefText('#contact a[href^="tel:"]', `tel:${data.phone}`, data.phone);

          if (doc.querySelector('#technical-skills') && Array.isArray(data.skills)) {
            const skillsContainer = doc.querySelector('#skills-container');
            if (skillsContainer) {
              skillsContainer.innerHTML = '';
              const wrapper = doc.createElement('div');
              wrapper.className = 'skills';
              wrapper.innerHTML = `
                <div class='skill'>Skills</div>
                <div class="level"><em></em></div>
                <p>${data.skills.join(', ')}</p>
              `;
              skillsContainer.appendChild(wrapper);
            }
          }

          if (doc.querySelector('#education') && Array.isArray(data.education)) {
            const edu = doc.querySelector('#education');
            if (edu) {
              edu.innerHTML = '';
              data.education.forEach((e, idx) => {
                const block = doc.createElement('div');
                block.className = `education ${idx === data.education.length - 1 ? 'last' : ''}`;
                block.innerHTML = `
                  <div class='education-info'>
                    <div class='title'>${e.degree || ''}<br/>at ${e.institution || ''}</div>
                    <div class='duration'>${e.startDate || ''}${e.endDate ? ` - ${e.endDate}` : ''}</div>
                  </div>
                `;
                edu.appendChild(block);
              });
            }
          }

          if (doc.querySelector('#employment') && Array.isArray(data.experience)) {
            const emp = doc.querySelector('#employment');
            if (emp) {
              emp.innerHTML = '';
              data.experience.forEach((x) => {
                const block = doc.createElement('div');
                block.className = 'employment';
                const achievements = Array.isArray(x.achievements) ? x.achievements : [];
                block.innerHTML = `
                  <div class='employment-info'>
                    <div class='title'>${x.role || ''}${x.company ? ` — ${x.company}` : ''}</div>
                    <div class='duration'>${x.startDate || ''} - ${x.current ? 'Present' : (x.endDate || '')}</div>
                  </div>
                  <div class='info'>
                    <ul class='list'>
                      ${achievements.map((a) => `<li>${a}</li>`).join('')}
                    </ul>
                  </div>
                `;
                emp.appendChild(block);
              });
            }
          }

          if (doc.querySelector('#projects') && Array.isArray(data.projects)) {
            const proj = doc.querySelector('#projects');
            if (proj) {
              proj.innerHTML = '';
              data.projects.forEach((p, idx) => {
                const block = doc.createElement('div');
                block.className = `project ${idx === data.projects.length - 1 ? 'last' : ''}`;
                block.innerHTML = `
                  <div class='project-info'>
                    <div class='title'>${p.name || ''}</div>
                  </div>
                  <div class='info'>
                    <ul class='list'>
                      ${p.description ? `<li>${p.description}</li>` : ''}
                      ${Array.isArray(p.technologies) && p.technologies.length ? `<li>Tech: ${p.technologies.join(', ')}</li>` : ''}
                    </ul>
                  </div>
                `;
                proj.appendChild(block);
              });
            }
          }

          return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
        }

        if (doc.querySelector('.sidebar-wrapper') && doc.querySelector('.main-wrapper')) {
          if (data.name) setText('.profile-container .name', data.name);
          if (data.profileImage) {
            const imgEl = doc.querySelector('.profile-container img, .sidebar-wrapper img');
            if (imgEl) {
              imgEl.setAttribute('src', data.profileImage);
              imgEl.setAttribute('alt', 'Profile');
            }
          }
          if (data.email) setHrefText('.contact-list .email a', `mailto:${data.email}`, data.email);
          if (data.phone) setHrefText('.contact-list .phone a', `tel:${data.phone}`, data.phone);
          if (data.summary) setText('.summary-section .summary p', data.summary);

          const expSection = Array.from(doc.querySelectorAll('.experiences-section')).find((s) =>
            /work experience/i.test(s.textContent || '')
          );
          if (expSection && Array.isArray(data.experience)) {
            expSection.querySelectorAll('.item').forEach((n) => n.remove());
            data.experience.forEach((x) => {
              const item = doc.createElement('div');
              item.className = 'item';
              item.innerHTML = `
                <div class="meta">
                  <div class="upper-row">
                    <h3 class="job-title">${x.role || ''}</h3>
                    <div class="time">${x.startDate || ''} - ${x.current ? 'Present' : (x.endDate || '')}</div>
                  </div>
                  <div class="company">${x.company || ''}</div>
                </div>
                <div class="details">${(Array.isArray(x.achievements) && x.achievements.length) ? `<ul>${x.achievements.map((a)=>`<li>${a}</li>`).join('')}</ul>` : ''}</div>
              `;
              expSection.appendChild(item);
            });
          }

          const eduContainer = doc.querySelector('.education-container');
          if (eduContainer && Array.isArray(data.education)) {
            const itemsRoot = eduContainer;
            itemsRoot.querySelectorAll('.item').forEach((n) => n.remove());
            data.education.forEach((e) => {
              const item = doc.createElement('div');
              item.className = 'item';
              item.innerHTML = `
                <h4 class="degree">${e.degree || ''}</h4>
                <h5 class="meta">${e.institution || ''}</h5>
                <div class="time">${e.startDate || ''}${e.endDate ? ` - ${e.endDate}` : ''}</div>
              `;
              itemsRoot.appendChild(item);
            });
          }

          return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
        }

        // Saarthix Special Template Layout
        if (doc.querySelector('.resume') && doc.querySelector('.left') && doc.querySelector('.right')) {
          // 1. Photo
          if (data.profileImage || resume.personalInfo?.profileImage) {
            const imageUrl = data.profileImage || resume.personalInfo?.profileImage;
            const imgEl = doc.querySelector('.photo img');
            if (imgEl) {
              imgEl.setAttribute('src', imageUrl);
            }
          }

          // 2. Name Header & Tagline
          if (data.name) {
            const firstNameEl = doc.querySelector('.first-name');
            const lastNameEl = doc.querySelector('.last-name');
            if (firstNameEl) {
              const nameParts = data.name.trim().split(' ');
              const firstName = nameParts[0] || '';
              firstNameEl.textContent = firstName.toUpperCase();
              
              if (lastNameEl) {
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                lastNameEl.textContent = lastName.toUpperCase();
              }
            }
          }
          
          const taglineEl = doc.querySelector('.tagline');
          if (taglineEl && resume.experience?.[0]?.role) {
            let tagText = resume.experience[0].role;
            if (resume.experience[0].company) {
               tagText += ` at ${resume.experience[0].company}`;
            }
            taglineEl.textContent = tagText;
          }

          // Helper to safely replace text node next to a <b> tag
          const safelyReplaceTextAfterBTag = (container, bTagTextContent, newText) => {
             const bTags = Array.from(container.querySelectorAll('b'));
             const bTag = bTags.find(b => b.textContent.trim() === bTagTextContent);
             if (bTag && bTag.nextSibling) {
               if (bTag.nextSibling.nodeType === Node.TEXT_NODE) {
                 bTag.nextSibling.textContent = ` ${newText}`;
               } else if (bTag.nextSibling.tagName === 'A') {
                 // For linked in that wraps in 'A'
                 bTag.nextSibling.textContent = newText;
                 bTag.nextSibling.setAttribute('href', `https://${newText.replace(/^https?:\/\//, '')}`);
               }
             }
          };

          // 3. Contact block
          const contactContainer = doc.querySelector('.contact');
          if (contactContainer) {
            if (data.phone) safelyReplaceTextAfterBTag(contactContainer, 'PHONE:', data.phone);
            if (data.location) safelyReplaceTextAfterBTag(contactContainer, 'City:', data.location);
            if (data.email) safelyReplaceTextAfterBTag(contactContainer, 'Email:', data.email);
            if (data.linkedin) safelyReplaceTextAfterBTag(contactContainer, 'LinkedIn:', data.linkedin);
          }

          // 4. Left Column Summary Profile (the first <p> after <h2>Profile</h2>)
          const leftH2s = Array.from(doc.querySelectorAll('.left h2'));
          const leftProfileH2 = leftH2s.find(h2 => h2.textContent.trim() === 'Profile');
          if (leftProfileH2 && leftProfileH2.nextElementSibling && leftProfileH2.nextElementSibling.tagName === 'P') {
             leftProfileH2.nextElementSibling.textContent = data.summary || '';
          }

          // 5. Left Column Achievements (Key Recognitions / Certifications)
          const leftAwardsH2 = leftH2s.find(h2 => h2.textContent.includes('Recognitions') || h2.textContent.includes('Accomplishments'));
          if (leftAwardsH2) {
             // Overwrite its UL with certs/achievements
             let nextEl = leftAwardsH2.nextElementSibling;
             if (nextEl && nextEl.tagName === 'UL') {
               nextEl.innerHTML = ''; // clear
               const items = [...(data.certifications || []).map(c => c.name), ...(data.achievements || [])];
               items.slice(0, 3).forEach(item => {
                  const li = doc.createElement('li');
                  li.textContent = item;
                  nextEl.appendChild(li);
               });
             } else if (nextEl && nextEl.tagName === 'P') {
               // Remove old P tags
               while (nextEl && nextEl.tagName === 'P' && !nextEl.classList.contains('contact')) {
                 const toRemove = nextEl;
                 nextEl = nextEl.nextElementSibling;
                 toRemove.remove();
               }
               // Insert new ones
               const items = [...(data.certifications || []).map(c => c.name), ...(data.achievements || [])];
               items.slice(0, 3).reverse().forEach(item => {
                 const p = doc.createElement('p');
                 p.textContent = item;
                 leftAwardsH2.insertAdjacentElement('afterend', p);
               });
             }
          }

          // 6. Right Column Right Panels
          const rightSections = Array.from(doc.querySelectorAll('.right .section'));
          
          rightSections.forEach(section => {
             const h2 = section.querySelector('h2');
             if (!h2) return;
             
             const title = h2.textContent.trim().toLowerCase();
             
             // --- SKILLS ---
             if (title.includes('skill')) {
                while(h2.nextSibling) { h2.nextSibling.remove(); }
                const ul = doc.createElement('ul');
                if (data.skills && data.skills.length > 0) {
                  const li = doc.createElement('li');
                  li.innerHTML = `<b>Technical:</b> ${data.skills.join(', ')}`;
                  ul.appendChild(li);
                }
                if (data.languages && data.languages.length > 0) {
                  const li = doc.createElement('li');
                  li.innerHTML = `<b>Languages:</b> ${data.languages.join(', ')}`;
                  ul.appendChild(li);
                }
                if (data.hobbies && data.hobbies.length > 0) {
                  const li = doc.createElement('li');
                  li.innerHTML = `<b>Hobbies:</b> ${data.hobbies.join(', ')}`;
                  ul.appendChild(li);
                }
                section.appendChild(ul);
             }
             
             // --- EXPERIENCE ---
             else if (title.includes('experience')) {
                while(h2.nextSibling) { h2.nextSibling.remove(); }
                
                (data.experience || []).forEach(exp => {
                   const h3 = doc.createElement('h3');
                   h3.textContent = `${exp.role || ''} ${exp.company ? `– ${exp.company}` : ''}`;
                   
                   const roleP = doc.createElement('p');
                   roleP.textContent = `Role – ${exp.role || ''}`;
                   
                   const dateP = doc.createElement('p');
                   dateP.className = 'date';
                   dateP.textContent = `${exp.startDate || ''} – ${exp.current ? 'Present' : exp.endDate || ''}`;
                   
                   const ul = doc.createElement('ul');
                   (exp.achievements || []).forEach(ach => {
                      if (!ach) return;
                      const li = doc.createElement('li');
                      li.textContent = ach;
                      ul.appendChild(li);
                   });
                   
                   section.appendChild(h3);
                   section.appendChild(roleP);
                   section.appendChild(dateP);
                   section.appendChild(ul);
                });
             }
             
             // --- EDUCATION ---
             else if (title.includes('education')) {
                while(h2.nextSibling) { h2.nextSibling.remove(); }
                
                (data.education || []).forEach(edu => {
                   const h3 = doc.createElement('h3');
                   h3.textContent = edu.degree || '';
                   
                   const instP = doc.createElement('p');
                   instP.textContent = edu.institution || '';
                   
                   const dateP = doc.createElement('p');
                   dateP.textContent = `${edu.startDate || ''} – ${edu.endDate || ''}`;
                   
                   section.appendChild(h3);
                   section.appendChild(instP);
                   section.appendChild(dateP);
                   
                   if (edu.gpa) {
                     const gpaP = doc.createElement('p');
                     gpaP.textContent = `GPA: ${edu.gpa}`;
                     section.appendChild(gpaP);
                   }
                });
             }
          });
        } else if (doc.querySelector('.resume.layout-saarthix-2')) {
          // --- SaarthiX Special 2 Template Layout ---

          // 1. Name
          if (data.name) {
            const nameEl = doc.querySelector('.name');
            if (nameEl) nameEl.textContent = data.name.toUpperCase();
          }

          // 2. Contact
          const contactEl = doc.querySelector('.contact');
          if (contactEl && (data.email || data.phone || data.linkedin || data.location)) {
            const parts = [];
            if (data.email) parts.push(`Email: ${data.email}`);
            if (data.phone) parts.push(`Phone: ${data.phone}`);
            if (data.linkedin) parts.push(`LinkedIn: ${data.linkedin.replace(/^https?:\/\//, '')}`);
            if (data.location) parts.push(data.location);
            contactEl.textContent = parts.join(' | ');
          }

          // 3. Summary (PROFESSIONAL SYNOPSIS)
          const summaryContainer = doc.getElementById('container-summary');
          if (summaryContainer && data.summary) {
            summaryContainer.innerHTML = `<p>${data.summary}</p>`;
          }

          // 4. DNA (Key Achievements / Metrics)
          const dnaContainer = doc.getElementById('container-dna');
          if (dnaContainer && data.achievements && data.achievements.length) {
            dnaContainer.innerHTML = '';
            data.achievements.forEach(ach => {
              const li = doc.createElement('li');
              li.innerHTML = ach.includes(':') 
                ? `<b>${ach.split(':')[0]}:</b> ${ach.split(':').slice(1).join(':')}`
                : ach;
              dnaContainer.appendChild(li);
            });
          }

          // 5. Experience
          const expContainer = doc.getElementById('container-experience');
          if (expContainer && data.experience && data.experience.length) {
            expContainer.innerHTML = '';
            data.experience.forEach(exp => {
              const div = doc.createElement('div');
              div.className = 'exp';
              
              const dateStr = `${exp.startDate || ''} – ${exp.current ? 'Present' : exp.endDate || ''}`;
              const companyLine = exp.company ? `<li><b>Company Name:</b> ${exp.company}</li>` : '';
              const descLine = exp.description ? `<li><b>Project:</b> ${exp.description}</li>` : '';
              const roleLine = exp.role ? `<li><b>Role:</b> ${exp.role}</li>` : '';
              const skillsLine = exp.keySkills ? `<li><b>Key Skill used:</b> ${exp.keySkills}</li>` : '';
              const achsLines = (exp.achievements || []).map(a => `<li>${a}</li>`).join('');

              div.innerHTML = `
                <div class="exp-header">
                  ${exp.company || exp.role || 'Experience'}
                  <span class="date">${dateStr}</span>
                </div>
                <div class="clear"></div>
                <ul>
                  ${companyLine}
                  ${descLine}
                  ${roleLine}
                  ${skillsLine}
                  ${achsLines ? `<li><b>Achievements:</b><ul>${achsLines}</ul></li>` : ''}
                </ul>
              `;
              expContainer.appendChild(div);
            });
          }

          // 6. Skills
          const skillsContainer = doc.getElementById('container-skills');
          if (skillsContainer) {
            skillsContainer.innerHTML = '';
            if (data.skills && data.skills.length) {
              const li = doc.createElement('li');
              li.innerHTML = `<b>Technical:</b> ${data.skills.join(', ')}`;
              skillsContainer.appendChild(li);
            }
            if (data.languages && data.languages.length) {
              const li = doc.createElement('li');
              li.innerHTML = `<b>Languages:</b> ${data.languages.join(', ')}`;
              skillsContainer.appendChild(li);
            }
            if (data.hobbies && data.hobbies.length) {
              const li = doc.createElement('li');
              li.innerHTML = `<b>Hobbies:</b> ${data.hobbies.join(', ')}`;
              skillsContainer.appendChild(li);
            }
          }

          // 7. Certifications
          const certContainer = doc.getElementById('container-certifications');
          if (certContainer && data.certifications && data.certifications.length) {
            certContainer.innerHTML = '';
            data.certifications.forEach(cert => {
              if (cert.name) {
                const li = doc.createElement('li');
                li.textContent = `${cert.name}${cert.issuer ? ` – ${cert.issuer}` : ''}`;
                certContainer.appendChild(li);
              }
            });
          }

          // 8. Education
          const eduContainer = doc.getElementById('container-education');
          if (eduContainer && data.education && data.education.length) {
            eduContainer.innerHTML = '';
            data.education.forEach(edu => {
              const title = doc.createElement('div');
              title.className = 'edu-title';
              title.textContent = edu.degree || 'Education';
              eduContainer.appendChild(title);

              const ul = doc.createElement('ul');
              if (edu.institution) ul.innerHTML += `<li>${edu.institution}</li>`;
              if (edu.startDate || edu.endDate) ul.innerHTML += `<li>${edu.startDate || ''} – ${edu.endDate || ''}</li>`;
              if (edu.gpa) ul.innerHTML += `<li>Percentage / GPA: ${edu.gpa}</li>`;
              if (edu.description) ul.innerHTML += `<li>Electives / Subjects: ${edu.description}</li>`;
              
              eduContainer.appendChild(ul);
            });
          }
        }

        if (data.summary) {
          const isSaarthix = doc.querySelector('.resume') && doc.querySelector('.left') && doc.querySelector('.right');
          const isSaarthix2 = doc.querySelector('.resume.layout-saarthix-2');
          const headings = Array.from(doc.querySelectorAll('h1,h2,h3,.section-header,.section-title'));
          const summaryHeading = headings.find((h) => {
            if (isSaarthix && h.closest('.right')) return false; // Protect right column in Saarthix templates
            if (isSaarthix2) return false; // Handled explicitly above
            return /summary|about|profile/i.test((h.textContent || '').trim());
          });
          if (summaryHeading) {
            const p = summaryHeading.parentElement?.querySelector('p') || summaryHeading.nextElementSibling?.querySelector?.('p') || summaryHeading.nextElementSibling;
            if (p && p.tagName === 'P') p.textContent = data.summary;
          }
        }

        return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
      } catch (e) {
        return docHtml;
      }
    };

    if (originalIsFullDocument) {
      html = bindImportedTemplate(html);
      const overrides = resume.templateOverrides || {};
      html = applyTemplateOverrides(html, overrides);
      
      const customization = resume.customization || {};
      const cc = customization.colors || {};
      const ty = customization.typography || {};
      const customizationCSS = `
        :root {
          --primary-color: ${cc.primary || '#000000'};
          --secondary-color: ${cc.secondary || '#666666'};
          --accent-color: ${cc.accent || '#0066cc'};
          --text-color: ${cc.text || '#000000'};
          --font-family-title: ${ty.fontFamilyTitle || 'Arial, sans-serif'};
          --font-family-text: ${ty.fontFamilyText || 'Arial, sans-serif'};
          --font-family-subheading: ${ty.fontFamilySubheading || 'Arial, sans-serif'};
          --font-size: ${ty.fontSize || '14px'};
          --line-height: ${ty.fontSpacing || '1.5'};
          --section-spacing: ${ty.sectionSpacing || '20px'};
        }
        h1, h2, h3, h4, h5, h6, .title, [class*="title"], [class*="heading"] {
          font-family: var(--font-family-title) !important;
          color: var(--primary-color) !important;
        }
        body, p, li, span, div {
          font-family: var(--font-family-text) !important;
          font-size: var(--font-size) !important;
          line-height: var(--line-height) !important;
          color: var(--text-color) !important;
        }
        /* Override for SaarthiX Special template names - must be after general div rule */
        .first-name, .last-name, .resume.layout-saarthix-2 .name {
          font-size: 32px !important;
          text-transform: uppercase !important;
          font-weight: 700 !important;
          letter-spacing: 1px !important;
          line-height: 1.1 !important;
        }
        .resume { box-sizing: border-box !important; }
        section, .section { margin-bottom: var(--section-spacing) !important; }
        a, [href] { color: var(--accent-color) !important; }
      `;
      
      const a4Styles = `
        ${customizationCSS}
        /* Ensure SaarthiX Special template names are large and uppercase */
        .first-name, .last-name, .resume.layout-saarthix-2 .name {
          font-size: 32px !important;
          text-transform: uppercase !important;
          font-weight: 700 !important;
          letter-spacing: 1px !important;
        }
        @page { size: A4; margin: 0; }
        @media print {
          html, body {
            width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden;
          }
        }
        @media screen {
          html { background: #e0e0e0; padding: 0; overflow: visible; height: auto; }
          body {
            width: 210mm; min-height: 297mm; margin: 0; padding: 0;
            background: white; box-shadow: 0 0 20px rgba(0,0,0,0.2);
            overflow: visible; height: auto;
          }
        }
      `;
      
      html = html.replace('</head>', `<style>${a4Styles}</style></head>`);
      if (!html.includes('</head>')) {
        html = html.replace('<body>', `<head><style>${a4Styles}</style></head><body>`);
      }
      setRenderedHTML(html);
      return;
    }

    const customization = resume.customization || {};
    const cc = customization.colors || {};
    const ty = customization.typography || {};
    const customizationCSS = `
      :root {
        --primary-color: ${cc.primary || '#000000'};
        --secondary-color: ${cc.secondary || '#666666'};
        --accent-color: ${cc.accent || '#0066cc'};
        --text-color: ${cc.text || '#000000'};
        --font-family-title: ${ty.fontFamilyTitle || 'Arial, sans-serif'};
        --font-family-text: ${ty.fontFamilyText || 'Arial, sans-serif'};
        --font-family-subheading: ${ty.fontFamilySubheading || 'Arial, sans-serif'};
        --font-size: ${ty.fontSize || '14px'};
        --line-height: ${ty.fontSpacing || '1.5'};
        --section-spacing: ${ty.sectionSpacing || '20px'};
      }
      h1, h2, h3, h4, h5, h6, .title, [class*="title"], [class*="heading"] {
        font-family: var(--font-family-title) !important;
        color: var(--primary-color) !important;
      }
      body, p, li, span, div {
        font-family: var(--font-family-text) !important;
        font-size: var(--font-size) !important;
        line-height: var(--line-height) !important;
        color: var(--text-color) !important;
      }
      section, .section { margin-bottom: var(--section-spacing) !important; }
      a, [href] { color: var(--accent-color) !important; }
    `;

    const wrapped = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            ${customizationCSS}
            ${css}
            @page { size: A4; margin: 0; }
            @media print {
              html, body {
                width: 210mm; height: 297mm; margin: 0; padding: 0; overflow: hidden;
              }
            }
            @media screen {
              html { background: #e0e0e0; padding: 20px; }
              body {
                width: 210mm; min-height: 297mm; margin: 0 auto; padding: 0;
                background: white; box-shadow: 0 0 20px rgba(0,0,0,0.2);
              }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
    setRenderedHTML(wrapped);
  }, [template, resume, resume?.templateOverrides, aiPreviewMode]);

  useEffect(() => {
    renderTemplate();
  }, [renderTemplate, refreshTrigger]);

  if (!template) {
    return (
      <div className="border p-4 min-h-[600px] flex items-center justify-center">
        <p className="text-gray-500">Loading template preview...</p>
      </div>
    );
  }

  const handlePrintPreview = async () => {
    let finalHtml = renderedHTML;

    // IF this resume was edited using the AI Editor (indicated by aiFormData)
    // AND the template has a base HTML to inject into,
    // THEN we perform one final "Print Mode" injection to strip empty sections.
    if (resume?.aiFormData && template?.templateConfig?.html) {
      setIsPreparingPrint(true);
      try {
        const resp = await aiAPI.injectTemplateData({
          templateHtml: template.templateConfig.html,
          formData: resume.aiFormData,
          mode: 'print'
        });
        
        // Use the same wrapping logic as renderTemplate but for the stripped version
        const strippedHtml = resp.data.html;
        
        // Re-apply the CSS and A4 wrapping
        const originalHtml = template.templateConfig.html || '';
        const originalIsFullDocument = /<!doctype|<html[\s>]/i.test(originalHtml);
        
        if (originalIsFullDocument) {
             finalHtml = strippedHtml;
             const customization = resume.customization || {};
             const cc = customization.colors || {};
             const ty = customization.typography || {};
             const customizationCSS = `
               :root {
                 --primary-color: ${cc.primary || '#000000'};
                 --secondary-color: ${cc.secondary || '#666666'};
                 --accent-color: ${cc.accent || '#0066cc'};
                 --text-color: ${cc.text || '#000000'};
                 --font-family-title: ${ty.fontFamilyTitle || 'Arial, sans-serif'};
                 --font-family-text: ${ty.fontFamilyText || 'Arial, sans-serif'};
                 --font-size: ${ty.fontSize || '14px'};
                 --line-height: ${ty.fontSpacing || '1.5'};
               }
               h1, h2, h3, h4, h5, h6 { font-family: var(--font-family-title) !important; color: var(--primary-color) !important; }
               body, p, li, span, div { font-family: var(--font-family-text) !important; font-size: var(--font-size) !important; }
             `;
             const a4Styles = `${customizationCSS} @page { size: A4; margin: 0; } @media print { html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; } }`;
             finalHtml = finalHtml.replace('</head>', `<style>${a4Styles}</style></head>`);
        } else {
             finalHtml = strippedHtml;
             finalHtml = `<!DOCTYPE html><html><head><style>@page { size: A4; margin: 0; }</style></head><body>${finalHtml}</body></html>`;
        }
      } catch (err) {
        console.error('Print mode injection failed', err);
      } finally {
        setIsPreparingPrint(false);
      }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(finalHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 rounded-lg shadow" style={{ minHeight: 0 }}>
      <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-700">A4 Preview</h3>
        <div className="flex items-center gap-2">
          {isPreparingPrint && <span className="text-xs text-blue-600 animate-pulse">✨ Preparing Print Mode...</span>}
          
          {setAiPreviewMode && (
            <button
              onClick={() => setAiPreviewMode(prev => prev === 'print' ? 'edit' : 'print')}
              className={`text-xs px-3 py-1 rounded font-medium border transition-colors ${
                aiPreviewMode === 'edit'
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
              title="Toggle between seeing only your inputs vs the full template with placeholders"
            >
              {aiPreviewMode === 'edit' ? '👁️ Hide Template Data' : '👁️ Show Template Data'}
            </button>
          )}

          <button
            onClick={renderTemplate}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
            title="Refresh preview"
          >
            🔄 Refresh
          </button>
          <button
            onClick={handlePrintPreview}
            disabled={isPreparingPrint}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded disabled:opacity-50"
            title="Print preview"
          >
            {isPreparingPrint ? 'Preparing...' : '🖨️ Print Preview'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4" style={{ minHeight: 0 }}>
        <div className="bg-white p-2 rounded shadow-inner mx-auto" style={{ width: 'fit-content', paddingBottom: '20px' }}>
          <iframe
            title="Resume Preview"
            srcDoc={renderedHTML}
            className="border-0"
            scrolling="no"
            sandbox="allow-same-origin allow-scripts allow-forms"
            style={{ 
              width: '210mm', 
              minHeight: '297mm',
              border: 'none',
              display: 'block',
              height: 'auto'
            }}
            onLoad={(e) => {
              try {
                const iframe = e.target;
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                  const height = Math.max(
                    iframeDoc.body.scrollHeight,
                    iframeDoc.body.offsetHeight,
                    iframeDoc.documentElement.clientHeight,
                    iframeDoc.documentElement.scrollHeight,
                    iframeDoc.documentElement.offsetHeight
                  );
                  iframe.style.height = height + 'px';
                }
              } catch (err) {
                console.warn('Could not auto-resize iframe:', err);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ResumePreview;
