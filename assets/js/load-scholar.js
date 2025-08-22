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
