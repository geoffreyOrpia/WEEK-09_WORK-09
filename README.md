# Orpia Home — Week 09

Expo SDK 57 mobile/web frontend in **plain JavaScript and JSX**, with an Express API and **local MongoDB**. Components, event handlers, API controllers, validation, and database queries use separate arrow functions with `const`/`let`.

React Native uses components, state, and refs for its interface. Browser DOM selectors such as `querySelector`/`querySelectorAll` are not applicable to native Android/iOS screens.

## Run on this computer

Use **Node.js 22.13 or newer** and start your installed MongoDB service.

```powershell
cd C:\week_09_work_09
npm install
npm run server:install
# server/.env has already been configured for the local database.
# If setting up a fresh checkout:
# Copy-Item server/.env.example server/.env
npm run server
```

In another terminal:

```powershell
cd C:\week_09_work_09
npm run web
```

The API listens on `http://127.0.0.1:4000`. The frontend uses that address by default. Set `EXPO_PUBLIC_API_URL` in `.env.local` to change it, then restart Expo. Keep the MongoDB connection string in `server/.env`, never in the frontend.

Default backend settings:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=orpia_week09
HOST=127.0.0.1
PORT=4000
CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
API_TOKEN=
```

The database initializes automatically when the backend starts. It creates:

- `devices`: device registration and on/off or locked/unlocked status.
- `sensorReadings`: timestamped readings, with the latest reading returned to the app.
- `preferences`: home name, dark appearance, automatic refresh, and temperature unit.
- `counters`: atomic numeric device ids, including simultaneous registrations.

There is no sample-data fallback. A fresh database starts with no devices or readings. Register devices in the app. Send readings to `POST /sensors` using your sensor gateway; a missing reading is shown as an empty state with a clear message. Preferences and devices survive frontend/backend restarts. Recent activity remains session-only.

This backend stores device state. Physical device pairing, MQTT, and hardware command execution still require your hardware gateway integration. The connection indicator confirms the API/database is reachable; it does not confirm a physical gateway connection. New device records are enabled for database controls, not hardware discovery.

## Phones and Android emulator

On Android emulator, use `EXPO_PUBLIC_API_URL=http://10.0.2.2:4000`. On a physical phone, use your computer's reachable LAN address. `127.0.0.1` on a phone points to the phone itself.

For access from another device, set `HOST=0.0.0.0` and a strong `API_TOKEN` in `server/.env`, then restart the backend. The backend refuses network exposure without a token. Enter that token in Settings → Connection → Access token → Connect with token. The token remains in memory for the current app session. Use trusted development networks; use HTTPS and proper user authentication before public deployment. This is a single-home API; it does not implement user accounts or tenant separation.

## API

Responses are direct JSON values, without a `data` envelope. Errors return `{ "message": "..." }`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/gateway` | Check API/database connection |
| GET | `/devices` | List devices |
| POST | `/devices` | Register `{ name, room, type }` |
| PATCH | `/devices/:id` | Save `{ status: true/false }` |
| DELETE | `/devices/:id` | Delete record; returns 204 |
| GET | `/sensors` | Latest reading; 404 if none exist |
| POST | `/sensors` | Save `{ temperature, humidity, lightLevel, updatedAt? }` |
| GET | `/preferences` | Load home preferences |
| PATCH | `/preferences` | Save selected preference fields |

Device types: `light`, `fan`, `lock`, `outlet`. Temperature is Celsius, humidity is 0–100 percent, and light level is nonnegative lux. `updatedAt` defaults to server time; timestamps are normalized to ISO UTC. `status: true` means on for power devices and locked for locks.

Example reading (development data, not a live measurement):

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:4000/sensors -ContentType application/json -Body '{"temperature":26.4,"humidity":62,"lightLevel":680}'
```

If `API_TOKEN` is set, send `Authorization: Bearer <token>` with every API request. Web origins must be listed in `CORS_ORIGINS`. Unsupported fields, invalid ids, invalid readings, and offline-device updates are rejected. Database credentials and internal database errors are not returned to clients.

## Project layout

```text
App.jsx                          frontend providers and theme
index.js                         Expo Router entry
src/app/*.jsx                    route files
src/navigation/screens/*.jsx     screen components and separate event handlers
src/context/IoTContext.jsx       state, refresh, commands, preference persistence
src/services/IoTService.js       separate API request functions
src/components/UI.jsx           shared UI components
src/models/IoTModels.js          runtime device labels and icons
server/src/database.js          MongoDB connection and initialization
server/src/repository.js        separate MongoDB query functions
server/src/validation.js        input validation functions
server/src/controllers.js       separate API handler functions
server/src/app.js               routes, CORS, token checks, error handling
server/src/index.js             startup/shutdown
```

## Validate

```powershell
npm run check
npm run lint
npm test
npm run test:server
npm run test:integration
npm run export
```

`typecheck` is retained as an alias for the JavaScript syntax/source check; it is not TypeScript type checking. ESLint enforces arrow callbacks, function expressions, `const`/`let`, and no `var`. No `.ts` or `.tsx` application source remains. Dependency packages may contain their own TypeScript declarations.

Integration tests use your local MongoDB and a freshly generated test database, verify CRUD and persistence across an actual API-process restart, and delete only that isolated test database. Native bundles do not replace physical Android/iOS testing.

References: [MongoDB Node.js driver](https://www.mongodb.com/docs/drivers/node/current/get-started/), [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Expo Router](https://docs.expo.dev/router/installation/).
