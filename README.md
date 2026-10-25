# Kisan Mitra 🌱

A student project: Smart Farming Assistant with a Hindi-first interface.

## Features
- Farming questions answered using the Gemini API (backend)
- Crop photo analysis using a Gemini vision-capable model; results are possible causes, not a confirmed diagnosis
- Weather and mandi prices are currently demo placeholders

## Requirements
- Node.js 20 or later
- A Gemini API key from Google AI Studio

## Run locally
1. Open a terminal in the repository root.
2. Install backend packages:
   `cd backend`
   `npm install`
3. Create `backend/.env` by copying `backend/.env.example`.
4. Put your key in `backend/.env` as `GEMINI_API_KEY=your_key_here`. Never commit this file.
5. Start the server:
   `npm start`
6. Open `http://localhost:3000`.

The Express server serves the frontend and provides `POST /api/chat` and `POST /api/crop-diagnosis`. Crop photos must be JPG, PNG or WEBP and no larger than 5 MB.

## Safety note
Photo analysis can be wrong and is not a confirmed agricultural diagnosis. Do not spray or apply treatment based only on the AI result. Verify important treatment decisions with a local agriculture expert/Krishi Vigyan Kendra. Weather and mandi values are demo placeholders, not live data.
