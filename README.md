# Kisan Mitra 🌱

Hindi-first Smart Farming Assistant student project.

## Features
- Gemini AI farming chat with Hindi/English answer selection
- Crop photo analysis with safety guidance (possible causes, not a confirmed diagnosis)
- Live weather lookup by city using Open-Meteo geocoding and forecast APIs
- Official daily mandi-price lookup through data.gov.in (requires a separate API key)
- Responsive mobile-friendly layout
- API keys kept in backend environment variables

## Requirements
- Node.js 20 or later
- Gemini API key from Google AI Studio
- Optional: data.gov.in API key for official mandi-price search

## Run locally
1. Open a terminal in the repository root.
2. Run `cd backend` and `npm install`.
3. Create `backend/.env` based on `backend/.env.example`.
4. Set `GEMINI_API_KEY` in `backend/.env`. Never commit this file.
5. To enable live mandi search, set `DATA_GOV_IN_API_KEY` using your own key from data.gov.in. Until set, the app will explain that the key is missing.
6. Run `npm start` from the backend folder.
7. Open `http://localhost:3000`.

## API routes
- `POST /api/chat`
- `POST /api/crop-diagnosis`
- `GET /api/weather?city=Mathura`
- `GET /api/mandi?state=Uttar%20Pradesh&district=Mathura&commodity=Wheat`
- `GET /api/health`

Weather is forecast/model data from Open-Meteo, not an official warning service. Mandi prices are daily government records and may be delayed or missing for some markets. The AI photo analysis can be wrong; verify treatment decisions with a local agriculture expert/Krishi Vigyan Kendra. Never commit API keys.
