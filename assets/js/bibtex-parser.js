// Enhanced BibTeX parser with year grouping and sorting
async function loadPublications() {
  const response = await fetch('data/publications.bib');
  const bibtex = await response.text();

  // Split entries by "@"
  const entries = bibtex.split('@').slice(1);
  const parsed = [];

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

    parsed.push(fields);
  });

  // Sort by year (descending)
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
  Object.keys(grouped).sort((a, b) => b - a).forEach(year => {
    html += `<h2>${year}</h2><ul class="pub-list">`;
    grouped[year].forEach(fields => {
      // Format authors
      let authors = fields.author ? fields.author.split(' and ').map(a => a.trim()) : [];
      const yourName = "Romeo, O. M.";
      let formattedAuthors = '';

      if (authors.includes(yourName)) {
        let others = authors.filter(a => a !== yourName);
        if (authors.length > 4) {
          formattedAuthors = others.slice(0, 1).join(', ') + ', ..., <strong>' + yourName + '</strong>, <em>et al.</em>';
        } else {
          formattedAuthors = others.join(', ') + (others.length ? ', ' : '') + '<strong>' + yourName + '</strong>';
        }
      } else {
        formattedAuthors = authors.join(', ');
      }

      // Format rest of citation
      let citation = '';
      if (formattedAuthors) citation += formattedAuthors + '. ';
      if (fields.year) citation += `(${fields.year}). `;
      if (fields.title) citation += `<em>${fields.title}</em>. `;
      if (fields.journal) citation += `<em>${fields.journal}</em>, `;
      if (fields.volume) {
        citation += `<em>${fields.volume}`;
        if (fields.number) citation += `(${fields.number})`;
        citation += `</em>, `;
      }
      if (fields.pages) citation += `${fields.pages}. `;
      if (fields.doi) citation += `<a href="https://doi.org/${fields.doi}">DOI</a>. `;
      if (fields.url && !fields.doi) citation += `<a href="${fields.url}">Link</a>. `;

      html += `<li>${citation}</li>`;
    });
    html += `</ul>`;
  });

  document.getElementById('publications-list').innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadPublications);
