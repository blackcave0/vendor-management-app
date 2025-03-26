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

ipcMain.on("save-invoice", (event, invoiceData) => {
  const { invoice_number, customer_name, invoice_date, total_amount, received, balance, items } = invoiceData;
  const stmt = db.prepare(`
    INSERT INTO invoices (invoice_number, customer_name, invoice_date, total_amount, received_amount, balance)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(invoice_number, customer_name, invoice_date, total_amount, received, balance, function (err) {
    if (err) {
      event.sender.send("save-invoice-response", { success: false, error: err.message });
      return;
    }
    const invoiceId = this.lastID;
    items.forEach(item => {
      db.run(`
        INSERT INTO invoice_items (invoice_id, item_name, quantity, price_per_unit, amount)
        VALUES (?, ?, ?, ?, ?)
      `, [invoiceId, item.description, item.quantity, item.price_per_unit, item.amount]);
    });
    event.sender.send("save-invoice-response", { success: true });
  });
});

ipcMain.on("get-next-invoice-number", (event) => {
  db.get("SELECT MAX(id) as max_id FROM invoices", (err, row) => {
    const nextNumber = row && row.max_id ? (row.max_id + 1).toString().padStart(2, "0") : "01";
    event.sender.send("next-invoice-number", nextNumber);
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

  win.loadFile("index.html");

  // Create custom menu
  const menu = Menu.buildFromTemplate([
    {
      label: "File",
      submenu: [
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "close" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://electronjs.org");
          },
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
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
