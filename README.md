# Ice Cream Admin Panel

A React admin UI for managing categories, flavors, items, mappings, and orders against your agent system API.

## Base URL
Uses `https://icecreamemultiagent-production.up.railway.app` as the API base.

## Features
- **Items**: Admin view lists all ice cream items with stock counts (useful for stock management). Creation and deletion are disabled in this admin panel; you can adjust stock levels.
- **Orders**: List orders with customer name, status, total, items count, created date. Update status to "pending" or "done".

## Run Locally (Windows PowerShell)
```powershell
# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

Open the printed URL (usually http://localhost:5173) in your browser.

## Static Lists
- Categories: Cone, Cup, Sundae, Stick
- Flavors: Vanilla, Chocolate, Strawberry, Mint

## API Endpoints Used
- `GET /menu/items` - Public menu (only available items)
- `GET /menu/items/all` - Admin menu with stock counts (used by this UI)
- `PUT /menu/items/{id}/stock` - Adjust stock using JSON body `{ "delta": 5 }` or `{ "delta": -2 }`
- `GET /orders` - List orders
- `PUT /orders/{id}/status` - Update status to "pending" or "done"