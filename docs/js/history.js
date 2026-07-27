async function loadImports() {
    const res = await fetch("http://localhost:5002/api/imports");
    const data = await res.json();

    const container = document.getElementById("importsList");

    container.innerHTML = data.map(item => `
        <div style="border:1px solid #ddd; padding:10px; margin-bottom:10px;">
            <strong>ID:</strong> ${item.id}<br>
            <strong>Date:</strong> ${item.createdAt}<br>
            <button onclick="viewImport('${item.id}')">View</button>
        </div>
    `).join("");
}

async function viewImport(id) {
    const res = await fetch(`http://localhost:5002/api/imports/${id}`);
    const data = await res.json();

    console.log("Snapshot:", data);
}