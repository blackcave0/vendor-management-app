const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database("invoices.db");

db.run(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY,
    invoice_number TEXT,
    customer_name TEXT,
    invoice_date DATE,
    total_amount REAL,
    received_amount REAL,
    balance REAL
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY,
    invoice_id INTEGER,
    item_name TEXT,
    quantity INTEGER,
    price_per_unit REAL,
    amount REAL,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    stocks INTEGER,
    category TEXT,
    supplier TEXT,
    description TEXT
  )
`);

ipcMain.on("save-invoice", (event, invoiceData) => {
  const {
    invoice_number,
    customer_name,
    invoice_date,
    total_amount,
    received,
    balance,
    items,
  } = invoiceData;
  const stmt = db.prepare(`
    INSERT INTO invoices (invoice_number, customer_name, invoice_date, total_amount, received_amount, balance)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    invoice_number,
    customer_name,
    invoice_date,
    total_amount,
    received,
    balance,
    function (err) {
      if (err) {
        event.sender.send("save-invoice-response", {
          success: false,
          error: err.message,
        });
        return;
      }
      const invoiceId = this.lastID;
      items.forEach((item) => {
        db.run(
          `
        INSERT INTO invoice_items (invoice_id, item_name, quantity, price_per_unit, amount)
        VALUES (?, ?, ?, ?, ?)
      `,
          [
            invoiceId,
            item.description,
            item.quantity,
            item.price_per_unit,
            item.amount,
          ]
        );
      });
      event.sender.send("save-invoice-response", { success: true });
    }
  );
});

ipcMain.on("get-next-invoice-number", (event) => {
  db.get("SELECT MAX(id) as max_id FROM invoices", (err, row) => {
    const nextNumber =
      row && row.max_id ? (row.max_id + 1).toString().padStart(2, "0") : "01";
    event.sender.send("next-invoice-number", nextNumber);
  });
});

// Fetch products
ipcMain.on("fetch-products", (event) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) {
      console.error(err.message);
      event.sender.send("fetch-products-response", []);
    } else {
      event.sender.send("fetch-products-response", rows);
    }
  });
});

// Save or update a product
ipcMain.on("save-product", (event, product) => {
  if (product.id && !isNaN(parseInt(product.id))) {
    db.run(
      `UPDATE products SET name = ?, price = ?, stocks = ?, category = ?, supplier = ?, description = ? WHERE id = ?`,
      [
        product.name,
        product.price,
        product.stocks,
        product.category,
        product.supplier,
        product.description,
        product.id,
      ],
      (err) => {
        event.sender.send("save-product-response", !err); // Send success or failure response
      }
    );
  } else {
    db.run(
      `INSERT INTO products (name, price, stocks, category, supplier, description) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.price,
        product.stocks,
        product.category,
        product.supplier,
        product.description,
      ],
      function (err) {
        if (!err) {
          // Send back the new product with its database ID
          db.get(
            "SELECT * FROM products WHERE id = ?",
            [this.lastID],
            (err, row) => {
              event.sender.send("save-product-response", {
                success: true,
                product: row,
              });
            }
          );
        } else {
          event.sender.send("save-product-response", {
            success: false,
            error: err.message,
          });
        }
      }
    );
  }
});

// Delete a product
ipcMain.on("delete-product", (event, productId) => {
  db.run(`DELETE FROM products WHERE id = ?`, [productId], (err) => {
    event.sender.send("delete-product-response", !err);
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "renderer.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html"); // Ensure this points to the correct file
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
