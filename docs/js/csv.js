let dataCache = [];
let selectedColumns = [];

// AG GRID
let gridApi = null;

const API_URL = "http://localhost:5002";

const columnsToSelect = [
    "REGDATE",
    "NUMBER",
    "reg",
    "name1",
    "name2",
    "nation1",
    "country",
    "phone",
    "ARTD1",
    "ARTD2",
    "ARTDS",
    "ARGR1"
];

const gridOptions = {
    theme: agGrid.themeQuartz,
    columnDefs: [],
    rowData: [],
    defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        floatingFilter: true
    }
};

// -------------------------
// 1. INITIALIZE GRID
// -------------------------
function initializeGrid() {

    const gridDiv = document.getElementById("myGrid5");

    if (!gridDiv) {
        console.error("Grid div not found");
        return;
    }

    gridApi = agGrid.createGrid(gridDiv, gridOptions);

    console.log("AG Grid initialized");
}

// -------------------------
// 2. ENTRY POINT (BUTTON)
// -------------------------
function parseCSV() {
    const fileInput = document.getElementById("csvFile");
    const loader = document.getElementById("loading");

    if (!fileInput || !fileInput.files.length) {
        alert("Please select a file");
        return;
    }

    loader.style.display = "block";

    const file = fileInput.files[0];
    loadFile(file);
}

// -------------------------
// 3. FILE READER
// -------------------------
function loadFile(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        Papa.parse(e.target.result, {
            header: true,
            skipEmptyLines: true,
            delimiter: "\t",

            complete: async function (results) {
                dataCache = results.data;

                const columns = getColumns(dataCache);

                // default: start with preselected columns (or all)
                selectedColumns = columns.filter(c =>
                    columnsToSelect.includes(c)
                );

                await renderColumnSelector(columns, selectedColumns);
                renderGrid(); // 🚀 AUTO RENDER

                document.getElementById("loading").style.display = "none";
            }
        });
    };

    reader.readAsText(file);
}

// -------------------------
// 4. GET COLUMNS (like pandas)
// -------------------------
function getColumns(data) {
    return data.length ? Object.keys(data[0]) : [];
}

function getSelectedColumns() {

    return Array.from(
        document.querySelectorAll(
            "#columnList input[type='checkbox']:checked"
        )
    ).map(cb => cb.value);
}

// -------------------------
// 5. RENDER SELECTED COLUMNS
// -------------------------
async function renderColumnSelector(columns, preselected = []) {
    const container = document.getElementById("columnSelector");

    const template = await loadTemplate("templates/columnSelector.html");
    container.innerHTML = template;

    const list = document.getElementById("columnList");

    list.innerHTML = columns.map(col => {
        const isChecked = preselected.includes(col);

        return `
            <label class="column-item" style="display:flex; align-items:center; gap:8px;">
                <input
                    type="checkbox"
                    value="${col}"
                    ${isChecked ? "checked" : ""}
                    onchange="updateSelectedColumns()"
                >
                <span>${col}</span>
            </label>
        `;
    }).join("");
}

async function loadTemplate(path) {
    const res = await fetch(path);
    return await res.text();
}

function toggleColumns() {
    const list = document.getElementById("columnList");

    if (!list) return;

    list.style.display = (!list.style.display || list.style.display === "none")
        ? "block"
        : "none";
}

function selectAllColumns(state) {
    const checkboxes = document.querySelectorAll("#columnList input[type='checkbox']");

    checkboxes.forEach(cb => cb.checked = state);

    updateSelectedColumns();
}

function filterColumns() {
    const value = document.getElementById("columnSearch").value.toLowerCase();
    const rows = document.querySelectorAll("#columnList .column-item");

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(value) ? "flex" : "none";
    });
}

function updateSelectedColumns() {
    selectedColumns = getSelectedColumns();
    renderGrid();
}

// -------------------------
// 6. RENDER GRID
// -------------------------
function renderGrid() {

    if (!gridApi) {
        initializeGrid();
    }

    const columnDefs = selectedColumns.map(col => ({
        field: col,
        headerName: col
    }));

    const rowData = buildFilteredRows();

    gridApi.setGridOption("columnDefs", columnDefs);
    gridApi.setGridOption("rowData", rowData);
}

function exportCSV() {
    gridApi.exportDataAsCsv();
}

// -------------------------
// 7. SAVE CSV
// -------------------------

async function saveSnapshot() {

    const selectedColumns = getSelectedColumns();

    if (!selectedColumns.length) {
        alert("Select at least one column");
        return;
    }

    const rows = buildFilteredRows();

    const payload = {
        columns: selectedColumns,
        rows
    };

    try {
        const res = await fetch(`${API_URL}/api/imports/snapshot`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("Server error:", text);
            return;
        }

        const data = await res.json();
        console.log("Snapshot saved:", data);

        alert("Snapshot saved successfully");

    } catch (err) {
        console.error(err);
        alert("Failed to save snapshot");
    }
}

function buildFilteredRows() {

    const selectedColumns = getSelectedColumns();

    return dataCache.map(row => {

        const filteredRow = {};

        selectedColumns.forEach(col => {
            filteredRow[col] = row[col];
        });

        return filteredRow;
    });
}