// Simple BibTeX parser for HTML display
async function loadPublications() {
  const response = await fetch('data/publications.bib');
  const bibtex = await response.text();

  // Split entries by "@"
  const entries = bibtex.split('@').slice(1);

  let html = '<ul class="pub-list">';
  entries.forEach(entry => {
    const type = entry.split('{')[0].trim();
    const content = entry.substring(entry.indexOf('{') + 1);
    const fields = {};

    content.split(',\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        const key = parts[0].trim().toLowerCase();
        const value = parts[1].trim().replace(/[{}"]/g, '');
        fields[key] = value;
      }
    });

    let citation = '';
    if (fields.author) citation += `<strong>${fields.author}</strong>. `;
    if (fields.year) citation += `(${fields.year}). `;
    if (fields.title) citation += `<em>${fields.title}</em>. `;
    if (fields.journal) citation += `${fields.journal}. `;
    if (fields.school) citation += `${fields.school}. `;
    if (fields.doi) citation += `<a href="https://doi.org/${fields.doi}">DOI</a>. `;
    if (fields.url && !fields.doi) citation += `<a href="${fields.url}">Link</a>. `;

    html += `<li>${citation}</li>`;
  });
  html += '</ul>';

  document.getElementById('publications-list').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadPublications);
