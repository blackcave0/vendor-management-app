const vendorList = document.getElementById("vendorList");
let vendors = [];

const loginContainer = document.getElementById("loginContainer");
const appContainer = document.getElementById("appContainer");
const adminPassword = "admin123"; // Replace with a secure method in production

function login() {
  const enteredPassword = document.getElementById("adminPassword").value;
  if (enteredPassword === adminPassword) {
    loginContainer.style.display = "none";
    appContainer.style.display = "block";
  } else {
    alert("Incorrect password. Please try again.");
  }
}

function addVendor() {
  const name = document.getElementById("vendorName").value;
  const contact = document.getElementById("vendorContact").value;

  if (name && contact) {
    const vendor = { name, contact };
    vendors.push(vendor);
    updateVendorList();
    clearInputs();
    saveDataLocally();
  } else {
    alert("Please fill in all fields");
  }
}

function updateVendorList() {
  vendorList.innerHTML = "";
  vendors.forEach((vendor, index) => {
    const li = document.createElement("li");
    li.textContent = `${vendor.name} - ${vendor.contact}`;
    vendorList.appendChild(li);
  });
}

function clearInputs() {
  document.getElementById("vendorName").value = "";
  document.getElementById("vendorContact").value = "";
}

// Store data locally when offline
function saveDataLocally() {
  localStorage.setItem("vendors", JSON.stringify(vendors));
}

// Load data from localStorage on app start
function loadDataFromLocalStorage() {
  const storedVendors = localStorage.getItem("vendors");
  if (storedVendors) {
    vendors = JSON.parse(storedVendors);
    updateVendorList();
  }
}

// Sync data to the server
function syncData() {
  if (navigator.onLine) {
    // Simulate server sync (replace with actual server API call)
    console.log("Syncing data to the server:", vendors);
    alert("Data synced successfully!");
    localStorage.removeItem("vendors"); // Clear local storage after sync
  } else {
    alert("You are offline. Please connect to the internet to sync data.");
  }
}

// Load data from localStorage on page load
window.addEventListener("load", loadDataFromLocalStorage);

// Add event listener for online/offline status
window.addEventListener("online", () => alert("You are back online!"));
window.addEventListener("offline", () => alert("You are offline. Data will be saved locally."));

const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.send("get-next-invoice-number");
  ipcRenderer.on("next-invoice-number", (event, number) => {
    document.getElementById("invoice-number").value = number;
  });

  const sidebarLinks = document.querySelectorAll(".sidebar-menu a");
  const mainContent = document.getElementById("mainContent");

  // Function to load HTML content dynamically
  function loadContent(section) {
    fetch(`views/${section}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${section}`);
        }
        return response.text();
      })
      .then((html) => {
        mainContent.innerHTML = html;
      })
      .catch((error) => {
        console.error(error);
        mainContent.innerHTML = "<p>Error loading content. Please try again later.</p>";
      });
  }

  // Add click event listeners to sidebar links
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const section = link.getAttribute("data-section");
      loadContent(section);

      // Highlight the active link
      sidebarLinks.forEach((link) => link.parentElement.classList.remove("active"));
      link.parentElement.classList.add("active");
    });
  });

  // Load the default section (Dashboard) on page load
  loadContent("dashboard.html");
});

document.querySelector(".add-row").addEventListener("click", () => {
  const initialRow = document.querySelector(".item-row");
  const newRow = initialRow.cloneNode(true);
  newRow.querySelectorAll("input").forEach(input => (input.value = ""));
  newRow.querySelector(".item-amount").innerText = "0";
  initialRow.parentElement.appendChild(newRow);
});

document.addEventListener("input", (event) => {
  if (event.target.name === "item-quantity" || event.target.name === "item-price") {
    const row = event.target.closest(".item-row");
    calculateItemAmount(row);
    calculateTotalAmount();
    calculateBalance();
  } else if (event.target.id === "received") {
    calculateBalance();
  }
});

function calculateItemAmount(row) {
  const quantity = parseInt(row.querySelector('input[name="item-quantity"]').value) || 0;
  const pricePerUnit = parseFloat(row.querySelector('input[name="item-price"]').value) || 0;
  const amount = quantity * pricePerUnit;
  row.querySelector(".item-amount").innerText = amount.toFixed(2);
  return amount;
}

function calculateTotalAmount() {
  const itemRows = document.querySelectorAll(".item-row");
  let total = 0;
  itemRows.forEach(row => {
    total += calculateItemAmount(row);
  });
  document.getElementById("total-amount").innerText = total.toFixed(2);
  return total;
}

function calculateBalance() {
  const totalAmount = parseFloat(document.getElementById("total-amount").innerText) || 0;
  const received = parseFloat(document.getElementById("received").value) || 0;
  document.getElementById("balance").innerText = (totalAmount - received).toFixed(2);
}

document.querySelector(".create-invoice").addEventListener("click", () => {
  const invoiceData = {
    invoice_number: document.getElementById("invoice-number").value,
    customer_name: document.getElementById("customer-name").value,
    invoice_date: document.getElementById("invoice-date").value,
    total_amount: parseFloat(document.getElementById("total-amount").innerText),
    received: parseFloat(document.getElementById("received").value),
    balance: parseFloat(document.getElementById("balance").innerText),
    items: Array.from(document.querySelectorAll(".item-row")).map(row => ({
      description: row.querySelector('input[name="item-description"]').value,
      quantity: parseInt(row.querySelector('input[name="item-quantity"]').value),
      price_per_unit: parseFloat(row.querySelector('input[name="item-price"]').value),
      amount: parseFloat(row.querySelector(".item-amount").innerText),
    })),
  };

  ipcRenderer.send("save-invoice", invoiceData);
  ipcRenderer.on("save-invoice-response", (event, response) => {
    if (response.success) {
      alert("Invoice saved successfully!");
      location.reload();
    } else {
      alert("Error saving invoice: " + response.error);
    }
  });
});
