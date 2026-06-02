let receipts = [];

document.addEventListener("DOMContentLoaded", async () => {
  await initDB();

  loadDashboard();

  registerEvents();

  loadHistory();

  registerSW();
});

let settings = {
  businessName: "",
  address: "",
  phone: "",
  email: "",
  prefix: "EST",
  currency: "₦",
  footer: "",
  logo: "",
};

let estates = [];

// Load settings on page start
window.onload = function () {
  loadSettings();
  loadEstates();
};

function saveSettings() {
  settings.businessName = document.getElementById("businessName").value;
  settings.address = document.getElementById("address").value;
  settings.phone = document.getElementById("phone").value;
  settings.email = document.getElementById("email").value;
  settings.prefix = document.getElementById("prefix").value;
  settings.currency = document.getElementById("currency").value;
  settings.footer = document.getElementById("footer").value;

  localStorage.setItem("businessSettings", JSON.stringify(settings));

  alert("Settings Saved Successfully!");
}

function loadSettings() {
  let saved = localStorage.getItem("businessSettings");

  if (saved) {
    settings = JSON.parse(saved);

    document.getElementById("businessName").value = settings.businessName || "";
    document.getElementById("address").value = settings.address || "";
    document.getElementById("phone").value = settings.phone || "";
    document.getElementById("email").value = settings.email || "";
    document.getElementById("prefix").value = settings.prefix || "EST";
    document.getElementById("currency").value = settings.currency || "₦";
    document.getElementById("footer").value = settings.footer || "";

    if (settings.logo) {
      document.getElementById("logoPreview").src = settings.logo;
    }
  }
}

function saveEstate(estate) {
  estates.push({ id: Date.now(), name: estate.name, location: estate.location || "" });
  localStorage.setItem("estates", JSON.stringify(estates));
  updateEstateDropdown();
}

function loadEstates() {
  let saved = localStorage.getItem("estates");
  if (saved) {
    estates = JSON.parse(saved);
  } else {
    estates = [];
  }
  updateEstateDropdown();
}

function deleteEstate(id) {
  if (!confirm("Delete this property?")) return;
  estates = estates.filter((e) => e.id !== id);
  localStorage.setItem("estates", JSON.stringify(estates));
  loadEstatesDetail();
  updateEstateDropdown();
}

function updateEstateDropdown() {
  const unitSelect = document.getElementById("unit");
  if (!unitSelect) return;
  
  unitSelect.innerHTML = '<option value="">Select Property</option>';
  estates.forEach((e) => {
    const option = document.createElement("option");
    option.value = e.name;
    option.textContent = e.name + (e.location ? ` - ${e.location}` : "");
    unitSelect.appendChild(option);
  });
}
function registerEvents() {
  document
    .getElementById("receiptForm")
    .addEventListener("submit", createReceipt);

  document.getElementById("searchBtn").addEventListener("click", searchReceipt);

  document.getElementById("exportBtn").addEventListener("click", exportBackup);

  document
    .getElementById("importFile")
    .addEventListener("change", importBackup);
}

async function createReceipt(e) {
  e.preventDefault();

  const amount = Number(document.getElementById("amount").value);
  if (amount <= 0) {
    alert("Amount must be greater than 0");
    return;
  }

  const payer = document.getElementById("payer").value.trim();
  if (!payer) {
    alert("Payer name is required");
    return;
  }

  const receipt = {
    receiptNo: generateReceiptNo(),
    payer: payer,
    phone: document.getElementById("payerPhone").value.trim(),
    unit: document.getElementById("unit").value.trim(),
    paymentType: document.getElementById("paymentType").value,
    amount: amount,
    paymentMethod: document.getElementById("paymentMethod").value,
    remarks: document.getElementById("remarks").value.trim(),
    date: new Date().toLocaleString(),
  };

  await saveReceipt(receipt);
  showReceipt(receipt);
  document.getElementById("receiptForm").reset();
  loadHistory();
  loadDashboard();
  
  // Navigate to receipt preview page
  showSection("viewReceipt");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showReceipt(r, containerId = "receiptPreview") {
  const preview = document.getElementById(containerId);
  if (!preview) return;
  
  preview.classList.remove("hidden");

  preview.innerHTML = `
    <div class="receipt-card">
        <div class="receipt-card-header">
            <h2>ESTATE RECEIPT</h2>
            <span class="receipt-no">${escapeHtml(r.receiptNo)}</span>
        </div>
        
        <div class="receipt-card-body">
            <div class="receipt-row">
                <label>Name</label>
                <span>${escapeHtml(r.payer)}</span>
            </div>
            
            <div class="receipt-row">
                <label>Phone</label>
                <span>${escapeHtml(r.phone)}</span>
            </div>
            
            <div class="receipt-row">
                <label>Property</label>
                <span>${escapeHtml(r.unit)}</span>
            </div>
            
            <div class="receipt-row">
                <label>Payment Type</label>
                <span>${escapeHtml(r.paymentType)}</span>
            </div>
            
            <div class="receipt-row">
                <label>Payment Method</label>
                <span>${escapeHtml(r.paymentMethod)}</span>
            </div>
            
            <div class="receipt-row">
                <label>Amount</label>
                <span class="amount">₦${r.amount.toLocaleString()}</span>
            </div>
            
            <div class="receipt-row">
                <label>Date</label>
                <span>${escapeHtml(r.date)}</span>
            </div>
            
            ${r.remarks ? `
            <div class="receipt-row">
                <label>Remarks</label>
                <span>${escapeHtml(r.remarks)}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="receipt-card-signature">
            <div class="signature-line"></div>
            <small>Signature / Stamp</small>
        </div>
        
        <div class="receipt-card-footer">
            <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>
        </div>
    </div>
  `;
}

async function loadHistory() {
  receipts = await getAllReceipts();
  const list = document.getElementById("receiptList");
  
  if (receipts.length === 0) {
    list.innerHTML = "<p>No receipts found</p>";
    return;
  }

  let html = "";
  receipts.reverse().forEach((r) => {
    html += `
      <div class="history-item">
        <div class="history-info">
          <strong>${escapeHtml(r.receiptNo)}</strong>
          <br>
          ${escapeHtml(r.payer)}
          <br>
          ₦${r.amount.toLocaleString()}
        </div>
        <div class="history-actions">
          <button class="view-btn" onclick="viewReceipt('${escapeHtml(r.receiptNo)}');">View</button>
          <button class="delete-btn" onclick="removeReceipt('${escapeHtml(r.receiptNo)}');">Delete</button>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

async function viewReceipt(no) {
  const receipt = await getReceipt(no);
  if (!receipt) {
    alert("Receipt not found");
    return;
  }
  showReceipt(receipt);
  showSection("viewReceipt");
}

async function removeReceipt(no) {
  if (!confirm("Delete receipt?")) return;

  await deleteReceipt(no);

  loadHistory();

  loadDashboard();
}

async function searchReceipt() {
  const no = document.getElementById("searchBox").value;

  const receipt = await getReceipt(no);

  if (!receipt) {
    alert("Receipt not found");
    return;
  }

  showReceipt(receipt);
  showSection("viewReceipt");
}

async function loadDashboard() {
  const data = await getAllReceipts();

  const totalReceipts = data.length;
  const totalAmount = data.reduce((sum, r) => sum + r.amount, 0);

  document.getElementById("totalReceipts").textContent = totalReceipts;
  document.getElementById("totalAmount").textContent =
    "₦" + Math.max(0, totalAmount).toLocaleString();
  
  loadEstatesOverview(data);
}

async function loadEstatesOverview(data) {
  const estatesMap = {};
  
  data.forEach((r) => {
    const unit = r.unit || "Unassigned";
    if (!estatesMap[unit]) {
      estatesMap[unit] = { unit: unit, count: 0, total: 0 };
    }
    estatesMap[unit].count += 1;
    estatesMap[unit].total += r.amount;
  });
  
  const estatesList = Object.values(estatesMap).sort((a, b) => b.total - a.total);
  const container = document.getElementById("estatesContainer");
  
  if (!container) return;
  
  if (estatesList.length === 0) {
    container.innerHTML = "<p>No estate data</p>";
    return;
  }
  
  let html = "<div style='display: grid; gap: 10px;'>";
  estatesList.forEach((estate) => {
    html += `
      <div style='background: #f0f4f8; padding: 12px; border-radius: 8px; border-left: 4px solid #0f172a;'>
        <div style='display: flex; justify-content: space-between; align-items: center;'>
          <div>
            <strong>${escapeHtml(estate.unit)}</strong>
            <br>
            <small>Receipts: ${estate.count}</small>
          </div>
          <div style='text-align: right; font-weight: bold; color: #16a34a;'>
            ₦${Math.max(0, estate.total).toLocaleString()}
          </div>
        </div>
      </div>
    `;
  });
  html += "</div>";
  container.innerHTML = html;
}

async function exportBackup() {
  const data = await getAllReceipts();

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);

  a.download = "receipts-backup.json";

  a.click();
}

async function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!Array.isArray(data)) {
      alert("Invalid backup file format");
      return;
    }

    for (const r of data) {
      await saveReceipt(r);
    }
    alert("Backup restored successfully");
    loadHistory();
    loadDashboard();
  } catch (error) {
    alert("Error importing backup: " + error.message);
    console.error(error);
  }
}

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js")
      .catch(error => console.error("Service Worker registration failed:", error));
  }
}

function generateReceiptNo() {
  try {
    let saved = JSON.parse(localStorage.getItem("businessSettings"));
    let prefix = saved?.prefix || "EST";
    let date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    let random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${date}-${random}`;
  } catch (error) {
    console.error("Error generating receipt number:", error);
    return `EST-${Date.now()}`;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const logoUpload = document.getElementById("logoUpload");
  if (logoUpload) {
    logoUpload.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = function () {
        settings.logo = reader.result;
        const preview = document.getElementById("logoPreview");
        if (preview) {
          preview.src = reader.result;
        }
      };
      reader.onerror = function () {
        alert("Error reading file");
      };
      reader.readAsDataURL(file);
    });
  }

  // Add Estate Button
  const addEstateBtn = document.getElementById("addEstateBtn");
  if (addEstateBtn) {
    addEstateBtn.addEventListener("click", function () {
      const name = document.getElementById("estateNameInput").value.trim();
      const location = document.getElementById("estateLocationInput").value.trim();
      
      if (!name) {
        alert("Property name is required");
        return;
      }
      
      saveEstate({ name, location });
      document.getElementById("estateNameInput").value = "";
      document.getElementById("estateLocationInput").value = "";
      loadEstatesDetail();
      alert("Property added successfully!");
    });
  }

  // Create Receipt Button
  const createReceiptBtn = document.getElementById("createReceiptBtn");
  if (createReceiptBtn) {
    createReceiptBtn.addEventListener("click", function () {
      showSection("receipt");
      const receiptNav = document.querySelector("[data-section='receipt']");
      if (receiptNav) {
        const navItems = document.querySelectorAll(".nav-item");
        navItems.forEach((nav) => nav.classList.remove("active"));
        receiptNav.classList.add("active");
      }
    });
  }

  // Hamburger Menu Toggle
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const navItems = document.querySelectorAll(".nav-item");

  if (hamburgerBtn && sidebar) {
    hamburgerBtn.addEventListener("click", function () {
      hamburgerBtn.classList.toggle("active");
      sidebar.classList.toggle("active");
    });

    // Close sidebar when a nav item is clicked
    navItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        hamburgerBtn.classList.remove("active");
        sidebar.classList.remove("active");
        
        // Get section from data attribute
        const section = this.getAttribute("data-section");
        showSection(section);
        
        // Update active nav item
        navItems.forEach((nav) => nav.classList.remove("active"));
        this.classList.add("active");
      });
    });

    // Close sidebar when clicking outside
    document.addEventListener("click", function (e) {
      if (
        !sidebar.contains(e.target) &&
        !hamburgerBtn.contains(e.target) &&
        sidebar.classList.contains("active")
      ) {
        hamburgerBtn.classList.remove("active");
        sidebar.classList.remove("active");
      }
    });
  }

  // Show dashboard by default
  showSection("dashboard");
  document.querySelector("[data-section='dashboard']").classList.add("active");
});

function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".page-section");
  sections.forEach((section) => {
    section.classList.add("hidden");
  });

  // Show selected section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove("hidden");
    
    // Load section-specific data
    if (sectionId === "estates") {
      loadEstatesDetail();
    } else if (sectionId === "history") {
      loadHistoryDetail();
    }
  }
}

async function loadEstatesDetail() {
  const container = document.getElementById("estatesListContainer");
  
  if (!container) return;
  
  if (estates.length === 0) {
    container.innerHTML = "<p style='text-align: center; color: #666;'>No properties added yet. Add one above to get started.</p>";
    return;
  }
  
  let html = "<div style='display: grid; gap: 10px;'>";
  estates.forEach((estate) => {
    html += `
      <div style='background: #f0f4f8; padding: 15px; border-radius: 8px; border-left: 4px solid #0f172a; display: flex; justify-content: space-between; align-items: center;'>
        <div>
          <strong style='font-size: 16px;'>${escapeHtml(estate.name)}</strong>
          ${estate.location ? `<br><small style='color: #666;'>${escapeHtml(estate.location)}</small>` : ''}
        </div>
        <button class="delete-btn" onclick="deleteEstate(${estate.id})">Delete</button>
      </div>
    `;
  });
  html += "</div>";
  container.innerHTML = html;
}

async function loadHistoryDetail() {
  const data = await getAllReceipts();
  const list = document.getElementById("historyDetailList");
  
  if (data.length === 0) {
    list.innerHTML = "<p>No receipts found</p>";
    return;
  }

  let html = "";
  data.reverse().forEach((r) => {
    html += `
      <div class="history-item">
        <div class="history-info">
          <strong>${escapeHtml(r.receiptNo)}</strong>
          <br>
          ${escapeHtml(r.payer)}
          <br>
          ₦${r.amount.toLocaleString()}
        </div>
        <div class="history-actions">
          <button class="view-btn" onclick="viewReceipt('${escapeHtml(r.receiptNo)}');">View</button>
          <button class="delete-btn" onclick="removeReceipt('${escapeHtml(r.receiptNo)}');">Delete</button>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}