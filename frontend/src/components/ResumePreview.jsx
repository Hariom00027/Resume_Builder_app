import React, { useEffect, useState, useCallback, useRef } from 'react';
import { templateAPI, aiAPI } from '../services/api';
import { applyTemplateOverrides, SECTION_DELETED_SENTINEL } from '../utils/templateSectionScanner';
import { scanTemplateSections } from '../utils/templateSectionScanner';
import { PROFILE_PLACEHOLDER_DATA_URI } from '../utils/templatePreviewDoc';

/** Preview click → AI Editor section title (template schema titles). */
function resolveSaarthixSpecial1EditorSection(target, doc) {
  if (!target?.closest || !doc?.querySelector) return null;
  if (!target.closest('.resume')) return null;
  if (target.closest('.photo')) return { title: 'Profile Image' };
  if (target.closest('.header')) return { title: 'Name Header' };
  if (target.closest('.contact')) return { title: 'Contact Information' };

  const left = target.closest('.left');
  if (left) {
    let lastH2 = '';
    for (const child of Array.from(left.children)) {
      if (child.tagName === 'H2') {
        lastH2 = (child.textContent || '').trim();
      } else if (child.contains(target)) {
        if (/^profile$/i.test(lastH2)) return { title: 'Profile Summary (Left)' };
        if (/recognition/i.test(lastH2)) return { title: 'Key Recognitions' };
        if (/^contact$/i.test(lastH2)) return { title: 'Contact Information' };
        if (/accomplishment|certification/i.test(lastH2)) return { title: 'Key Accomplishments' };
        break;
      }
    }
  }

  const rightSec = target.closest('.right .section');
  if (rightSec) {
    const h2 = (rightSec.querySelector('h2')?.textContent || '').trim();
    if (/^my dna$/i.test(h2) || /^profile$/i.test(h2)) return { title: 'My DNA' };
    if (/skill/i.test(h2)) return { title: 'Skills' };
    if (/experience/i.test(h2)) return { title: 'Experience' };
    if (/education/i.test(h2)) return { title: 'Education' };
  }
  return null;
}

/**
 * Inject page-break prevention CSS (+ a toolbar for the preview page) into a
 * full HTML document string so it can be shown in a new tab or sent to
 * Puppeteer for PDF generation.
 *
 * @param {string} html        - A complete HTML document string.
 * @param {boolean} addToolbar - When true, prepend a sticky "Print / Close" bar.
 */
function prepareForOutput(html, addToolbar = false) {
  const breakCss = `
    /* ── Page-break rules ── */
    .section, section {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    h2, h3 {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
    li { break-inside: avoid !important; }

    /* ── Override screen-only body constraints so multi-page PDFs work ── */
    @media print {
      html, body {
        overflow: visible !important;
        height: auto !important;
        background: white !important;
      }
      .resume { margin: 0 !important; }
      .__sx_print_toolbar { display: none !important; }
    }
  `;

  const toolbarHtml = addToolbar ? `
    <style>
      .__sx_print_toolbar {
        position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
        display: flex; align-items: center; gap: 10px;
        background: #1e293b; color: #f1f5f9;
        padding: 8px 20px;
        font-family: system-ui, sans-serif; font-size: 13px;
      }
      .__sx_print_toolbar button {
        border: none; border-radius: 5px; padding: 5px 14px;
        font-size: 13px; font-weight: 600; cursor: pointer;
      }
      .__sx_print_btn  { background: #3b82f6; color: white; }
      .__sx_print_btn:hover  { background: #2563eb; }
      .__sx_close_btn  { background: #475569; color: white; margin-left: auto; }
      .__sx_close_btn:hover  { background: #334155; }
      .__sx_print_toolbar + * { margin-top: 44px; }
      @media screen { body { padding-top: 44px; } }
    </style>
    <div class="__sx_print_toolbar">
      <button class="__sx_print_btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <span style="opacity:0.55">Resume Preview</span>
      <button class="__sx_close_btn" onclick="window.close()">✕ Close</button>
    </div>
  ` : '';

  const styleTag = `<style>${breakCss}</style>`;

  let out = html;
  if (out.includes('</head>')) {
    out = out.replace('</head>', `${styleTag}</head>`);
  } else {
    out = styleTag + out;
  }

  if (addToolbar) {
    if (out.includes('<body')) {
      out = out.replace(/(<body[^>]*>)/i, `$1\n${toolbarHtml}`);
    } else {
      out = out + toolbarHtml;
    }
  }

  return out;
}

function ResumePreview({ resume, refreshTrigger, aiPreviewMode, setAiPreviewMode, onSectionClick, onRenderedHTMLChange }) {
  const [template, setTemplate] = useState(null);
  const [renderedHTML, setRenderedHTML] = useState('');
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const iframeRef = useRef(null);

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
    const isResumeEmpty = (() => {
      const p = resume.personalInfo || {};
      const hasPersonal = Object.values(p).some(v => String(v || '').trim().length > 0);
      const hasSummary = String(resume.summary || '').trim().length > 0;
      const hasAnyArray = ['experience','education','skills','certifications','projects','achievements','hobbies','languages']
        .some(k => Array.isArray(resume[k]) && resume[k].length > 0);
      // Only count AI form as "having data" when at least one value is non-empty
      // (otherwise preview incorrectly skips template defaults after an empty scan).
      const hasAi =
        resume.aiFormData &&
        typeof resume.aiFormData === 'object' &&
        Object.values(resume.aiFormData).some((v) => v != null && String(v).trim() !== '');
      const hasOverrides =
        resume.templateOverrides &&
        typeof resume.templateOverrides === 'object' &&
        Object.entries(resume.templateOverrides).some(
          ([k, v]) => k !== '__fullTemplate__' && typeof v === 'string' && v.trim().length > 0
        );
      return !(hasPersonal || hasSummary || hasAnyArray || hasAi || hasOverrides);
    })();

    // If 'edit' mode (Show Template Data toggle), entirely bypass data injection 
    // and just render the raw template with its placeholder data intact.
    if (aiPreviewMode === 'edit' || isResumeEmpty) {
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

    // Build a fast lookup of deleted section selectors so bindImportedTemplate
    // can skip DOM manipulation on elements the user has removed.
    const deletedSelectors = new Set(
      Object.entries(resume.templateOverrides || {})
        .filter(([, v]) => v === SECTION_DELETED_SENTINEL)
        .map(([sel]) => sel)
    );
    const isSelectorDeleted = (sel) => {
      if (!sel || !deletedSelectors.size) return false;
      try { return deletedSelectors.has(sel); } catch { return false; }
    };

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
          // 1. Photo — user image if uploaded; otherwise always show vector profile placeholder until they do
          if (!isSelectorDeleted('.photo')) {
            const photoContainer = doc.querySelector('.photo');
            let photoImg = photoContainer?.querySelector('img');
            if (photoContainer && !photoImg) {
              photoImg = doc.createElement('img');
              photoImg.setAttribute('alt', 'Profile');
              photoContainer.insertBefore(photoImg, photoContainer.firstChild);
            }
            if (photoImg) {
              if (data.profileImage || resume.personalInfo?.profileImage) {
                photoImg.setAttribute('src', data.profileImage || resume.personalInfo?.profileImage);
              } else {
                photoImg.setAttribute('src', PROFILE_PLACEHOLDER_DATA_URI);
              }
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
               const url = String(newText || '').trim();
               const normalizedHref = url ? `https://${url.replace(/^https?:\/\//, '')}` : '';

               // If this <b> is followed by text then an <a>, update the <a> and clear the text,
               // otherwise you end up with the URL duplicated (text + link).
               if (bTag.nextSibling.nodeType === Node.TEXT_NODE) {
                 const nextAnchor = bTag.parentElement?.querySelector('a');
                 if (nextAnchor && normalizedHref) {
                   bTag.nextSibling.textContent = ' ';
                   nextAnchor.textContent = url;
                   nextAnchor.setAttribute('href', normalizedHref);
                   return;
                 }
                 bTag.nextSibling.textContent = ` ${url}`;
                 return;
               }

               if (bTag.nextSibling.tagName === 'A') {
                 bTag.nextSibling.textContent = url;
                 if (normalizedHref) bTag.nextSibling.setAttribute('href', normalizedHref);
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

          // 4. Left sidebar bio (under "Profile") — template has its own copy; only replace when user entered summary.
          const leftH2s = Array.from(doc.querySelectorAll('.left h2'));
          const leftProfileH2 = leftH2s.find(h2 => h2.textContent.trim() === 'Profile');
          if (leftProfileH2 && leftProfileH2.nextElementSibling && leftProfileH2.nextElementSibling.tagName === 'P') {
            const summaryText = String(data.summary || '').trim();
            if (summaryText) leftProfileH2.nextElementSibling.textContent = summaryText;
          }

          // 5. Left column accomplishments only (NOT "Key Recognitions" — that matched first before and wiped awards)
          const leftAccomplishmentsH2 = leftH2s.find(
            (h2) => /accomplishment|certification/i.test(h2.textContent) && !/^key recognitions$/i.test(h2.textContent.trim())
          );
          if (leftAccomplishmentsH2) {
             const items = [...(data.certifications || []).map(c => c.name).filter(Boolean), ...(data.achievements || []).filter(Boolean)];
             // If the user has no recognitions/certs in their resume data, keep the template defaults
             // instead of wiping this section.
             if (items.length === 0) {
               // do nothing
             } else {
             // Overwrite its UL with certs/achievements
             let nextEl = leftAccomplishmentsH2.nextElementSibling;
             if (nextEl && nextEl.tagName === 'UL') {
               nextEl.innerHTML = '';
               items.slice(0, 3).forEach((item) => {
                 const li = doc.createElement('li');
                 li.textContent = item;
                 nextEl.appendChild(li);
               });
             } else if (nextEl && nextEl.tagName === 'P') {
               while (nextEl && nextEl.tagName === 'P' && !nextEl.classList.contains('contact')) {
                 const toRemove = nextEl;
                 nextEl = nextEl.nextElementSibling;
                 toRemove.remove();
               }
               items.slice(0, 3).reverse().forEach((item) => {
                 const p = doc.createElement('p');
                 p.textContent = item;
                 leftAccomplishmentsH2.insertAdjacentElement('afterend', p);
               });
             }
             }
          }

          // 6. Right Column Right Panels
          const rightSections = Array.from(doc.querySelectorAll('.right .section'));
          
          rightSections.forEach((section, secIdx) => {
             const h2 = section.querySelector('h2');
             if (!h2) return;

             // If this section was deleted by the user, hide it immediately and skip injection
             const nthSelector = `.right .section:nth-of-type(${secIdx + 1})`;
             if (isSelectorDeleted(nthSelector)) {
               section.style.setProperty('display', 'none', 'important');
               return;
             }
             
             const title = h2.textContent.trim().toLowerCase();

             // If an AI-generated templateOverride exists for this section, skip
             // structured-data injection here. applyTemplateOverrides will apply
             // the AI HTML after bindImportedTemplate returns, so rendering from
             // both sources would create duplicate section content.
             //
             // Exception: experience sections are now rendered directly from
             // resume.experience (bypassing AI entirely).  Even if a stale
             // override still exists in resume.templateOverrides, we must NOT
             // skip bindImportedTemplate for experience — it is the only path
             // that renders the user's data (the override is stripped before
             // applyTemplateOverrides, so both paths would otherwise be skipped).
             const hasAIOverride = (() => {
               if (title.includes('experience') || title.includes('skill')) return false; // render from resume data
               const v = resume.templateOverrides?.[nthSelector];
               return v != null && typeof v === 'string' && v !== SECTION_DELETED_SENTINEL && v.trim().length > 0;
             })();
             
             // --- SKILLS ---
             if (title.includes('skill')) {
                if (hasAIOverride) return; // AI override will render this section
                // Only override if user actually has data; otherwise keep template defaults.
                const hasAny = (data.skills && data.skills.length > 0) || (data.languages && data.languages.length > 0) || (data.hobbies && data.hobbies.length > 0);
                if (hasAny) {
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
                    li.innerHTML = `<b>Non-Technical:</b> ${data.hobbies.join(', ')}`;
                    ul.appendChild(li);
                  }
                  section.appendChild(ul);
                }
             }
             
             // --- EXPERIENCE ---
             else if (title.includes('experience')) {
                if (hasAIOverride) return; // AI override will render this section
                if (data.experience && data.experience.length > 0) {
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
             }
             
             // --- EDUCATION ---
             else if (title.includes('education')) {
                if (hasAIOverride) return; // AI override will render this section
                if (data.education && data.education.length > 0) {
                  while(h2.nextSibling) { h2.nextSibling.remove(); }
                  
                  (data.education || []).forEach(edu => {
                     const lines = [];
                     if (edu.degree) lines.push(`Graduation: ${edu.degree}`);
                     if (edu.institution) lines.push(`College: ${edu.institution}`);
                     if (edu.startDate || edu.endDate) lines.push(`year: ${edu.startDate || ''} – ${edu.endDate || ''}`);
                     if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
                     if (edu.description) lines.push(`Electives / Subjects: ${edu.description}`);
                     lines.forEach((text) => {
                       const p = doc.createElement('p');
                       p.textContent = text;
                       section.appendChild(p);
                     });
                  });
                }
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
          // IMPORTANT: Do NOT use resume.achievements here.
          // SaarthiX Special 2 has a dedicated "My DNA" editor (template overrides).
          // Mixing resume.achievements into DNA creates confusion between the two.
          // We leave #container-dna as-is so AI/templateOverrides can update it.

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

          // 6. Skills (Technical + Non-Technical)
          const skillsContainer = doc.getElementById('container-skills');
          if (skillsContainer) {
            skillsContainer.innerHTML = '';
            const nonTechnicalCombined = [
              ...(data.hobbies || []),
              ...(data.languages || []),
            ].filter(Boolean);

            if (data.skills && data.skills.length) {
              const li = doc.createElement('li');
              li.innerHTML = `<b>Technical:</b> ${data.skills.join(', ')}`;
              skillsContainer.appendChild(li);
            }
            if (nonTechnicalCombined.length) {
              const li = doc.createElement('li');
              li.innerHTML = `<b>Non-Technical:</b> ${nonTechnicalCombined.join(', ')}`;
              skillsContainer.appendChild(li);
            }
          }

          // 7. Achievements (separate from My DNA)
          const achContainer = doc.getElementById('container-achievements');
          if (achContainer && data.achievements && data.achievements.length) {
            achContainer.innerHTML = '';
            data.achievements.forEach(ach => {
              const li = doc.createElement('li');
              li.innerHTML = ach.includes(':')
                ? `<b>${ach.split(':')[0]}:</b> ${ach.split(':').slice(1).join(':')}`
                : ach;
              achContainer.appendChild(li);
            });
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
              title.textContent = edu.degree ? `Graduation: ${edu.degree}` : 'Graduation:';
              eduContainer.appendChild(title);

              const ul = doc.createElement('ul');
              if (edu.institution) ul.innerHTML += `<li><b>College:</b> ${edu.institution}</li>`;
              if (edu.startDate || edu.endDate) ul.innerHTML += `<li><b>year:</b> ${edu.startDate || ''} – ${edu.endDate || ''}</li>`;
              if (edu.gpa) ul.innerHTML += `<li><b>GPA:</b> ${edu.gpa}</li>`;
              if (edu.description) ul.innerHTML += `<li><b>Electives / Subjects:</b> ${edu.description}</li>`;

              eduContainer.appendChild(ul);
            });
          }
        }

        if (data.summary) {
          const isSaarthix = doc.querySelector('.resume') && doc.querySelector('.left') && doc.querySelector('.right');
          const isSaarthix2 = doc.querySelector('.resume.layout-saarthix-2');
          const headings = Array.from(doc.querySelectorAll('h1,h2,h3,.section-header,.section-title'));
          const summaryHeading = headings.find((h) => {
            if (isSaarthix && h.closest('.left')) return false; // Left "Profile" is fixed template bio unless user summary replaces it above
            if (isSaarthix && h.closest('.right')) return false;
            if (isSaarthix2) return false;
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

      // Experience is now rendered directly from resume.experience by bindImportedTemplate.
      // Strip any leftover AI-generated override for the experience selector so the old
      // "template defaults + user entry" duplicate HTML never surfaces again.
      // Preserve SECTION_DELETED_SENTINEL in case the user deleted the section.
      const overrides = { ...(resume.templateOverrides || {}) };
      const EXP_SELECTOR = '.right .section:nth-of-type(3)';
      const SKILLS_SELECTOR = '.right .section:nth-of-type(2)';
      if (overrides[EXP_SELECTOR] && overrides[EXP_SELECTOR] !== SECTION_DELETED_SENTINEL) {
        delete overrides[EXP_SELECTOR];
      }
      if (overrides[SKILLS_SELECTOR] && overrides[SKILLS_SELECTOR] !== SECTION_DELETED_SENTINEL) {
        delete overrides[SKILLS_SELECTOR];
      }

      html = applyTemplateOverrides(html, overrides);

      // SaarthiX Special 2: contact info is hard-rendered from resume data in
      // bindImportedTemplate, but AI overrides on ".contact" can clobber parts
      // of it. Re-apply contact deterministically after overrides so phone,
      // LinkedIn, and location always reflect the latest form data.
      if (resume?.templateId === 'saarthix-special-2') {
        try {
          const pdoc = new DOMParser().parseFromString(html, 'text/html');
          const contactEl = pdoc.querySelector('.contact');
          if (contactEl) {
            const parts = [];
            if (data.email) parts.push(`Email: ${data.email}`);
            if (data.phone) parts.push(`Phone: ${data.phone}`);
            if (data.linkedin) parts.push(`LinkedIn: ${data.linkedin.replace(/^https?:\/\//, '')}`);
            if (data.location) parts.push(data.location);
            contactEl.textContent = parts.join(' | ');
          }

          // Re-apply Skills too: AI/templateOverrides on special-2 can clobber
          // our deterministic resume-data skills rendering.
          const skillsContainer = pdoc.getElementById('container-skills');
          if (skillsContainer) {
            skillsContainer.innerHTML = '';
            const nonTechnicalCombined = [
              ...(data.hobbies || []),
              ...(data.languages || []),
            ].filter(Boolean);

            if (data.skills && data.skills.length) {
              const li = pdoc.createElement('li');
              li.innerHTML = `<b>Technical:</b> ${data.skills.join(', ')}`;
              skillsContainer.appendChild(li);
            }
            if (nonTechnicalCombined.length) {
              const li = pdoc.createElement('li');
              li.innerHTML = `<b>Non-Technical:</b> ${nonTechnicalCombined.join(', ')}`;
              skillsContainer.appendChild(li);
            }
          }

          html = '<!DOCTYPE html>\n' + pdoc.documentElement.outerHTML;
        } catch (_) { /* ignore */ }
      }

      // Re-inject tagline from aiFormData — tagline bypasses AI to protect the name
      // elements in the same .header container. This runs after applyTemplateOverrides
      // so it always wins regardless of what AI may have stored previously.
      const aiTagline = resume.aiFormData?.['.header__tagline'];
      if (aiTagline) {
        try {
          const tdoc = new DOMParser().parseFromString(html, 'text/html');
          const taglineEl = tdoc.querySelector('.tagline');
          if (taglineEl && taglineEl.textContent !== aiTagline) {
            taglineEl.textContent = aiTagline;
            html = '<!DOCTYPE html>\n' + tdoc.documentElement.outerHTML;
          }
        } catch (_) { /* ignore */ }
      }

      // Re-inject Key Recognitions from aiFormData — its section selector is the whole
      // ".left" column, so we bypass AI and inject the list directly after overrides.
      const aiRecognitions = resume.aiFormData?.['.left__recognitions'];
      if (aiRecognitions) {
        try {
          const rdoc = new DOMParser().parseFromString(html, 'text/html');
          const keyRecH2 = Array.from(rdoc.querySelectorAll('.left h2'))
            .find(h2 => /key recognitions/i.test(h2.textContent));
          if (keyRecH2) {
            const nextEl = keyRecH2.nextElementSibling;
            const items = aiRecognitions.split('\n').map(s => s.trim()).filter(Boolean);
            if (items.length > 0) {
              if (nextEl && nextEl.tagName === 'UL') {
                nextEl.innerHTML = '';
                items.forEach(item => {
                  const li = rdoc.createElement('li');
                  li.textContent = item;
                  nextEl.appendChild(li);
                });
              } else {
                // Create a new UL if none exists after the h2
                const ul = rdoc.createElement('ul');
                items.forEach(item => {
                  const li = rdoc.createElement('li');
                  li.textContent = item;
                  ul.appendChild(li);
                });
                keyRecH2.insertAdjacentElement('afterend', ul);
              }
              html = '<!DOCTYPE html>\n' + rdoc.documentElement.outerHTML;
            }
          }
        } catch (_) { /* ignore */ }
      }

      // Final skills sync (post-overrides): ensures the Skills section reflects
      // latest form values even if a stale AI override slipped in.
      try {
        const sdoc = new DOMParser().parseFromString(html, 'text/html');
        const skillsSection = Array.from(sdoc.querySelectorAll('.right .section')).find((sec) => {
          const h = sec.querySelector('h2');
          return h && /skill/i.test(String(h.textContent || ''));
        });
        if (skillsSection) {
          const h2 = skillsSection.querySelector('h2');
          const hasAny = (data.skills && data.skills.length > 0) || (data.languages && data.languages.length > 0) || (data.hobbies && data.hobbies.length > 0);
          if (h2 && hasAny) {
            while (h2.nextSibling) h2.nextSibling.remove();
            const ul = sdoc.createElement('ul');
            if (data.skills && data.skills.length > 0) {
              const li = sdoc.createElement('li');
              li.innerHTML = `<b>Technical:</b> ${data.skills.join(', ')}`;
              ul.appendChild(li);
            }
            if (data.hobbies && data.hobbies.length > 0) {
              const li = sdoc.createElement('li');
              li.innerHTML = `<b>Non-Technical:</b> ${data.hobbies.join(', ')}`;
              ul.appendChild(li);
            }
            if (data.languages && data.languages.length > 0) {
              const li = sdoc.createElement('li');
              li.innerHTML = `<b>Languages:</b> ${data.languages.join(', ')}`;
              ul.appendChild(li);
            }
            skillsSection.appendChild(ul);
            html = '<!DOCTYPE html>\n' + sdoc.documentElement.outerHTML;
          }
        }
      } catch (_) { /* ignore */ }

      // Re-inject profile image after overrides — applyTemplateOverrides may have
      // clobbered the .photo section if stale override data existed before the
      // "image bypasses AI" fix.  This is a belt-and-suspenders guard.
      const profileImageSrc = resume.personalInfo?.profileImage;
      if (profileImageSrc || true /* always run so placeholder is restored */) {
        try {
          const pdoc = new DOMParser().parseFromString(html, 'text/html');
          const photoImg = pdoc.querySelector('.photo img, #resume-container .photo img');
          if (photoImg) {
            const src = profileImageSrc || PROFILE_PLACEHOLDER_DATA_URI;
            if (photoImg.getAttribute('src') !== src) {
              photoImg.setAttribute('src', src);
              html = '<!DOCTYPE html>\n' + pdoc.documentElement.outerHTML;
            }
          }
        } catch (_) { /* ignore parse errors */ }
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

  // Notify parent whenever the rendered HTML changes (used by the PDF export button).
  useEffect(() => {
    if (renderedHTML && typeof onRenderedHTMLChange === 'function') {
      onRenderedHTMLChange(renderedHTML);
    }
  }, [renderedHTML, onRenderedHTMLChange]);

  if (!template) {
    return (
      <div className="border p-4 min-h-[600px] flex items-center justify-center">
        <p className="text-gray-500">Loading template preview...</p>
      </div>
    );
  }

  const handlePrintPreview = () => {
    if (!renderedHTML) return;
    // Use the already-rendered HTML which has all overrides (including deleted sections)
    // correctly applied. Inject page-break CSS and a Print/Close toolbar.
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(prepareForOutput(renderedHTML, true));
    printWindow.document.close();
    // Do NOT call window.print() — user sees a full preview and can print themselves.
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100 rounded-lg shadow" style={{ minHeight: 0 }}>
      <div className="flex justify-between items-center p-4 border-b bg-white rounded-t-lg flex-shrink-0">
        <h3 className="text-sm font-medium text-gray-700">
          A4 Preview
          {template?.name ? <span className="text-gray-400"> — {template.name}</span> : null}
        </h3>
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
            ref={iframeRef}
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

                  // Enable click-to-edit navigation: clicking a section in the preview
                  // opens that section's form in the left panel (AI editor).
                  if (typeof onSectionClick === 'function') {

                    // Remove previous handler (if any)
                    if (iframe.__sxClickHandler) {
                      iframeDoc.removeEventListener('click', iframe.__sxClickHandler, true);
                    }

                    const computeDistance = (fromEl, toEl) => {
                      let steps = 0;
                      let cur = fromEl;
                      while (cur && cur !== toEl && steps < 50) {
                        cur = cur.parentElement;
                        steps += 1;
                      }
                      return cur === toEl ? steps : Number.POSITIVE_INFINITY;
                    };

                    const inferTypeFromText = (txt) => {
                      const t = (txt || '').toLowerCase();
                      if (/(contact|phone|email|linkedin)/i.test(t)) return 'contact';
                      if (/(summary|about|profile|synopsis)/i.test(t)) return 'summary';
                      if (/(experience|employment|work)/i.test(t)) return 'experience';
                      if (/(education|qualification|academic)/i.test(t)) return 'education';
                      if (/(skills|tools|technolog)/i.test(t)) return 'skills';
                      if (/(project)/i.test(t)) return 'projects';
                      if (/(certif|training)/i.test(t)) return 'certifications';
                      if (/(achievement|award|recognition|dna)/i.test(t)) return 'achievements';
                      return null;
                    };

                    const buildCandidates = () => {
                      const fromSchema = (template?.templateSchema?.sections || [])
                        .filter(s => s?.selector && typeof s.selector === 'string')
                        .map(s => ({ selector: s.selector, title: s.title || '', type: s.type || null }));
                      if (fromSchema.length) return fromSchema;

                      const scanned = scanTemplateSections(template?.templateConfig?.html || '');
                      return scanned.map(s => ({
                        selector: s.selector,
                        title: s.title || '',
                        type: inferTypeFromText(s.title || '')
                      }));
                    };

                    const handler = (evt) => {
                      // Ignore modified clicks / text selection drags
                      if (evt.defaultPrevented || evt.metaKey || evt.ctrlKey || evt.altKey || evt.shiftKey) return;
                      const target = evt.target;
                      if (!(target instanceof iframeDoc.defaultView.HTMLElement)) return;

                      if (resume?.templateId === 'saarthix-special-1') {
                        const sx = resolveSaarthixSpecial1EditorSection(target, iframeDoc);
                        if (sx?.title) {
                          evt.preventDefault();
                          evt.stopPropagation();
                          onSectionClick(sx);
                          return;
                        }
                      }

                      const candidates = buildCandidates();
                      if (!candidates.length) return;

                      // Find closest matching section container by selector.
                      let best = null; // { cand, dist }
                      for (const cand of candidates) {
                        try {
                          const matched = target.closest(cand.selector);
                          if (!matched) continue;
                          const dist = computeDistance(target, matched);
                          if (!best || dist < best.dist) best = { cand, dist };
                        } catch {
                          // ignore invalid selector
                        }
                      }

                      if (best?.cand?.selector) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        onSectionClick({ selector: best.cand.selector, title: best.cand.title });
                        return;
                      }

                      // Fallback: infer from container headings when selector matching fails.
                      const container =
                        target.closest('[data-section]') ||
                        target.closest('section') ||
                        target.closest('.section') ||
                        target;
                      const heading =
                        container?.querySelector?.('h1,h2,h3,.section-title,.section-header,.container-block-title') ||
                        target.closest('h1,h2,h3,.section-title,.section-header,.container-block-title');
                      const inferred = inferTypeFromText(heading?.textContent || '');
                      if (!inferred) return;

                      const byType = candidates.find(c => c.type === inferred) || candidates.find(c => inferTypeFromText(c.title) === inferred);
                      if (byType?.selector) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        onSectionClick({ selector: byType.selector, title: byType.title });
                      }
                    };

                    iframe.__sxClickHandler = handler;
                    iframeDoc.addEventListener('click', handler, true);
                  }
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
