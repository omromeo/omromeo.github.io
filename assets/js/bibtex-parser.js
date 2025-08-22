// Enhanced BibTeX parser with year grouping, sorting, and LaTeX accent handling

const latexAccents = {
  "\\'a": "á",
  "\\'e": "é",
  "\\'i": "í",
  "\\'o": "ó",
  "\\'u": "ú",
  "\\'A": "Á",
  "\\'E": "É",
  "\\'I": "Í",
  "\\'O": "Ó",
  "\\'U": "Ú",
  "\\~n": "ñ",
  "\\~N": "Ñ",
  '\\"o': "ö",
  '\\"u': "ü",
  "\\`a": "à",
  "\\`e": "è"
  // add more if needed
};

function convertLatexAccents(str) {
  let result = str;
  for (const key in latexAccents) {
    const regex = new RegExp(key, 'g');
    result = result.replace(regex, latexAccents[key]);
  }
  // remove remaining braces
  result = result.replace(/[{}]/g, '');
  return result;
}

// Function to ignore small words for title capitalization
function toTitleCase(str) {
    const smallWords = ['and', 'or', 'the', 'of', 'in', 'on', 'with', 'a', 'an', 'for', 'to', 'sunRunner3D'];
    return str.split(' ').map((word, index) => {
        if (index === 0 || !smallWords.includes(word.toLowerCase())) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        } else {
            return word.toLowerCase();
        }
    }).join(' ');
}

// Load Google Scholar metrics from local JSON
async function loadScholarMetrics() {
  try {
    const response = await fetch('data/google-scholar.json');
    const data = await response.json();
    document.getElementById('scholar-sidebar').innerHTML = `
      <p><strong>H-index:</strong> ${data.hindex}</p>
      <p><strong>Citations:</strong> ${data.citations}</p>
    `;
  } catch (err) {
    console.error('Error loading scholar metrics:', err);
    document.getElementById('scholar-sidebar').innerText = 'Unable to load metrics';
  }
}

async function loadPublications() {
  const response = await fetch('data/publications.bib');
  if (!response.ok) {
    console.error('Failed to load bib file', response.status);
    return;
  }
  const bibtex = await response.text();

  const entries = bibtex.split('@').slice(1);
  const parsed = [];

  entries.forEach(entry => {
    const type = entry.split('{')[0].trim().toLowerCase();
    const content = entry.substring(entry.indexOf('{') + 1);
    const fields = { _type: type };

    content.split(',\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        const key = parts[0].trim().toLowerCase();
        let value = parts[1].trim();
        value = convertLatexAccents(value);
        fields[key] = value;
      }
    });

    parsed.push(fields);
  });

  // Sort by year descending
  parsed.sort((a, b) => (b.year || 0) - (a.year || 0));

  // Group by year
  const grouped = {};
  parsed.forEach(pub => {
    const year = pub.year || "No Year";
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(pub);
  });

  // Generate HTML
  let html = '';
  Object.keys(grouped).sort((a, b) => Number(b) - Number(a)).forEach(year => {
    html += `<h2>${year}</h2><ul class="pub-list">`;
    grouped[year].forEach(fields => {
      let citation = '';

      if (fields.author) {
        // Replace "and" with commas
        let authors = fields.author.replace(/\s+and\s+/g, ', ');
        // Replace "others" with <em>et al.</em>
        authors = authors.replace(/\bothers\b/gi, '<em>et al.</em>');
        // Bold your name if present
        authors = authors.replace(/(Romeo, O\. M\.)/, '<strong>$1</strong>');
        citation += `${authors} `;
      }

      if (fields.year) citation += `(${fields.year}). `;
      if (fields.title) citation += `${toTitleCase(fields.title)}. `;

      if (fields._type === 'article' && fields.journal) {
        citation += `<em>${toTitleCase(fields.journal)}</em>`;
        if (fields.volume) citation += `, ${fields.volume}`;
        if (fields.number) citation += `(${fields.number})`;
        if (fields.pages) citation += `, ${fields.pages}.`;
      } else if (fields._type === 'inproceedings' && fields.booktitle) {
        citation += `<em>${toTitleCase(fields.booktitle)}</em>`;
        if (fields.volume) citation += `, ${fields.volume}`;
        if (fields.number) citation += `(${fields.number})`;
        if (fields.pages) citation += `, ${fields.pages}.`;
      } else if (fields.journal) {
        citation += `<em>${fields.journal}</em>. `;
      }

      if (fields.school) citation += `${toTitleCase(fields.school)}. `;
      if (fields.doi) citation += ` <a href="https://doi.org/${fields.doi}">DOI</a>. `;
      if (fields.url && !fields.doi) citation += `<a href="${fields.url}"> URL</a>. `;

      html += `<li>${citation}</li>`;
    });
    html += `</ul>`;
  });

  document.getElementById('publications-list').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadPublications);
