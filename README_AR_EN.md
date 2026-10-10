# FactoryTowA — SQL Server + ASP.NET Core API integration

## What is included
- `database/Create_FactoryTowA_DB.sql`: creates `FactoryTowA_DB` and the JSON-document table.
- `backend/FactoryTowA.API`: minimal ASP.NET Core API using Windows Authentication to SQL Server.
- `frontend`: original UI plus `js/api-bridge.js`; app startup waits for initial API hydration, and existing AppStore save methods sync changes to the API.

## Setup (Windows)
1. Install SQL Server (default instance) and .NET 10 SDK.
2. Open SSMS, connect using **Windows Authentication**, open and execute `database/Create_FactoryTowA_DB.sql`.
3. Ensure the Windows account that runs the API has permission to access `FactoryTowA_DB` (for local development, add it as a database user with `db_datareader` and `db_datawriter`; avoid `db_owner` for production). The connection string is in `backend/FactoryTowA.API/appsettings.json`: `Server=localhost;Database=FactoryTowA_DB;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=True;`. If SQL Server uses a named machine instead of localhost, change `Server=...`.
4. Run `RUN_API.bat`. Keep the console open. Test `http://localhost:5080/api/health`; expected JSON has `status: ok` and `database: FactoryTowA_DB`.
5. Open `frontend/index.html` in a browser. If browser file-origin restrictions block API calls, serve the frontend through a local static server (e.g. VS Code Live Server at `http://127.0.0.1:5500`) and add that exact origin to CORS in `Program.cs` if needed.
6. Confirm the green status message says connected. Add a test customer/item, refresh, and verify the data remains. In SSMS, inspect `dbo.ResourceDocuments`.

## Data model note
This first-pass integration stores each existing AppStore collection as a JSON document in SQL Server. It deliberately preserves the frontend's current object shapes (including invoice line items and links between customer/oven/cutter invoices) to reduce risky rewrites under a same-day deadline. It is a persistence bridge, **not yet a normalized relational schema**. Before production, migrate to typed tables with foreign keys, implement server-side authentication/password hashing and per-user authorization, validate business rules server-side, and add backups. The current frontend's login is still client-side; do not expose this app publicly as-is.

## Troubleshooting
- `Cannot open database`: create the database with the SQL script and grant the current Windows account access.
- `Login failed`: SQL Server Windows Authentication/service must be running; use the same Windows account to run the API.
- `Failed to fetch` / amber badge: start the API first; confirm `/api/health`; serve the frontend from localhost and ensure its origin is allowed in CORS.
- Port 5080 in use: change `applicationUrl` in `Properties/launchSettings.json` and `API_BASE` in `frontend/js/api-bridge.js` to the same new port.

## Important
This package was generated from the uploaded frontend and cannot be compiled or tested against your local SQL Server from this environment. Run the health check and CRUD smoke tests on the target Windows machine before handing it over.
