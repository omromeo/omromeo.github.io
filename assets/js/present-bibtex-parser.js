//================================================================================
// Enhanced BibTeX parser with year grouping, sorting, and LaTeX accent handling
//================================================================================
//================================================================================
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
//================================================================================
//================================================================================
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
//================================================================================
//================================================================================
// Function to ignore small words for title capitalization
function toTitleCase(str) {
    const smallWords = ['and', 'or', 'the', 'of', 'in', 'on', 'with', 'a', 'for', 'to', 'sunRunner3D'];
    return str.split(' ').map((word, index) => {
        if (index === 0 || !smallWords.includes(word.toLowerCase())) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        } else {
            return word.toLowerCase();
        }
    }).join(' ');
}
//================================================================================
//================================================================================
async function loadPresentations() {
  //////////////////////////////////////////////////////// Get Bib Entries
  const response = await fetch('data/presentations/omromeo_presentations.bib');
  if (!response.ok) {
    console.error('Failed to load bib file', response.status);
    return;
  }
  const bibtex = await response.text();
  const entries = bibtex.split(/@/).slice(1);
  const parsed = [];
  //////////////////////////////////////////////////////// Parse Bib Entries
  entries.forEach(entry => {
    const typeMatch = entry.match(/^(\w+)\s*{\s*([^,]+),/);
    if (!typeMatch) return;
    const type = typeMatch[1].toLowerCase(); // Makes bib type ('article') lowercase
    const content = entry.substring(entry.indexOf(',') + 1); //Gets fields
    const fields = { _type: type };
    const fieldRegex = /(\w+)\s*=\s*({([^}]*)}|\"([^\"]*)\")/g; // Gets field/value pair
    // Loops through field/value matches
    let match;
    while ((match = fieldRegex.exec(content)) !== null) {
      let value = match[3] || match[4] || '';
      value = convertLatexAccents(value.trim());
      fields[match[1].toLowerCase()] = value;
    }
    // Adds the completed object (representing one BibTeX entry) into the parsed array
    parsed.push(fields);
  });
  //////////////////////////////////////////////////////// Sort Year Ascending, preserve order within same year
  parsed.sort((a, b) => {
    const yearA = Number(a.year) || 0;
    const yearB = Number(b.year) || 0;
    if (yearA !== yearB) return yearB - yearA; // newest first
    return a._index - b._index; // preserve original order for same year
  });
  // Reverse the entire array
  parsed.reverse();
  //////////////////////////////////////////////////////// Assign Sequential numbers
  parsed.forEach((pres, index) => pres._number = index + 1);
  //////////////////////////////////////////////////////// Render a single ol (ordered list), newest first visually
  let lastYear = null;
  let html = '';
  for (let i = parsed.length - 1; i >= 0; i--) { // Iterate bib list
    const fields = parsed[i];
    let citation = '';

    // If the year has changed, insert a heading
    if (fields.year !== lastYear) {
      lastYear = fields.year;
      if (i !== parsed.length - 1) {
        html += '</ol>'; // close previous year’s list
      }
      html += `<h2 class="pres-year">${lastYear}</h2>`;
      html += '<ol class="pres-list">'; // start a new list for this year
    }

    ////////////////////////////////////////////////// Check author value
    if (fields.author) {
    // Split authors by "and" and trim spaces
    let authorsArr = fields.author.split(/\s+and\s+/).map(a => a.trim());

    // Replace any literal "others" with <em>et al.</em>
    authorsArr = authorsArr.map(a => a.toLowerCase() === "others" ? "<em>et al.</em>" : a);

    // Find index of "Romeo, O. M."
    const romeoIndex = authorsArr.findIndex(a => /Romeo, O\. M\./.test(a));

    let formattedAuthors = [];

    // Handle authors before Romeo
    if (romeoIndex > 2) {
      formattedAuthors.push(
        authorsArr.slice(0, 1).join(', '),
        '[...]',
        '<strong>Romeo, O. M.</strong>'
      );
    } else {
      formattedAuthors.push(
        ...authorsArr.slice(0, romeoIndex).map(a => a),
        '<strong>Romeo, O. M.</strong>'
      );
    }

    // Handle authors after Romeo
    const afterRomeo = authorsArr.slice(romeoIndex + 1);
    if (afterRomeo.length > 0) {
      formattedAuthors.push(
        ...afterRomeo.slice(0, 0).map(a => a),
        '<em>et al.</em>'
      );
    } else {
      formattedAuthors.push(...afterRomeo.map(a => a));
    }

    // Join final list with commas
    let authors = formattedAuthors.join(', ');

    // Just in case "others" slipped through anywhere
    authors = authors.replace(/\bothers\b/gi, '<em>et al.</em>');

    citation += `${authors} `;
  }
    // Month, Year & Title
    if (fields.month && fields.year) citation += `(${toTitleCase(fields.month)} ${fields.year}). `;
    else if (fields.year) citation += `(${fields.year}). `;
    if (fields.title) citation += `<em>${toTitleCase(fields.title)}</em>. `;

    if (fields._type === 'inproceedings' && fields.booktitle) {
      citation += `<em>${toTitleCase(fields.booktitle)}</em>`;
      if (fields.volume) citation += `, ${fields.volume}`;
      if (fields.number) citation += `(${fields.number})`;
      if (fields.pages) citation += `, ${fields.pages}.`;
    } else if (fields.journal) {
      citation += `<em>${fields.journal}</em>. `;
    }

    if (fields.presentation) citation += `${fields.presentation} at `;
    if (fields.conference) citation += `${fields.conference}, `;
    
    if (fields.address && fields.country) citation += `${fields.address}, `;
    else if (fields.address) citation += `${fields.address}. `;
    
    if (fields.country) citation += `${fields.country}. `;
    if (fields.abstractid) citation += `<em>Abstract ID: ${fields.abstractid}</em>. `;
    if (fields.doi) citation += ` <a href="https://doi.org/${fields.doi}" target="_blank" rel="noopener noreferrer">doi</a>. `;
    if (fields.url && !fields.doi) citation += ` <a href="${fields.url}" target="_blank" rel="noopener noreferrer">url</a>. `;

    // Add a symbol for international presentations
    let symbol = '';
    if (fields.scope && fields.scope.toLowerCase() === 'international') {
        symbol = '🌍 '; // example: globe emoji
    }
    // Add a symbol for student presentations
    let studentsymbol = '';
    if (fields.student) {
        studentsymbol = '⭐ ';
    }
    // Add a symbol for student presentations
    let phdsymbol = '';
    if (fields.thesis) {
        phdsymbol = '🎓 ';
    }
    // Add the citation to the HTML with the symbol
    html += `<li value="${fields._number}">${studentsymbol}${symbol}${phdsymbol}${citation}</li>`;

  }
  html += '</ol>'; // Close list
  document.getElementById('presentations-list').innerHTML = html;
}
document.addEventListener('DOMContentLoaded', loadPresentations);