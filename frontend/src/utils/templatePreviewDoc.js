const PROFILE_PLACEHOLDER_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <defs>
    <radialGradient id="g" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#f3f4f6"/>
      <stop offset="100%" stop-color="#e5e7eb"/>
    </radialGradient>
  </defs>
  <rect width="240" height="240" fill="url(#g)"/>
  <circle cx="120" cy="92" r="44" fill="#cbd5e1"/>
  <path d="M40 214c10-44 46-72 80-72s70 28 80 72" fill="#cbd5e1"/>
  <circle cx="120" cy="120" r="108" fill="none" stroke="#e5e7eb" stroke-width="8"/>
</svg>
`).replace(/%0A/g, '');

export const PROFILE_PLACEHOLDER_DATA_URI = `data:image/svg+xml;charset=UTF-8,${PROFILE_PLACEHOLDER_SVG}`;

function injectIntoHtmlDocument(html, injection) {
  const isFull = /<!doctype|<html[\s>]/i.test(html || '');
  if (isFull) {
    if (html.includes('</head>')) return html.replace('</head>', `${injection}</head>`);
    if (html.includes('<body')) return html.replace(/<body[^>]*>/i, (m) => `<head>${injection}</head>${m}`);
    return `${injection}${html}`;
  }
  return `<!DOCTYPE html><html><head>${injection}</head><body>${html || ''}</body></html>`;
}

/**
 * Builds an iframe `srcDoc` that ensures any template <img> renders a clean
 * blank-profile placeholder (instead of broken links or missing images).
 */
export function buildTemplatePreviewSrcDoc(templateHtml) {
  const css = `
    <style>
      html, body { margin: 0; padding: 0; }
      img { object-fit: cover; }
    </style>
  `;

  // Use a script (rather than CSS-only) because many templates have <img src="">
  // and some use inline placeholders that need to be overridden.
  const js = `
    <script>
      (function () {
        var PLACEHOLDER = ${JSON.stringify(PROFILE_PLACEHOLDER_DATA_URI)};
        function normalizeSrc(src) {
          if (!src) return '';
          return String(src).trim();
        }
        function shouldReplace(src) {
          if (!src) return true;
          // Replace moustache placeholders and empty-ish values
          if (src.indexOf('{{') !== -1 || src.indexOf('}}') !== -1) return true;
          if (src === 'null' || src === 'undefined' || src === '#') return true;
          return false;
        }
        function replaceImages(root) {
          try {
            var imgs = root.querySelectorAll('img');
            for (var i = 0; i < imgs.length; i++) {
              var img = imgs[i];
              var src = normalizeSrc(img.getAttribute('src'));
              // Per request: templates that have images should show blank person image in preview.
              // So we replace missing/placeholder src AND also guard against broken loads.
              if (shouldReplace(src)) img.setAttribute('src', PLACEHOLDER);
              img.addEventListener('error', function (e) {
                try { e.target.setAttribute('src', PLACEHOLDER); } catch (_) {}
              }, { once: true });
            }
          } catch (_) {}
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function () { replaceImages(document); });
        } else {
          replaceImages(document);
        }
      })();
    </script>
  `;

  return injectIntoHtmlDocument(templateHtml || '', `${css}${js}`);
}

