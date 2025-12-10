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

## Deploying to Railway (or similar hosts)

Minimal checklist to host this app on Railway:

- Build & Start scripts: The repo already has `npm run build` and `npm start`. Railway should run `npm run build` as the build command and `npm start` as the start command. `npm start` runs `serve -s dist -l $PORT` to serve the built files.
- Environment variables: Configure `VITE_API_BASE` in Railway to point to your API base if different from the default. Example value: `https://icecreamemultiagent-production.up.railway.app`.
- CORS: Your backend API must allow requests from the deployed frontend origin. If you see CORS errors in the browser, add the deployed site origin (or `*` for testing) to server CORS.
- Static files: `dist/` is ignored by `.gitignore` and created at build-time. Railway will run the build step to produce it.
- DevDependencies: This project uses `serve` as a runtime dependency to make `npm start` work even if devDependencies are not installed on the host.

Recommended Railway setup steps:

1. Push this repository to GitHub (or connect your git provider).
2. Create a new Railway project and link the Git repo.
3. Set build command: `npm run build` and start command: `npm start`.
4. Add environment variable `VITE_API_BASE` (if needed).
5. Deploy and open the provided URL.

If you prefer to host as a static site (Railway Static Deploy): you can configure a static site with the build command `npm run build` and set the publish directory to `dist/`.

If you want I can:

- Add a small express preview server instead of `serve`.
- Wire up `import.meta.env.VITE_API_BASE` usage across the app (already done in `src/lib/api.ts`).
- Add CI (GitHub Actions) to build and verify the production build on push.
