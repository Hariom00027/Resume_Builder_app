export function scanTemplateSections(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const sections = [];

  // Bug 3.3 fixed: track both selectors AND titles to avoid duplicate title entries.
  const seenSelectors = new Set();
  const seenTitles = new Set();

  const pushIfFound = (selector, title) => {
    if (seenSelectors.has(selector) || seenTitles.has(title)) return;
    const el = doc.querySelector(selector);
    if (!el) return;
    const content = el.innerHTML || '';
    sections.push({ selector, title, content });
    seenSelectors.add(selector);
    seenTitles.add(title);
  };

  // Common IDs (many templates use these)
  pushIfFound('#contact', 'Contact');
  // Only one "Skills" section — prefer #technical-skills, fall back to #skills
  pushIfFound('#technical-skills', 'Skills');
  pushIfFound('#skills', 'Skills');
  // Only one "Professional Experience" section
  pushIfFound('#employment', 'Professional Experience');
  pushIfFound('#experience', 'Professional Experience');
  pushIfFound('#education', 'Education');
  pushIfFound('#projects', 'Projects');
  pushIfFound('#summary', 'Summary');
  pushIfFound('#about', 'About');

  // Orbit theme and similar
  pushIfFound('.contact-container', 'Contact');
  pushIfFound('.summary-section .summary', 'Summary');
  pushIfFound('.education-container', 'Education');

  // Work experience section in orbit-like templates
  const expSection = Array.from(doc.querySelectorAll('.experiences-section')).find((s) =>
    /work experience/i.test(s.textContent || '')
  );
  if (expSection && !seenTitles.has('Professional Experience')) {
    sections.push({ selector: '.experiences-section', title: 'Professional Experience', content: expSection.innerHTML || '' });
    seenTitles.add('Professional Experience');
    seenSelectors.add('.experiences-section');
  }

  // If nothing matched, fall back to top-level <section> blocks with a heading
  if (sections.length === 0) {
    const candidates = Array.from(doc.querySelectorAll('section'));
    candidates.forEach((sec, idx) => {
      const selector = `section:nth-of-type(${idx + 1})`;
      const heading =
        sec.querySelector('h1,h2,h3,.section-title,.section-header,.container-block-title')?.textContent?.trim() ||
        `Section ${idx + 1}`;
      if (!seenSelectors.has(selector) && !seenTitles.has(heading)) {
        sections.push({ selector, title: heading, content: sec.innerHTML || '' });
        seenSelectors.add(selector);
        seenTitles.add(heading);
      }
    });
  }

  return sections;
}

export function applyTemplateOverrides(html, overrides) {
  if (!overrides || typeof overrides !== 'object') return html;
  
  // If there's a full template override (from AI editor), use it directly
  if (overrides.__fullTemplate__ && typeof overrides.__fullTemplate__ === 'string') {
    return overrides.__fullTemplate__;
  }
  
  const entries = Object.entries(overrides).filter(([k, v]) => 
    k !== '__fullTemplate__' && typeof v === 'string' && v.trim().length > 0
  );
  if (entries.length === 0) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  for (const [selector, overrideHtml] of entries) {
    try {
      const el = doc.querySelector(selector);
      if (el && overrideHtml) {
        // Preserve the element's classes, id, and other attributes
        // Only replace the inner content - this maintains CSS styling and positioning
        el.innerHTML = overrideHtml;
      }
    } catch (e) {
      console.warn(`Failed to apply override for selector: ${selector}`, e);
    }
  }

  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}
