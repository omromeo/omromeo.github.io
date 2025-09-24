//============================================================
// Outreach Parser: loads JSON, groups by year, renders with icons
//============================================================

// Map outreach categories to Font Awesome icons
const categoryIcons = {
  "community": "fa-solid fa-people-group",
  "outreach": "fa-solid fa-people-group",
  "talk": "fa-solid fa-chalkboard-teacher",
  "workshop": "fa-solid fa-chalkboard-teacher",  
  "news": "fa-regular fa-newspaper",
  "media": "fa-regular fa-newspaper",
  "leadership": "fa-solid fa-id-card-clip",
  "service": "fa-solid fa-id-card-clip",
  "default": "fa-solid fa-circle-dot"
};

//============================================================
// Load Outreach JSON
//============================================================
async function loadOutreach() {
  try {
    const response = await fetch("data/outreach/omromeo_outreach.json");
    if (!response.ok) throw new Error("Failed to load outreach.json");

    const entries = await response.json();

    // Sort by year descending
    entries.sort((a, b) => Number(b.year) - Number(a.year));

    let lastYear = null;
    let html = "";

    entries.forEach(entry => {
      // Insert year header
      if (entry.year !== lastYear) {
        if (lastYear !== null) html += "</ul>"; // close previous list
        html += `<h2 class="outreach-year">${entry.year}</h2>`;
        html += `<ul class="outreach-list">`;
        lastYear = entry.year;
      }

      // Choose icon
      const iconClass = categoryIcons[entry.category] || categoryIcons["default"];

        // Title + Role
        let itemHTML = `
        <li class="outreach-item">
            <div class="outreach-entry">
            <div class="outreach-icon"><i class="${iconClass}"></i></div>
            <div class="outreach-text">
                <strong>${entry.title}</strong> <br> 
                <em>${entry.role}</em><br/>
                <span class="outreach-desc">${entry.description}</span>
            </div>
            </div>
        `;

      // Add sub-list if present
      if (entry.list && entry.list.length > 0) {
        itemHTML += `<ul class="outreach-sublist">`;
        entry.list.forEach(outlet => {
          itemHTML += `<li><a href="${outlet.url}" target="_blank" rel="noopener noreferrer">${outlet.name}</a></li>`;
        });
        itemHTML += `</ul>`;
      }

      itemHTML += `</li>`;
      html += itemHTML;
    });

    html += "</ul>"; // close final list
    document.getElementById("outreach-list").innerHTML = html;

  } catch (error) {
    console.error("Error loading outreach:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadOutreach);
