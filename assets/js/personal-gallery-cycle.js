// Gallery Load
document.addEventListener("DOMContentLoaded", function() {
  const galleryContainer = document.querySelector(".personal-gallery");

  fetch("/../data/personal/personal-images.json")
    .then(response => response.json())
    .then(data => {
      data.forEach((item, index) => {
        const figure = document.createElement("figure");
        if (index === 0) figure.classList.add("active");

        const img = document.createElement("img");
        img.src = item.src;
        img.alt = item.caption;

        const caption = document.createElement("figcaption");
        caption.textContent = item.caption;

        figure.appendChild(img);
        figure.appendChild(caption);
        galleryContainer.appendChild(figure);
      });
    });
});

// Gallery Cycle
document.addEventListener("DOMContentLoaded", function() {
  let galleryIndex = 0;

  function cycleGallery() {
    const galleryFigures = document.querySelectorAll(".personal-gallery figure");
    if (!galleryFigures.length) return;

    galleryFigures[galleryIndex].classList.remove("active");
    galleryIndex = (galleryIndex + 1) % galleryFigures.length;
    galleryFigures[galleryIndex].classList.add("active");
  }

  setInterval(cycleGallery, 4500); // change every 3.5s
});
