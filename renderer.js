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
