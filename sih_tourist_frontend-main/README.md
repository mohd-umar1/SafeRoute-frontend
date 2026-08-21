# SafeRoute — Production-grade Tourist Safety Frontend

This frontend is wired to the Spring Boot tourist-safety backend supplied with the project.

## Backend features surfaced in the UI

- Tourist registration and email-based login
- Tourist identity/profile view
- Safety ticket creation and QR display
- Public ticket verification
- Ticket validity + permitted-radius checks
- Browser geolocation with one-time and live monitoring modes
- Restricted-zone/geofence checks
- SOS incident creation
- Incident list, filtering and resolution from operations control
- Audit-chain verification
- Audit tamper / restore demonstration controls
- Admin operations dashboard and tourist registry

## Run locally

1. Start the Spring Boot backend on port `8000`.
2. Install frontend dependencies with `npm install`.
3. Run `npm run dev`.
4. Open the Vite URL shown in the terminal.

The frontend uses `/api` by default and Vite proxies that path to `http://localhost:8000`.
For a deployed frontend, copy `.env.example` to `.env` and set `VITE_API_URL` to the API base URL.

## Demo login

The supplied backend seeds a demo tourist when the database is empty:

`john.smith@example.com`

## Important backend correction

The supplied geofence controller referenced `GEO_FENCE_VIOLATION`, while the `IncidentType` enum defines `GEOFENCE_VIOLATION`. The packaged backend patch changes the controller to use the existing enum constant so the restricted-zone endpoint can complete successfully.

## Note on authentication

The supplied backend currently authenticates tourists by email lookup and does not expose an admin authentication endpoint. The frontend therefore does not pretend to provide backend-enforced admin authorization; it focuses on the production-grade operations experience that the available API supports.


## Backend compatibility
This final frontend is designed to run against the original SafeRoute backend without backend source changes. Restricted zones are stored in browser localStorage. When a monitored tourist enters a configured zone, the frontend uses the existing `/api/incidents/create` and `/api/tickets/create` endpoints; those existing backend services create the incident/ticket audit blocks.
