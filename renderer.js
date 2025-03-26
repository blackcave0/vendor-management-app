const { ipcRenderer } = require("electron");
let allProducts = [];

// DOM Content Loaded Event
document.addEventListener("DOMContentLoaded", function() {
  // Check for login status
  const loginContainer = document.getElementById('loginContainer');
  const appContainer = document.getElementById('appContainer');
  
  if (loginContainer && appContainer) {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      loginContainer.style.display = 'none';
      appContainer.style.display = 'block';
    } else {
      loginContainer.style.display = 'block';
      appContainer.style.display = 'none';
    }
    
    // Add login form event listener
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        login();
      });
    }
  }
  
  // Initialize product page if we're on it
  initProductPage();

  // Initialize sidebar navigation
  const sidebarLinks = document.querySelectorAll(".sidebar-menu a");
  const mainContent = document.getElementById("mainContent");

  if (sidebarLinks.length > 0 && mainContent) {
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
          
          // Initialize product page functionality if we're on the products page
          if (section === "products.html") {
            initProductsPage();
          }
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
  }

  // Get next invoice number if we're on the invoice page
  if (document.getElementById("invoice-number")) {
    ipcRenderer.send("get-next-invoice-number");
  }

  // If we're directly on the products page (not loaded via sidebar)
  if (document.getElementById("productTable")) {
    initProductsPage();
  }

  initIPCListeners(); // Ensure IPC listeners are initialized only once
});

// Update the login function
function login() {
  const enteredPassword = document.getElementById("adminPassword").value;
  const loginContainer = document.getElementById("loginContainer");
  const appContainer = document.getElementById("appContainer");

  if (enteredPassword === "admin123") { // Replace "admin123" with your actual password
    localStorage.setItem('isLoggedIn', 'true'); // Save login state
    loginContainer.style.display = "none";
    appContainer.style.display = "block";
  } else {
    alert("Incorrect password. Please try again.");
  }
}

// Add this function to initialize the product page
function initProductPage() {
  const productTable = document.getElementById('productTable');
  const addProductBtn = document.getElementById('addProductBtn');
  const productForm = document.getElementById('productForm');
  const modal = document.getElementById('productModal');
  const closeButton = document.querySelector('.close-button');
  const searchInput = document.getElementById('searchInput');
  
  if (!productTable) return; // Not on the products page
  
  // Fetch products from database
  fetchProducts();
  
  // Add product button click handler
  if (addProductBtn) {
    addProductBtn.addEventListener('click', function() {
      openProductModal();
    });
  }
  
  // Close modal button
  if (closeButton) {
    closeButton.addEventListener('click', function() {
      closeProductModal();
    });
  }
  
  // Close modal when clicking outside
  if (modal) {
    window.addEventListener('click', function(event) {
      if (event.target === modal) {
        closeProductModal();
      }
    });
  }
  
  // Product form submission
  if (productForm) {
    productForm.addEventListener('submit', function(e) {
      e.preventDefault();
      saveProduct();
    });
  }
  
  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const products = JSON.parse(localStorage.getItem('electron_products') || '[]');
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.supplier.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
      renderProductTable(filtered);
    });
  }
}

// Function to open product modal
function openProductModal(product = null) {
  const modal = document.getElementById('productModal');
  const productIdInput = document.getElementById('productId');
  const productNameInput = document.getElementById('productName');
  const productPriceInput = document.getElementById('productPrice');
  const productStocksInput = document.getElementById('productStocks');
  const productCategoryInput = document.getElementById('productCategory');
  const productSupplierInput = document.getElementById('productSupplier');
  const productDescriptionInput = document.getElementById('productDescription');
  const modalTitle = document.getElementById('modalTitle');
  
  // Reset form
  document.getElementById('productForm').reset();
  
  if (product) {
    // Edit existing product
    modalTitle.textContent = 'Edit Product';
    productIdInput.value = product.id;
    productNameInput.value = product.name;
    productPriceInput.value = product.price;
    productStocksInput.value = product.stocks;
    productCategoryInput.value = product.category;
    productSupplierInput.value = product.supplier;
    productDescriptionInput.value = product.description || '';
  } else {
    // Add new product
    modalTitle.textContent = 'Add New Product';
    productIdInput.value = '';
  }
  
  modal.style.display = 'block';
}

// Function to close product modal
function closeProductModal() {
  const modal = document.getElementById('productModal');
  modal.style.display = 'none';
}

// Function to save product
function saveProduct() {
  const productId = document.getElementById('productId').value;
  const productName = document.getElementById('productName').value;
  const productPrice = parseFloat(document.getElementById('productPrice').value) || 0;
  const productStocks = parseInt(document.getElementById('productStocks').value) || 0;
  const productCategory = document.getElementById('productCategory').value;
  const productSupplier = document.getElementById('productSupplier').value;
  const productDescription = document.getElementById('productDescription').value;

  if (!productName || !productCategory || !productSupplier) {
    alert('Please fill in all required fields');
    return;
  }

  const productData = {
    id: productId || null,
    name: productName,
    price: productPrice,
    stocks: productStocks,
    category: productCategory,
    supplier: productSupplier,
    description: productDescription
  };

  // Save to database via IPC
  ipcRenderer.send('save-product', productData);

  // Also save to localStorage for offline functionality
  const storedProducts = JSON.parse(localStorage.getItem('electron_products') || '[]');

  if (productId) {
    // Update existing product
    const index = storedProducts.findIndex(p => p.id.toString() === productId.toString());
    if (index !== -1) {
      storedProducts[index] = productData;
    } else {
      storedProducts.push(productData);
    }
  } else {
    // Add new product with temporary ID
    productData.id = `temp_${Date.now()}`;
    storedProducts.push(productData);
  }

  localStorage.setItem('electron_products', JSON.stringify(storedProducts));

  // Update UI immediately
  renderProductTable(storedProducts);

  // Close modal
  closeProductModal();
}

// Function to fetch products from database
function fetchProducts() {
  // First load from localStorage for immediate display
  const storedProducts = JSON.parse(localStorage.getItem('electron_products') || '[]');
  renderProductTable(storedProducts);

  // Then fetch from database
  ipcRenderer.send('fetch-products');
}

// Function to delete product
function deleteProduct(productId) {
  // Delete from database
  ipcRenderer.send('delete-product', productId);

  // Delete from localStorage
  const storedProducts = JSON.parse(localStorage.getItem('electron_products') || '[]');
  const updatedProducts = storedProducts.filter(p => p.id.toString() !== productId.toString());
  localStorage.setItem('electron_products', JSON.stringify(updatedProducts));

  // Update UI
  renderProductTable(updatedProducts);
}

// Function to render product table
function renderProductTable(products) {
  const productTable = document.getElementById('productTable');
  const totalPriceEl = document.getElementById('totalPrice');
  const totalProductsEl = document.getElementById('totalProducts');
  const paginationInfoEl = document.getElementById('paginationInfo');

  if (!productTable) return;

  // Clear table
  productTable.innerHTML = '';

  // Calculate totals
  let totalValue = 0;

  if (products.length === 0) {
    // No products
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'No products found';
    cell.className = 'p-3 text-center text-gray-500';
    row.appendChild(cell);
    productTable.appendChild(row);
  } else {
    // Render each product
    products.forEach(product => {
      const row = document.createElement('tr');
      row.className = 'border-b hover:bg-gray-50';
  
      // Name cell
      const nameCell = document.createElement('td');
      nameCell.className = 'p-3';
      nameCell.textContent = product.name;
      row.appendChild(nameCell);
  
      // Price cell
      const priceCell = document.createElement('td');
      priceCell.className = 'p-3';
      priceCell.textContent = `${parseFloat(product.price).toFixed(2)}`;
      row.appendChild(priceCell);
  
      // Stocks cell
      const stocksCell = document.createElement('td');
      stocksCell.className = 'p-3';
      stocksCell.textContent = product.stocks;
      row.appendChild(stocksCell);
  
      // Category cell
      const categoryCell = document.createElement('td');
      categoryCell.className = 'p-3';
      categoryCell.textContent = product.category;
      row.appendChild(categoryCell);
  
      // Supplier cell
      const supplierCell = document.createElement('td');
      supplierCell.className = 'p-3';
      supplierCell.textContent = product.supplier;
      row.appendChild(supplierCell);
  
      // Description cell
      const descriptionCell = document.createElement('td');
      descriptionCell.className = 'p-3';
      descriptionCell.textContent = product.description || '';
      row.appendChild(descriptionCell);
  
      // Actions cell
      const actionsCell = document.createElement('td');
      actionsCell.className = 'p-3';
  
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit mr-2';
      editBtn.textContent = 'Edit';
      editBtn.dataset.id = product.id;
      editBtn.addEventListener('click', function () {
        openProductModal(product);
      });
  
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.dataset.id = product.id;
      deleteBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to delete this product?')) {
          deleteProduct(product.id);
        }
      });
  
      actionsCell.appendChild(editBtn);
      actionsCell.appendChild(deleteBtn);
      row.appendChild(actionsCell);
  
      productTable.appendChild(row);
  
      // Add to total value
      totalValue += parseFloat(product.price) * parseInt(product.stocks);
    });
  }

  // Update summary elements
  if (totalPriceEl) totalPriceEl.textContent = totalValue.toFixed(2);
  if (totalProductsEl) totalProductsEl.textContent = `No. of Products: ${products.length}`;
  if (paginationInfoEl) paginationInfoEl.textContent = `Showing 1 to ${products.length} of ${products.length} results`;
}

// Update the loadContent function in renderer.js
function loadContent(section) {
  console.log(`Attempting to load: views/${section}`);

  fetch(`views/${section}`)
    .then((response) => {
      if (!response.ok) {
        console.error(`Failed to load ${section} with status: ${response.status}`);
        throw new Error(`Failed to load ${section}`);
      }
      return response.text();
    })
    .then((html) => {
      mainContent.innerHTML = html;
  
      // Initialize specific functionality based on the loaded page
      if (section === 'products.html') {
        initProductsPage();
      }
    })
    .catch((error) => {
      console.error('Error loading content:', error);
      mainContent.innerHTML = `<div class="p-6">
        <h2 class="text-xl text-red-600 mb-4">Error loading content</h2>
        <p class="mb-4">Could not load ${section}. Please check if the file exists.</p>
        <p class="text-sm text-gray-600">Error details: ${error.message}</p>
        <button onclick="window.location.reload()" class="bg-blue-500 text-white px-4 py-2 rounded mt-4">
          Reload Page
        </button>
      </div>`;
    });
}

// Add this function to initialize the products page
function initProductsPage() {
  console.log('Initializing products page');

  const productTable = document.getElementById('productTable');
  const addProductBtn = document.getElementById('addProductBtn');
  const modal = document.getElementById('productModal');
  const closeButton = document.querySelector('.close-button');
  const productForm = document.getElementById('productForm');
  const searchInput = document.getElementById('searchInput');

  if (!productTable) {
    console.error('Product table element not found');
    return;
  }

  // Load products from localStorage for immediate display
  const storedProducts = JSON.parse(localStorage.getItem('electron_products') || '[]');
  renderProductTable(storedProducts);

  // Fetch products from the database
  ipcRenderer.send('fetch-products');

  // Add event listeners
  if (addProductBtn) {
    addProductBtn.addEventListener('click', () => {
      document.getElementById('productForm').reset();
      document.getElementById('productId').value = '';
      document.getElementById('modalTitle').textContent = 'Add New Product';
      modal.style.display = 'block';
    });
  }

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  if (modal) {
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  if (productForm) {
    productForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const productData = {
        id: document.getElementById('productId').value || null,
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value) || 0,
        stocks: parseInt(document.getElementById('productStocks').value) || 0,
        category: document.getElementById('productCategory').value,
        supplier: document.getElementById('productSupplier').value,
        description: document.getElementById('productDescription').value
      };

      // Save to database
      ipcRenderer.send('save-product', productData);

      // Close modal
      modal.style.display = 'none';
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.toLowerCase();
      const products = JSON.parse(localStorage.getItem('electron_products') || '[]');

      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.supplier.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm))
      );

      renderProductTable(filtered);
    });
  }
}

// IPC response handlers
ipcRenderer.on('fetch-products-response', (event, products) => {
  // Update localStorage with database data
  localStorage.setItem('electron_products', JSON.stringify(products));
  // Update UI
  renderProductTable(products);
});

/* ipcRenderer.on('save-product-response', (event, response) => {
  if (response.success) {
    // Refresh products from database
    fetchProducts();
    alert('Product saved successfully!');
  } else {
    alert('Error saving product: ' + (response.error || 'Unknown error'));
  }
}); */

ipcRenderer.on('delete-product-response', (event, success) => {
  if (success) {
    alert('Product deleted successfully!');
    fetchProducts();
  } else {
    alert('Error deleting product');
  }
});

// Handle database product fetch response
ipcRenderer.on('fetch-products-response', (event, products) => {
  // Update localStorage with the latest data from the database
  localStorage.setItem('electron_products', JSON.stringify(products));
  allProducts = products;
  renderTable(products);
});

// Handle product save response
ipcRenderer.on('save-product-response', (event, success) => {
  if (success) {
    alert('Product saved successfully!');
    ipcRenderer.send('fetch-products'); // Refresh the product list
  } else {
    alert('Failed to save product. Please try again.');
  }
});

// Handle next invoice number response
ipcRenderer.on("next-invoice-number", (event, number) => {
  const invoiceNumberInput = document.getElementById("invoice-number");
  if (invoiceNumberInput) {
    invoiceNumberInput.value = number;
  }
});

let ipcListenersAdded = false;

function initIPCListeners() {
  if (ipcListenersAdded) return; // Prevent adding listeners multiple times
  ipcListenersAdded = true;

  ipcRenderer.on('fetch-products-response', (event, products) => {
    localStorage.setItem('electron_products', JSON.stringify(products));
    renderProductTable(products);
  });

  /* ipcRenderer.on('save-product-response', (event, response) => {
    if (response.success) {
      fetchProducts(); // Refresh the product list
      alert('Product saved successfully!'); // Show success message only once
    } else {
      alert('Error saving product: ' + (response.error || 'Unknown error'));
    }
  }); */

  ipcRenderer.on('delete-product-response', (event, success) => {
    if (success) {
      fetchProducts(); // Refresh the product list
      alert('Product deleted successfully!'); // Show success message only once
    } else {
      alert('Error deleting product');
    }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  // Check for login status
  const loginContainer = document.getElementById('loginContainer');
  const appContainer = document.getElementById('appContainer');
  
  if (loginContainer && appContainer) {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      loginContainer.style.display = 'none';
      appContainer.style.display = 'block';
    } else {
      loginContainer.style.display = 'block';
      appContainer.style.display = 'none';
    }
    
    // Add login form event listener
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        login();
      });
    }
  }
  
  // Initialize product page if we're on it
  initProductPage();

  // Initialize sidebar navigation
  const sidebarLinks = document.querySelectorAll(".sidebar-menu a");
  const mainContent = document.getElementById("mainContent");

  if (sidebarLinks.length > 0 && mainContent) {
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
          
          // Initialize product page functionality if we're on the products page
          if (section === "products.html") {
            initProductsPage();
          }
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
  }

  // Get next invoice number if we're on the invoice page
  if (document.getElementById("invoice-number")) {
    ipcRenderer.send("get-next-invoice-number");
  }

  // If we're directly on the products page (not loaded via sidebar)
  if (document.getElementById("productTable")) {
    initProductsPage();
  }

  initIPCListeners(); // Ensure IPC listeners are initialized only once
});