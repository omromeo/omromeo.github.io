fetch("assets/html/main-footer.html")
  .then(response => response.text())
  .then(data => {
    document.body.insertAdjacentHTML("beforeend", data);
  });
