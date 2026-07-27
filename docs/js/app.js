function loadPage(page) {
    fetch("pages/" + page + ".html")
        .then(res => res.text())
        .then(html => {
            document.getElementById("app").innerHTML = html;
        });
}

// default page
loadPage("home");