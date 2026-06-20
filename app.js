let receipts = [];
let settings = {
  businessName: "",
  address: "",
  phone: "",
  email: "",
  prefix: "RCP",
  currency: "₦",
  footer: "",
  logo: "",
  signature: "",
  signatoryName: "",
  signatoryTitle: "",
};
let estates = [];
let editingEstateId = null;

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Initialize theme
  initTheme();

  // 2. Initialize database
  try {
    await initDB();
  } catch (error) {
    console.error("Database initialization failed:", error);
  }

  // 3. Load configuration state
  loadSettings();
  loadEstates();

  // 4. Populate views
  loadDashboard();
  loadHistory();

  // 5. Register application event listeners
  registerEvents();

  // 6. Register progressive web app service worker
  registerSW();
  initInstallPrompt();

  // 7. Show default section
  showSection("dashboard");
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

function toggleTheme() {
  if (document.body.classList.contains("dark")) {
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

// Business Settings Management
function saveSettings() {
  settings.businessName = document.getElementById("businessName").value.trim();
  settings.address = document.getElementById("address").value.trim();
  settings.phone = document.getElementById("phone").value.trim();
  settings.email = document.getElementById("email").value.trim();
  settings.prefix = document.getElementById("prefix").value.trim() || "RCP";
  settings.currency = document.getElementById("currency").value.trim() || "₦";
  settings.footer = document.getElementById("footer").value.trim();
  settings.signatoryName = document.getElementById("signatoryName").value.trim();
  settings.signatoryTitle = document.getElementById("signatoryTitle").value.trim();

  localStorage.setItem("businessSettings", JSON.stringify(settings));
  alert("Settings Saved Successfully!");

  // Refresh views to reflect currency/prefix updates
  loadDashboard();
  loadHistory();
}

function loadSettings() {
  let saved = localStorage.getItem("businessSettings");
  if (saved) {
    settings = { ...settings, ...JSON.parse(saved) };
  }

  document.getElementById("businessName").value = settings.businessName || "";
  document.getElementById("address").value = settings.address || "";
  document.getElementById("phone").value = settings.phone || "";
  document.getElementById("email").value = settings.email || "";
  document.getElementById("prefix").value = settings.prefix || "RCP";
  document.getElementById("currency").value = settings.currency || "₦";
  document.getElementById("footer").value = settings.footer || "";
  document.getElementById("signatoryName").value = settings.signatoryName || "";
  document.getElementById("signatoryTitle").value = settings.signatoryTitle || "";

  const logoPreview = document.getElementById("logoPreview");
  if (logoPreview) {
    if (settings.logo) {
      logoPreview.src = settings.logo;
      logoPreview.style.display = "block";
    } else {
      logoPreview.src = "";
      logoPreview.style.display = "none";
    }
  }

  const signaturePreview = document.getElementById("signaturePreview");
  if (signaturePreview) {
    if (settings.signature) {
      signaturePreview.src = settings.signature;
      signaturePreview.style.display = "block";
    } else {
      signaturePreview.src = "";
      signaturePreview.style.display = "none";
    }
  }
}

// Categories Management
function saveEstate(estate) {
  estates.push({
    id: Date.now(),
    name: estate.name,
    location: estate.location || "",
    units: estate.units || [],
  });
  localStorage.setItem("estates", JSON.stringify(estates));
  updateEstateDropdown();
}

function loadEstates() {
  let saved = localStorage.getItem("estates");
  if (saved) {
    try {
      estates = JSON.parse(saved);
    } catch (e) {
      console.error("Error parsing estates", e);
      estates = [];
    }
  } else {
    estates = [];
  }
  updateEstateDropdown();
}

function deleteEstate(id) {
  if (!confirm("Are you sure you want to delete this category? Past receipts will keep their details, but this category will be removed from selection.")) return;
  estates = estates.filter((e) => e.id !== id);
  localStorage.setItem("estates", JSON.stringify(estates));
  
  // If we are currently editing the estate being deleted, cancel edit mode
  if (editingEstateId === id) {
    cancelEstateEditing();
  }

  loadEstatesDetail();
  updateEstateDropdown();
}

function editEstate(id) {
  const estate = estates.find((e) => e.id === id);
  if (!estate) return;

  editingEstateId = id;

  document.getElementById("estateNameInput").value = estate.name;
  document.getElementById("estateLocationInput").value = estate.location || "";
  document.getElementById("estateUnitsInput").value = (estate.units || []).join(", ");
  
  document.getElementById("addEstateBtn").textContent = "Update Category";
  const cancelBtn = document.getElementById("cancelEstateEditBtn");
  if (cancelBtn) {
    cancelBtn.style.display = "block";
  }

  // Scroll to form view smoothly
  const formCard = document.getElementById("estateNameInput").closest(".card");
  if (formCard) {
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function cancelEstateEditing() {
  editingEstateId = null;
  document.getElementById("estateNameInput").value = "";
  document.getElementById("estateLocationInput").value = "";
  document.getElementById("estateUnitsInput").value = "";
  
  document.getElementById("addEstateBtn").textContent = "Add Category";
  const cancelBtn = document.getElementById("cancelEstateEditBtn");
  if (cancelBtn) {
    cancelBtn.style.display = "none";
  }
}

function updateEstateDropdown() {
  const estateSelect = document.getElementById("estate");
  const unitSelect = document.getElementById("unit");

  if (!estateSelect || !unitSelect) return;

  estateSelect.innerHTML = '<option value="">Select Category</option>';
  estates.forEach((e) => {
    const option = document.createElement("option");
    option.value = e.id;
    option.textContent = e.name;
    estateSelect.appendChild(option);
  });

  unitSelect.innerHTML = '<option value="">Select Item</option>';
}

// Global Event Registration
function registerEvents() {
  // Receipt Creation Form Submit
  const receiptForm = document.getElementById("receiptForm");
  if (receiptForm) {
    receiptForm.addEventListener("submit", createReceipt);
  }

  // Search Action
  const searchBtn = document.getElementById("searchBtn");
  if (searchBtn) {
    searchBtn.addEventListener("click", searchReceipt);
  }

  // Backup Export/Import
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportBackup);
  }

  const importFile = document.getElementById("importFile");
  if (importFile) {
    importFile.addEventListener("change", importBackup);
  }

  // Theme Toggle
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  // Save Settings
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", saveSettings);
  }

  // Logo Input Reader
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
          preview.style.display = "block";
        }
      };
      reader.onerror = function () {
        alert("Error reading logo file");
      };
      reader.readAsDataURL(file);
    });
  }

  const signatureUpload = document.getElementById("signatureUpload");
  if (signatureUpload) {
    signatureUpload.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function () {
        settings.signature = reader.result;
        const preview = document.getElementById("signaturePreview");
        if (preview) {
          preview.src = reader.result;
          preview.style.display = "block";
        }
      };
      reader.onerror = function () {
        alert("Error reading signature file");
      };
      reader.readAsDataURL(file);
    });
  }

  // Estate Dropdown Select Sync to Units Select
  const estateSelect = document.getElementById("estate");
  if (estateSelect) {
    estateSelect.addEventListener("change", function () {
      const estateId = Number(this.value);
      const unitSelect = document.getElementById("unit");
      if (!unitSelect) return;

      unitSelect.innerHTML = '<option value="">Select Item</option>';

      const estate = estates.find((e) => e.id === estateId);
      if (!estate || !estate.units) return;

      estate.units.forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit;
        option.textContent = unit;
        unitSelect.appendChild(option);
      });
    });
  }

  const paymentTypeSelect = document.getElementById("paymentType");
  if (paymentTypeSelect) {
    paymentTypeSelect.addEventListener("change", togglePaymentPeriodFields);
    togglePaymentPeriodFields();
  }

  // Add/Update Estate Trigger
  const addEstateBtn = document.getElementById("addEstateBtn");
  if (addEstateBtn) {
    addEstateBtn.addEventListener("click", function () {
      const name = document.getElementById("estateNameInput").value.trim();
      const location = document.getElementById("estateLocationInput").value.trim();
      const unitsRaw = document.getElementById("estateUnitsInput").value.trim();
      
      const units = unitsRaw
        .split(",")
        .map((u) => u.trim())
        .filter((u) => u !== "");

      if (!name) {
        alert("Category name is required");
        return;
      }

      if (editingEstateId) {
        // Update
        const estate = estates.find((e) => e.id === editingEstateId);
        if (estate) {
          estate.name = name;
          estate.location = location;
          estate.units = units;
        }

        localStorage.setItem("estates", JSON.stringify(estates));
        editingEstateId = null;
        document.getElementById("addEstateBtn").textContent = "Add Category";
        
        const cancelBtn = document.getElementById("cancelEstateEditBtn");
        if (cancelBtn) cancelBtn.style.display = "none";
        
        alert("Category updated successfully!");
      } else {
        // Create
        estates.push({
          id: Date.now(),
          name: name,
          location: location,
          units: units,
        });
        localStorage.setItem("estates", JSON.stringify(estates));
        alert("Category added successfully!");
      }

      document.getElementById("estateNameInput").value = "";
      document.getElementById("estateLocationInput").value = "";
      document.getElementById("estateUnitsInput").value = "";

      loadEstatesDetail();
      updateEstateDropdown();
    });
  }

  // Cancel Estate Editing Trigger
  const cancelEstateEditBtn = document.getElementById("cancelEstateEditBtn");
  if (cancelEstateEditBtn) {
    cancelEstateEditBtn.addEventListener("click", cancelEstateEditing);
  }

  // Create Receipt Button (Redirects from Dashboard)
  const createReceiptBtn = document.getElementById("createReceiptBtn");
  if (createReceiptBtn) {
    createReceiptBtn.addEventListener("click", function () {
      // Default to today's date
      const today = new Date().toISOString().split("T")[0];
      const paymentDateInput = document.getElementById("paymentDate");
      if (paymentDateInput) paymentDateInput.value = today;

      loadEstates();
      updateEstateDropdown();
      showSection("receipt");
    });
  }

  // Responsive Sidebar Controls
  initMobileMenu();

  // Setup Event Delegation for dynamic receipt lists
  const receiptList = document.getElementById("receiptList");
  if (receiptList) {
    receiptList.addEventListener("click", handleHistoryClick);
  }

  const historyDetailList = document.getElementById("historyDetailList");
  if (historyDetailList) {
    historyDetailList.addEventListener("click", handleHistoryClick);
  }

  const searchResults = document.getElementById("searchResults");
  if (searchResults) {
    searchResults.addEventListener("click", handleHistoryClick);
  }

  // Setup Event Delegation for properties list
  const estatesListContainer = document.getElementById("estatesListContainer");
  if (estatesListContainer) {
    estatesListContainer.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".edit-btn");
      const deleteBtn = e.target.closest(".delete-btn");
      if (editBtn) {
        const id = Number(editBtn.getAttribute("data-id"));
        editEstate(id);
      } else if (deleteBtn) {
        const id = Number(deleteBtn.getAttribute("data-id"));
        deleteEstate(id);
      }
    });
  }

  // Back to Dashboard buttons and Header Brand Redirection
  const brandBtn = document.getElementById("brandBtn");
  if (brandBtn) {
    brandBtn.addEventListener("click", () => {
      showSection("dashboard");
    });
  }

  const backDashboardButtons = document.querySelectorAll(".back-dashboard-btn");
  backDashboardButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showSection("dashboard");
    });
  });
}

// Mobile-friendly sidebar menu (Android/iOS touch support)
function initMobileMenu() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  const navItems = document.querySelectorAll(".nav-item");

  if (!hamburgerBtn || !sidebar) return;

  let lastToggleAt = 0;

  function setMenuOpen(open) {
    hamburgerBtn.classList.toggle("active", open);
    sidebar.classList.toggle("active", open);
    if (backdrop) backdrop.classList.toggle("active", open);
    document.body.classList.toggle("menu-open", open);
    hamburgerBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (backdrop) backdrop.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function toggleMenu() {
    const now = Date.now();
    if (now - lastToggleAt < 300) return;
    lastToggleAt = now;
    setMenuOpen(!sidebar.classList.contains("active"));
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  bindTap(hamburgerBtn, (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  if (backdrop) {
    bindTap(backdrop, closeMenu);
  }

  navItems.forEach((item) => {
    bindTap(item, (e) => {
      e.preventDefault();
      closeMenu();
      const section = item.getAttribute("data-section");
      showSection(section);
    });
  });
}

function bindTap(element, handler) {
  let handled = false;

  element.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      handled = true;
      handler(e);
      setTimeout(() => {
        handled = false;
      }, 400);
    },
    { passive: false },
  );

  element.addEventListener("click", (e) => {
    if (handled) {
      e.preventDefault();
      return;
    }
    handler(e);
  });
}
function handleHistoryClick(e) {
  const viewBtn = e.target.closest(".view-btn");
  const deleteBtn = e.target.closest(".delete-btn");
  if (viewBtn) {
    const no = viewBtn.getAttribute("data-no");
    viewReceipt(no);
  } else if (deleteBtn) {
    const no = deleteBtn.getAttribute("data-no");
    removeReceipt(no);
  }
}

// Receipt Creation Handler
async function createReceipt(e) {
  e.preventDefault();

  const amount = Number(document.getElementById("amount").value);
  if (amount <= 0) {
    alert("Amount must be greater than 0");
    return;
  }

  const payer = document.getElementById("payer").value.trim();
  if (!payer) {
    alert("Customer name is required");
    return;
  }

  const paymentDate = document.getElementById("paymentDate").value;
  if (!paymentDate) {
    alert("Payment date is required");
    return;
  }

  // Capture Property & Unit details
  const estateSelect = document.getElementById("estate");
  const selectedEstateId = estateSelect.value;
  let estateName = "";
  if (selectedEstateId) {
    const estate = estates.find((e) => e.id === Number(selectedEstateId));
    if (estate) {
      estateName = estate.name;
    }
  }

  const paymentType = document.getElementById("paymentType").value;
  const rentPeriodStart = document.getElementById("rentPeriodStart")?.value || "";
  const rentPeriodEnd = document.getElementById("rentPeriodEnd")?.value || "";
  const hasPeriod = paymentTypeHasPeriod(paymentType);

  if (hasPeriod && rentPeriodStart && rentPeriodEnd && rentPeriodEnd < rentPeriodStart) {
    alert("Payment period end date must be on or after the start date");
    return;
  }

  const receipt = {
    receiptNo: generateReceiptNo(),
    payer: payer,
    phone: document.getElementById("payerPhone").value.trim(),
    estateId: selectedEstateId ? Number(selectedEstateId) : null,
    estateName: estateName,
    unit: document.getElementById("unit").value.trim(),
    paymentType: paymentType,
    rentPeriodStart: hasPeriod ? rentPeriodStart : "",
    rentPeriodEnd: hasPeriod ? rentPeriodEnd : "",
    amount: amount,
    paymentMethod: document.getElementById("paymentMethod").value,
    remarks: document.getElementById("remarks").value.trim(),
    paymentDate: paymentDate,
    date: new Date().toLocaleString(),
    signedAt: new Date().toISOString(),
    signatoryName: settings.signatoryName || "",
    signatoryTitle: settings.signatoryTitle || "",
    signature: settings.signature || "",
    verificationCode: "",
  };

  receipt.verificationCode = generateVerificationCode(receipt);

  await saveReceipt(receipt);
  showReceipt(receipt);
  
  document.getElementById("receiptForm").reset();
  togglePaymentPeriodFields();
  
  loadHistory();
  loadDashboard();
  showSection("viewReceipt");
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function paymentTypeHasPeriod(paymentType) {
  return ["Rent", "Subscription", "Service"].includes(paymentType);
}

function formatCategoryItem(receipt) {
  let text = receipt.unit || "N/A";
  if (receipt.estateName) {
    text = `${receipt.estateName} - ${receipt.unit || "N/A"}`;
  }
  return text;
}

function togglePaymentPeriodFields() {
  const paymentType = document.getElementById("paymentType");
  const periodFields = document.getElementById("rentDurationFields");
  if (!paymentType || !periodFields) return;

  const showPeriod = paymentTypeHasPeriod(paymentType.value);
  periodFields.style.display = showPeriod ? "block" : "none";

  if (!showPeriod) {
    const startInput = document.getElementById("rentPeriodStart");
    const endInput = document.getElementById("rentPeriodEnd");
    if (startInput) startInput.value = "";
    if (endInput) endInput.value = "";
  }
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPaymentPeriod(start, end) {
  if (!start && !end) return "";
  if (start && end) {
    return `${formatDisplayDate(start)} – ${formatDisplayDate(end)}`;
  }
  return formatDisplayDate(start || end);
}

function formatSignedDate(isoOrDisplayDate) {
  if (!isoOrDisplayDate) return "";
  const date = new Date(isoOrDisplayDate);
  if (Number.isNaN(date.getTime())) return isoOrDisplayDate;
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateVerificationCode(receipt) {
  const payload = [
    receipt.receiptNo,
    receipt.payer,
    receipt.amount,
    receipt.paymentDate,
    settings.businessName || "",
    receipt.signedAt || receipt.date || "",
  ].join("|");

  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) + hash) ^ payload.charCodeAt(i);
  }
  return (Math.abs(hash) >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 8);
}

function buildSignatureBlock(receipt) {
  const signatureSrc = receipt.signature || settings.signature;
  const signatoryName = receipt.signatoryName || settings.signatoryName;
  const signatoryTitle = receipt.signatoryTitle || settings.signatoryTitle;
  const signedAt = receipt.signedAt || receipt.date;
  const verificationCode =
    receipt.verificationCode || generateVerificationCode(receipt);

  const signatureImageHtml = signatureSrc
    ? `<img src="${signatureSrc}" class="signature-image" alt="Authorized signature" />`
    : `<div class="signature-line"></div>`;

  const signatoryHtml =
    signatoryName || signatoryTitle
      ? `<div class="signatory-details">
          ${signatoryName ? `<strong>${escapeHtml(signatoryName)}</strong>` : ""}
          ${signatoryTitle ? `<span>${escapeHtml(signatoryTitle)}</span>` : ""}
         </div>`
      : `<small class="signature-label">Authorized Signature</small>`;

  return `
    <div class="receipt-card-signature">
      ${signatureImageHtml}
      ${signatoryHtml}
      <div class="receipt-authenticity">
        <span class="auth-badge">✓ Digitally Signed</span>
        <small>Signed on ${escapeHtml(formatSignedDate(signedAt))}</small>
        <small class="auth-code">Verification Code: ${escapeHtml(verificationCode)}</small>
        <small class="auth-note">This receipt is electronically generated. Confirm authenticity using the verification code above.</small>
      </div>
    </div>
  `;
}

function buildReceiptShareText(receipt) {
  const currencySymbol = settings.currency || "₦";
  const verificationCode =
    receipt.verificationCode || generateVerificationCode(receipt);
  const signatoryName = receipt.signatoryName || settings.signatoryName;
  const signatoryTitle = receipt.signatoryTitle || settings.signatoryTitle;
  const signedAt = formatSignedDate(receipt.signedAt || receipt.date);
  const amount = `${currencySymbol}${Number(receipt.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const lines = [
    "PAYMENT RECEIPT",
    "================",  
    settings.businessName || "Receipt Manager",
    settings.address || "",
    [settings.phone, settings.email].filter(Boolean).join(" | "),
    "",
    `Receipt No: ${receipt.receiptNo}`,
    `Customer: ${receipt.payer}`,
  ];

  if (receipt.phone) lines.push(`Phone: ${receipt.phone}`);
  lines.push(`Category / Item: ${formatCategoryItem(receipt)}`);
  lines.push(`Payment For: ${receipt.paymentType}`);

  if (receipt.rentPeriodStart || receipt.rentPeriodEnd) {
    lines.push(`Payment Period: ${formatPaymentPeriod(receipt.rentPeriodStart, receipt.rentPeriodEnd)}`);
  }

  lines.push(
    `Payment Method: ${receipt.paymentMethod}`,
    `Amount Paid: ${amount}`,
    `Payment Date: ${receipt.paymentDate || receipt.date}`,
    `Issue Date: ${receipt.date}`,
  );

  if (receipt.remarks) lines.push(`Remarks: ${receipt.remarks}`);

  lines.push(
    "",
    `Verification Code: ${verificationCode}`,
  );

  if (signatoryName || signatoryTitle) {
    lines.push(`Signed by: ${[signatoryName, signatoryTitle].filter(Boolean).join(", ")}`);
  }
  if (signedAt) lines.push(`Signed on: ${signedAt}`);

  lines.push("", settings.footer || "Thank you for your payment!");

  return lines.filter((line, index, arr) => !(line === "" && arr[index - 1] === "")).join("\n");
}

function normalizeWhatsAppPhone(phone) {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "234" + digits.slice(1);
  } else if (digits.length === 10) {
    digits = "234" + digits;
  }
  return digits;
}

function shareReceiptViaEmail(receipt) {
  const subject = encodeURIComponent(
    `Payment Receipt ${receipt.receiptNo}${settings.businessName ? ` - ${settings.businessName}` : ""}`,
  );
  const body = encodeURIComponent(buildReceiptShareText(receipt));
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

async function captureReceiptCanvas() {
  const card = document.querySelector("#receiptPreview .receipt-card");
  if (!card) {
    throw new Error("Receipt preview not found");
  }
  if (typeof html2canvas === "undefined") {
    throw new Error("Export library not loaded. Please refresh the page.");
  }

  card.classList.add("receipt-capture");
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  try {
    return await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });
  } finally {
    card.classList.remove("receipt-capture");
  }
}

async function generateReceiptBlob(format) {
  const canvas = await captureReceiptCanvas();

  if (format === "jpg") {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not create image"))),
        "image/jpeg",
        0.92,
      );
    });
  }

  if (typeof window.jspdf === "undefined") {
    throw new Error("PDF library not loaded. Please refresh the page.");
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  let imgWidth = maxWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
    imgWidth = (canvas.width * imgHeight) / canvas.height;
  }

  const x = (pageWidth - imgWidth) / 2;
  pdf.addImage(imgData, "JPEG", x, margin, imgWidth, imgHeight);
  return pdf.output("blob");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function shareReceiptFile(receipt, format, channel) {
  const ext = format === "pdf" ? "pdf" : "jpg";
  const mimeType = format === "pdf" ? "application/pdf" : "image/jpeg";
  const filename = `${receipt.receiptNo}.${ext}`;
  const blob = await generateReceiptBlob(format);
  const file = new File([blob], filename, { type: mimeType });
  const shareText = `Payment receipt ${receipt.receiptNo} from ${settings.businessName || "Receipt Manager"}`;
  const shareData = { files: [file], title: `Receipt ${receipt.receiptNo}`, text: shareText };

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    await navigator.share(shareData);
    return;
  }

  downloadBlob(blob, filename);

  if (channel === "whatsapp") {
    const text = encodeURIComponent(`${shareText}\n\nPlease attach the downloaded ${ext.toUpperCase()} file.`);
    const customerPhone = normalizeWhatsAppPhone(receipt.phone);
    const url = customerPhone
      ? `https://wa.me/${customerPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    setTimeout(() => window.open(url, "_blank", "noopener,noreferrer"), 400);
    alert(`Receipt saved as ${filename}. In WhatsApp, tap 📎 and attach the file from your Downloads.`);
    return;
  }

  const subject = encodeURIComponent(
    `Payment Receipt ${receipt.receiptNo}${settings.businessName ? ` - ${settings.businessName}` : ""}`,
  );
  const body = encodeURIComponent(
    `${buildReceiptShareText(receipt)}\n\nPlease attach the downloaded file: ${filename}`,
  );
  setTimeout(() => {
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, 400);
  alert(`Receipt saved as ${filename}. Attach it to your email before sending.`);
}

async function handleReceiptShare(receipt, channel, buttonEl, formatSelect) {
  const format = formatSelect?.value || (channel === "email" ? "pdf" : "jpg");
  const defaultLabel = channel === "whatsapp" ? "💬 WhatsApp" : "✉️ Email";

  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.textContent = "Generating...";
  }

  try {
    await shareReceiptFile(receipt, format, channel);
  } catch (error) {
    console.error("Receipt share failed:", error);
    alert("Could not share receipt: " + error.message);
  } finally {
    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.textContent = defaultLabel;
    }
  }
}

// Render dynamic, premium receipt layout
function showReceipt(r, containerId = "receiptPreview") {
  const preview = document.getElementById(containerId);
  if (!preview) return;

  preview.classList.remove("hidden");

  const currencySymbol = settings.currency || "₦";

  // Build Business Headers from config
  const logoHtml = settings.logo
    ? `<img src="${settings.logo}" class="receipt-logo" alt="Business Logo" />`
    : "";

  const bizNameHtml = settings.businessName
    ? `<h1 class="receipt-biz-name">${escapeHtml(settings.businessName)}</h1>`
    : "";

  const bizAddressHtml = settings.address
    ? `<div class="receipt-biz-address">${escapeHtml(settings.address).replace(/\n/g, "<br>")}</div>`
    : "";

  const bizContactHtml = (settings.phone || settings.email)
    ? `<div class="receipt-biz-contact">
        ${settings.phone ? `📞 ${escapeHtml(settings.phone)}` : ""}
        ${settings.email ? ` &nbsp;✉️ ${escapeHtml(settings.email)}` : ""}
       </div>`
    : "";

  const footerMessageHtml = settings.footer
    ? `<p class="receipt-footer-message">${escapeHtml(settings.footer)}</p>`
    : `<p class="receipt-footer-message">Thank you for your payment!</p>`;

  // Format category / item string
  const categoryItemStr = escapeHtml(formatCategoryItem(r));

  preview.innerHTML = `
    <div class="receipt-card">
        <div class="receipt-card-header">
            ${logoHtml}
            ${bizNameHtml}
            ${bizAddressHtml}
            ${bizContactHtml}
            <div class="receipt-divider">
              <h2>PAYMENT RECEIPT</h2>
              <span class="receipt-no">${escapeHtml(r.receiptNo)}</span>
            </div>
        </div>
        
        <div class="receipt-card-body">
            <div class="receipt-row">
                <label>Customer</label>
                <span>${escapeHtml(r.payer)}</span>
            </div>
            
            ${r.phone ? `
            <div class="receipt-row">
                <label>Phone Number</label>
                <span>${escapeHtml(r.phone)}</span>
            </div>
            ` : ""}
            
            <div class="receipt-row">
                <label>Category / Item</label>
                <span>${categoryItemStr}</span>
            </div>
            
            <div class="receipt-row">
                <label>Payment For</label>
                <span>${escapeHtml(r.paymentType)}</span>
            </div>
            
            ${r.rentPeriodStart || r.rentPeriodEnd ? `
            <div class="receipt-row">
                <label>Payment Period</label>
                <span>${escapeHtml(formatPaymentPeriod(r.rentPeriodStart, r.rentPeriodEnd))}</span>
            </div>
            ` : ""}
            
            <div class="receipt-row">
                <label>Payment Method</label>
                <span>${escapeHtml(r.paymentMethod)}</span>
            </div>
            
            <div class="receipt-row highlight">
                <label>Amount Paid</label>
                <span class="amount">${escapeHtml(currencySymbol)}${Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            
            <div class="receipt-row">
                <label>Payment Date</label>
                <span>${r.paymentDate ? escapeHtml(r.paymentDate) : escapeHtml(r.date)}</span>
            </div>
            
            <div class="receipt-row">
                <label>Issue Date</label>
                <span>${escapeHtml(r.date)}</span>
            </div>
            
            ${r.remarks ? `
            <div class="receipt-row remarks">
                <label>Remarks</label>
                <span>${escapeHtml(r.remarks)}</span>
            </div>
            ` : ""}
        </div>
        
        ${buildSignatureBlock(r)}
        
        <div class="receipt-card-footer">
            ${footerMessageHtml}
            <div class="share-format-row">
              <label for="shareFormatSelect">Send as</label>
              <select id="shareFormatSelect" class="share-format-select">
                <option value="jpg">JPG Image</option>
                <option value="pdf">PDF Document</option>
              </select>
            </div>
            <div class="receipt-share-actions">
              <button type="button" class="share-btn whatsapp-btn">💬 WhatsApp</button>
              <button type="button" class="share-btn email-btn">✉️ Email</button>
              <button type="button" class="print-btn">🖨️ Print</button>
            </div>
        </div>
    </div>
  `;

  // Attach Print Action
  const printBtn = preview.querySelector(".print-btn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  const whatsappBtn = preview.querySelector(".whatsapp-btn");
  const formatSelect = preview.querySelector("#shareFormatSelect");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", () => {
      handleReceiptShare(r, "whatsapp", whatsappBtn, formatSelect);
    });
  }

  const emailBtn = preview.querySelector(".email-btn");
  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      handleReceiptShare(r, "email", emailBtn, formatSelect);
    });
  }
}

// Load Dashboard statistics & layouts
async function loadDashboard() {
  const data = await getAllReceipts();

  const totalReceipts = data.length;
  const totalAmount = data.reduce((sum, r) => sum + r.amount, 0);
  const currencySymbol = settings.currency || "₦";

  document.getElementById("totalReceipts").textContent = totalReceipts;
  document.getElementById("totalAmount").textContent =
    currencySymbol + Math.max(0, totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  loadEstatesOverview(data);
}

// Generate Estates revenue statistics widgets
async function loadEstatesOverview(data) {
  const estatesMap = {};

  data.forEach((r) => {
    let displayUnit = r.unit || "Unassigned";
    if (r.estateName) {
      displayUnit = `${r.estateName} - ${r.unit || "Unassigned"}`;
    }

    if (!estatesMap[displayUnit]) {
      estatesMap[displayUnit] = { label: displayUnit, count: 0, total: 0 };
    }
    estatesMap[displayUnit].count += 1;
    estatesMap[displayUnit].total += r.amount;
  });

  const estatesList = Object.values(estatesMap).sort(
    (a, b) => b.total - a.total,
  );
  const container = document.getElementById("estatesContainer");

  if (!container) return;

  if (estatesList.length === 0) {
    container.innerHTML = "<p style='text-align: center; color: #64748b;'>No sales recorded yet.</p>";
    return;
  }

  const currencySymbol = settings.currency || "₦";
  let html = "<div class='estates-overview-grid'>";
  estatesList.forEach((estate) => {
    html += `
      <div class="estate-overview-card">
        <div class="estate-overview-info">
          <strong>${escapeHtml(estate.label)}</strong>
          <br>
          <small>Receipts: ${estate.count}</small>
        </div>
        <div class="estate-overview-amount">
          ${escapeHtml(currencySymbol)}${Math.max(0, estate.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    `;
  });
  html += "</div>";
  container.innerHTML = html;
}

// Load standard history list on Dashboard
async function loadHistory() {
  receipts = await getAllReceipts();
  const list = document.getElementById("receiptList");

  if (receipts.length === 0) {
    list.innerHTML = "<p style='text-align: center; color: #64748b;'>No receipts found</p>";
    return;
  }

  const currencySymbol = settings.currency || "₦";
  let html = "";
  [...receipts].reverse().forEach((r) => {
    let categoryText = escapeHtml(formatCategoryItem(r));

    html += `
      <div class="history-item">
        <div class="history-info">
          <strong>${escapeHtml(r.receiptNo)}</strong>
          <br>
          ${escapeHtml(r.payer)}
          <br>
          <span style="font-size: 13px; color: #64748b;">${categoryText}</span>
          <br>
          <span style="font-weight: bold; color: var(--success);">${escapeHtml(currencySymbol)}${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="history-actions">
          <button class="view-btn" data-no="${escapeHtml(r.receiptNo)}">View</button>
          <button class="delete-btn" data-no="${escapeHtml(r.receiptNo)}">Delete</button>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

// Detail History section loader
async function loadHistoryDetail() {
  const data = await getAllReceipts();
  const list = document.getElementById("historyDetailList");

  if (data.length === 0) {
    list.innerHTML = "<p style='text-align: center; color: #64748b;'>No receipts found</p>";
    return;
  }

  const currencySymbol = settings.currency || "₦";
  let html = "";
  [...data].reverse().forEach((r) => {
    let categoryText = escapeHtml(formatCategoryItem(r));

    html += `
      <div class="history-item">
        <div class="history-info">
          <strong>${escapeHtml(r.receiptNo)}</strong>
          <br>
          ${escapeHtml(r.payer)}
          <br>
          <span style="font-size: 13px; color: #64748b;">${categoryText}</span>
          <br>
          <span style="font-weight: bold; color: var(--success);">${escapeHtml(currencySymbol)}${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="history-actions">
          <button class="view-btn" data-no="${escapeHtml(r.receiptNo)}">View</button>
          <button class="delete-btn" data-no="${escapeHtml(r.receiptNo)}">Delete</button>
        </div>
      </div>
    `;
  });
  list.innerHTML = html;
}

// View details for a single receipt
async function viewReceipt(no) {
  const receipt = await getReceipt(no);
  if (!receipt) {
    alert("Receipt not found");
    return;
  }
  showReceipt(receipt);
  showSection("viewReceipt");
}

// Remove single receipt record
async function removeReceipt(no) {
  if (!confirm("Are you sure you want to delete this receipt? This action cannot be undone.")) return;

  await deleteReceipt(no);
  loadHistory();
  loadHistoryDetail();
  loadDashboard();
  
  // If we are currently displaying the deleted receipt on preview, reset it
  const preview = document.getElementById("receiptPreview");
  if (preview && !preview.classList.contains("hidden")) {
    const activeReceiptNoEl = preview.querySelector(".receipt-no");
    if (activeReceiptNoEl && activeReceiptNoEl.textContent === no) {
      preview.innerHTML = "<p style='text-align: center; color: #64748b; padding: 40px 0;'>Select a receipt from History to view</p>";
    }
  }
}

// Multi-field search implementation
async function searchReceipt() {
  const query = document.getElementById("searchBox").value.trim().toLowerCase();
  const resultsContainer = document.getElementById("searchResults");
  if (!resultsContainer) return;

  if (!query) {
    resultsContainer.innerHTML = "<p style='text-align: center; color: #64748b; padding: 10px 0;'>Please enter a search query (customer, item, or receipt number)</p>";
    return;
  }

  const allReceipts = await getAllReceipts();
  const matches = allReceipts.filter((r) => {
    const receiptNo = (r.receiptNo || "").toLowerCase();
    const payer = (r.payer || "").toLowerCase();
    const phone = (r.phone || "").toLowerCase();
    const unit = (r.unit || "").toLowerCase();
    const estateName = (r.estateName || "").toLowerCase();
    const remarks = (r.remarks || "").toLowerCase();
    const type = (r.paymentType || "").toLowerCase();
    
    return receiptNo.includes(query) || 
           payer.includes(query) || 
           phone.includes(query) || 
           unit.includes(query) ||
           estateName.includes(query) ||
           remarks.includes(query) ||
           type.includes(query);
  });

  if (matches.length === 0) {
    resultsContainer.innerHTML = "<p style='text-align: center; color: #64748b; padding: 20px 0;'>No matching receipts found</p>";
    return;
  }

  const currencySymbol = settings.currency || "₦";
  let html = `<h3 style="margin-bottom: 15px; font-size: 16px; color: var(--primary);">Search Results (${matches.length})</h3>`;
  
  matches.reverse().forEach((r) => {
    const categoryText = escapeHtml(formatCategoryItem(r));
    
    html += `
      <div class="history-item">
        <div class="history-info">
          <strong>${escapeHtml(r.receiptNo)}</strong>
          <br>
          ${escapeHtml(r.payer)}
          <br>
          <span style="font-size: 13px; color: #64748b;">${categoryText}</span>
          <br>
          <span style="font-weight: bold; color: var(--success);">${escapeHtml(currencySymbol)}${r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="history-actions">
          <button class="view-btn" data-no="${escapeHtml(r.receiptNo)}">View</button>
          <button class="delete-btn" data-no="${escapeHtml(r.receiptNo)}">Delete</button>
        </div>
      </div>
    `;
  });
  
  resultsContainer.innerHTML = html;
}

// Section routing and sidebar link synchronization
function showSection(sectionId) {
  // Hide all sections
  const sections = document.querySelectorAll(".page-section");
  sections.forEach((section) => {
    section.classList.add("hidden");
  });

  // Show target section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.remove("hidden");

    // Sync active state of navigation links
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((nav) => {
      if (nav.getAttribute("data-section") === sectionId) {
        nav.classList.add("active");
      } else {
        nav.classList.remove("active");
      }
    });

    // Lazy load section specific data
    if (sectionId === "estates") {
      loadEstatesDetail();
    } else if (sectionId === "history") {
      loadHistoryDetail();
    } else if (sectionId === "receipt") {
      loadEstates();
      updateEstateDropdown();
      togglePaymentPeriodFields();
    } else if (sectionId === "viewReceipt") {
      // If there is no content inside receipt preview, add empty state message
      const preview = document.getElementById("receiptPreview");
      if (preview && preview.innerHTML.trim() === "") {
        preview.innerHTML = "<p style='text-align: center; color: #64748b; padding: 40px 0;'>Select or create a receipt to view details</p>";
      }
    }
  }
}

// Load Estates details on Estates Section
async function loadEstatesDetail() {
  const container = document.getElementById("estatesListContainer");

  if (!container) return;

  if (estates.length === 0) {
    container.innerHTML =
      "<p style='text-align: center; color: #64748b; padding: 20px 0;'>No categories added yet. Add one above to get started.</p>";
    return;
  }

  let html = "";
  estates.forEach((estate) => {
    const unitsListHtml = estate.units && estate.units.length > 0
      ? `<div class="estate-units-list">
          <strong>Items:</strong>
          ${estate.units.map(u => `<span class="unit-badge">${escapeHtml(u)}</span>`).join(" ")}
         </div>`
      : `<div class="estate-units-list" style="color: #64748b; font-style: italic;">No items configured</div>`;

    html += `
      <div class="estate-item">
        <div class="estate-info">
          <h3>${escapeHtml(estate.name)}</h3>
          ${estate.location ? `<p class="estate-location">📍 ${escapeHtml(estate.location)}</p>` : ""}
          ${unitsListHtml}
        </div>
        <div class="estate-actions">
          <button class="edit-btn" data-id="${estate.id}">Edit</button>
          <button class="delete-btn" data-id="${estate.id}">Delete</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// Backup Export Logic (including settings & properties)
async function exportBackup() {
  const receiptsData = await getAllReceipts();
  
  let savedEstates = [];
  try {
    const saved = localStorage.getItem("estates");
    if (saved) savedEstates = JSON.parse(saved);
  } catch (e) {
    console.error("Error reading estates for backup", e);
  }

  let savedSettings = {};
  try {
    const saved = localStorage.getItem("businessSettings");
    if (saved) savedSettings = JSON.parse(saved);
  } catch (e) {
    console.error("Error reading settings for backup", e);
  }

  const backupObj = {
    app: "ReceiptManager",
    version: 2,
    exportDate: new Date().toISOString(),
    receipts: receiptsData,
    estates: savedEstates,
    settings: savedSettings
  };

  const blob = new Blob([JSON.stringify(backupObj, null, 2)], {
    type: "application/json",
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `receipts-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
}

// Backup Import Logic (with backward compatibility)
async function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    let receiptsToImport = [];
    
    if (Array.isArray(data)) {
      // Legacy backup format (only receipts array)
      receiptsToImport = data;
    } else if (data && data.receipts) {
      // New complete backup format
      receiptsToImport = data.receipts;
      
      // Import estates
      if (data.estates && Array.isArray(data.estates) && data.estates.length > 0) {
        if (confirm(`Restore ${data.estates.length} categories from backup? (This will overwrite current categories)`)) {
          localStorage.setItem("estates", JSON.stringify(data.estates));
          loadEstates();
        }
      }
      
      // Import settings
      if (data.settings && typeof data.settings === "object" && Object.keys(data.settings).length > 0) {
        if (confirm("Restore business settings from backup? (This will overwrite current settings)")) {
          localStorage.setItem("businessSettings", JSON.stringify(data.settings));
          loadSettings();
        }
      }
    } else {
      alert("Invalid backup file format");
      return;
    }

    if (receiptsToImport.length > 0) {
      for (const r of receiptsToImport) {
        await saveReceipt(r);
      }
      alert(`Imported ${receiptsToImport.length} receipts successfully!`);
    } else {
      alert("No receipts found in backup file.");
    }
    
    loadHistory();
    loadDashboard();
  } catch (error) {
    alert("Error importing backup: " + error.message);
    console.error(error);
  } finally {
    e.target.value = ""; // Reset file selector
  }
}

// Service Worker PWA Register
function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((error) =>
        console.error("Service Worker registration failed:", error),
      );
  }
}

function isAppInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function initInstallPrompt() {
  const installCard = document.getElementById("installCard");
  const installBtn = document.getElementById("installAppBtn");
  const iosHelp = document.getElementById("iosInstallHelp");

  if (!installCard || !installBtn) return;

  if (isAppInstalled()) {
    installCard.hidden = true;
    return;
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isIosSafari = isIos && !window.navigator.standalone;

  function showInstallCard(showIosHelp) {
    installCard.hidden = false;
    if (iosHelp) {
      iosHelp.classList.toggle("hidden", !showIosHelp);
    }
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.deferredInstallPrompt = e;
    showInstallCard(false);
  });

  if (isIosSafari) {
    showInstallCard(true);
  }

  bindTap(installBtn, async () => {
    const promptEvent = window.deferredInstallPrompt;

    if (promptEvent) {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        installCard.hidden = true;
      }
      window.deferredInstallPrompt = null;
      return;
    }

    if (isIosSafari) {
      installCard.scrollIntoView({ behavior: "smooth", block: "center" });
      if (iosHelp) iosHelp.classList.remove("hidden");
      return;
    }

    alert(
      "To install: open this site in Chrome, tap the menu (⋮), then choose Install app or Add to Home screen.",
    );
  });

  window.addEventListener("appinstalled", () => {
    window.deferredInstallPrompt = null;
    installCard.hidden = true;
  });
}

// Sequential/Random receipt no generation using settings prefix
function generateReceiptNo() {
  try {
    let prefix = settings.prefix || "RCP";
    let date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    let random = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${date}-${random}`;
  } catch (error) {
    console.error("Error generating receipt number:", error);
    return `RCP-${Date.now()}`;
  }
}
