// ===== Utilities =====
const latexAccents = {
  "\\'a": "á","\\'e": "é","\\'i": "í","\\'o": "ó","\\'u": "ú",
  "\\'A": "Á","\\'E": "É","\\'I": "Í","\\'O": "Ó","\\'U": "Ú",
  "\\~n": "ñ","\\~N": "Ñ",
  '\\"a': "ä", '\\"o': "ö", '\\"u': "ü", '\\"A': "Ä", '\\"O': "Ö", '\\"U': "Ü",
  "\\`a": "à","\\`e": "è","\\`i": "ì","\\`o": "ò","\\`u": "ù",
  "\\c{c}": "ç", "\\c{C}": "Ç"
};

function convertLatexAccents(str) {
  if (!str) return '';
  let result = str;
  for (const key in latexAccents) {
    const re = new RegExp(key, 'g');
    result = result.replace(re, latexAccents[key]);
  }
  // strip surrounding braces/quotes that BibTeX often uses
  result = result.replace(/^[\s"{]+|[\s"}]+$/g, '');
  // remove any remaining naked braces
  result = result.replace(/[{}]/g, '');
  return result;
}

function toTitleCase(str) {
  if (!str) return '';
  const small = ['and','or','the','of','in','on','with','a','an','for','to'];
  return str
    .split(/\s+/)
    .map((w, i) => (i === 0 || !small.includes(w.toLowerCase()))
      ? w.charAt(0).toUpperCase() + w.slice(1)
      : w.toLowerCase())
    .join(' ');
}

// ===== BibTeX parsing =====
// Matches key = {value} or "value" possibly across lines (simple, non-nested)
const FIELD_RE = /(\w+)\s*=\s*(\{([^]*?)\}|"([^"]*?)")\s*,?/gms;

async function loadPublications() {
  const response = await fetch('data/publications.bib');
  if (!response.ok) {
    console.error('Failed to load bib file', response.status);
    const el = document.getElementById('publications-list');
    if (el) el.textContent = 'Failed to load publications.';
    return;
  }
  const bibtex = await response.text();

  // Split entries on @, skip empty chunk before first @
  const chunks = bibtex.split('@').slice(1);
  const pubs = [];

  for (const chunk of chunks) {
    const type = chunk.split('{')[0].trim().toLowerCase(); // article, inproceedings, etc.
    // everything after first { up to end; we'll regex fields out of it
    const content = chunk.substring(chunk.indexOf('{') + 1);

    const fields = { _type: type };
    let m;
    FIELD_RE.lastIndex = 0; // reset regex state for each entry
    while ((m = FIELD_RE.exec(content)) !== null) {
      const key = m[1].toLowerCase();
      const rawVal = (m[3] ?? m[4] ?? '').trim();
      fields[key] = convertLatexAccents(rawVal);
    }

    pubs.push(fields);
  }

  // Sort newest first by numeric year (fallback 0)
  pubs.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));

  // Assign custom reverse numbers (oldest = 1, newest = N)
  const total = pubs.length;
  pubs.forEach((p, i) => { p._n = total - i; });

  // Group by year for headings (numbering stays global)
  const byYear = {};
  for (const p of pubs) {
    const y = p.year || 'No Year';
    (byYear[y] ||= []).push(p);
  }

  // Build HTML (no bullets; explicit numbers)
  let html = '<div class="pub-list">';
  for (const year of Object.keys(byYear).sort((a,b) => Number(b) - Number(a))) {
    html += `<h2>${year}</h2>`;
    for (const f of byYear[year]) {
      let citation = '';

      // Authors
      if (f.author) {
        let authors = f.author
          .replace(/\s+and\s+/g, ', ')
          .replace(/\bothers\b/gi, '<em>et al.</em>');
        // Bold your name (adjust pattern to match your BibTeX exactly)
        authors = authors.replace(/(Romeo,\s*O\.?\s*M\.?)/, '<strong>$1</strong>');
        citation += `${authors} `;
      }

      if (f.year) citation += `(${f.year}). `;

      if (f.title) citation += `${toTitleCase(f.title)}. `;

      // Venue formatting
      if (f._type === 'article' && f.journal) {
        citation += `<em>${toTitleCase(f.journal)}</em>`;
        if (f.volume) citation += `, ${f.volume}`;
        if (f.number) citation += `(${f.number})`;
        if (f.pages)  citation += `, ${f.pages}`;
        citation += `. `;
      } else if (f._type === 'inproceedings' && f.booktitle) {
        citation += `<em>${toTitleCase(f.booktitle)}</em>`;
        if (f.volume) citation += `, ${f.volume}`;
        if (f.number) citation += `(${f.number})`;
        if (f.pages)  citation += `, ${f.pages}`;
        citation += `. `;
      } else if (f.journal) {
        citation += `<em>${f.journal}</em>. `;
      } else if (f.school) {
        citation += `${toTitleCase(f.school)}. `;
      }

      if (f.doi) citation += `<a href="https://doi.org/${f.doi}" target="_blank" rel="noopener">DOI</a>. `;
      if (f.url && !f.doi) citation += `<a href="${f.url}" target="_blank" rel="noopener">Link</a>. `;

      html += `
        <div class="pub-item">
          <span class="pub-number">${f._n}.</span>
          <span class="pub-citation">${citation}</span>
        </div>`;
    }
  }
  html += '</div>';

  const mount = document.getElementById('publications-list'); // <-- keep your existing id
  if (!mount) {
    console.error('Missing #publications-list element in HTML');
    return;
  }
  mount.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadPublications);
