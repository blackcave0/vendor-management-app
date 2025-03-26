# Vendor Management App

## Overview
The **Vendor Management App** is an Electron-based application designed to manage vendors, products, and reports. It provides a user-friendly interface for administrators to handle various aspects of vendor and product management, including adding, editing, and deleting records, as well as generating reports.

## Features
- **Dashboard**: A central hub displaying an overview of the application.
- **Vendor Management**: Manage vendor details through a dedicated interface.
- **Product Management**: Add, edit, delete, and search products with real-time updates.
- **Reports**: View and analyze reports related to vendors and products.
- **Authentication**: Admin login functionality to secure access.
- **Dynamic Content Loading**: Pages are dynamically loaded into the main content area for a seamless user experience.

## File Structure
### HTML Views
- **`views/dashboard.html`**: Contains the layout and structure for the dashboard page.
- **`views/vendors.html`**: Provides the interface for managing vendors.
- **`views/products.html`**: Handles product management, including a modal for adding/editing products.
- **`views/reports.html`**: Displays reports related to vendors and products.
- **`views/items.html`**: Manages items associated with vendors or products.

### JavaScript
- **`renderer.js`**: The main renderer process script responsible for:
  - Handling IPC communication with the main process.
  - Managing dynamic content loading.
  - Initializing and managing page-specific functionality (e.g., products, vendors).
  - Handling localStorage for offline data persistence.

### Styles
- **`styles.css`**: Contains global styles for the application.
- **External Libraries**:
  - Font Awesome for icons.
  - Google Fonts (Poppins) for typography.
  - Tailwind CSS for utility-first styling (used in `products.html`).

## Key Functionalities
### Authentication
- Admin login is secured with a password (`admin123` by default, can be updated in `renderer.js`).
- Login state is stored in `localStorage` to persist sessions.

### Product Management
- Products are stored in `localStorage` and synchronized with the database.
- Features include:
  - Adding new products.
  - Editing existing products.
  - Deleting products.
  - Searching products by name, category, supplier, or description.
  - Real-time updates to the product table and summary.

### Vendor Management
- Vendors can be managed through the `vendors.html` interface.
- Includes options to add, edit, and delete vendor records.

### Reports
- Reports are displayed in `reports.html` and provide insights into vendor and product data.

### Dynamic Content Loading
- The `loadContent` function dynamically loads HTML views into the main content area.
- Ensures smooth navigation without reloading the entire application.

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/vendor-management-app.git
   ```
2. Navigate to the project directory:
   ```bash
   cd vendor-management-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the application:
   ```bash
   npm start
   ```

## Development Notes
- **IPC Communication**: The app uses `ipcRenderer` for communication between the renderer and main processes.
- **LocalStorage**: Temporary storage for products and login state.
- **Error Handling**: Dynamic content loading includes error handling to display user-friendly messages.

## Future Enhancements
- Add role-based access control for multiple user types.
- Implement a database for persistent storage instead of relying on `localStorage`.
- Enhance the reporting module with export options (e.g., CSV, PDF).
- Improve UI/UX with additional styling and animations.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.
