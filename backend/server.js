import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_req, res) => res.json({
  ok: true, aiConfigured: Boolean(ai), weatherConfigured: true,
  mandiConfigured: Boolean(process.env.DATA_GOV_IN_API_KEY)
}));

app.post('/api/chat', async (req, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  const language = req.body?.language === 'en' ? 'English' : 'simple Hindi';
  if (!question) return res.status(400).json({ error: 'कृपया अपना सवाल लिखें।' });
  if (question.length > 2000) return res.status(400).json({ error: 'सवाल 2000 अक्षरों से छोटा रखें।' });
  if (!ai) return res.status(503).json({ error: 'Gemini API key अभी सेट नहीं है। backend/.env में GEMINI_API_KEY सेट करें।' });
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: question,
      config: {
        systemInstruction: `You are Kisan Mitra, a careful farming assistant for Indian farmers. Answer in ${language}. Give clear practical general guidance on crops, soil, irrigation and pests. Never claim certainty from limited symptoms. Do not give pesticide dosage without sufficient context; recommend a local agriculture expert or Krishi Vigyan Kendra for important treatment decisions.`,
        maxOutputTokens: 800
      }
    });
    const answer = response.text?.trim();
    if (!answer) return res.status(502).json({ error: 'AI से खाली जवाब मिला। कृपया दोबारा कोशिश करें।' });
    return res.json({ answer });
  } catch (error) { return handleGeminiError(error, res); }
});

app.post('/api/crop-diagnosis', async (req, res) => {
  const image = typeof req.body?.image === 'string' ? req.body.image : '';
  const mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType : '';
  const language = req.body?.language === 'en' ? 'English' : 'simple Hindi';
  const question = typeof req.body?.question === 'string' ? req.body.question : '';
  if (!ai) return res.status(503).json({ error: 'Gemini API key अभी सेट नहीं है। backend/.env में GEMINI_API_KEY सेट करें।' });
  if (!image || image.length > 7 * 1024 * 1024) return res.status(400).json({ error: 'कृपया 5 MB से छोटी फसल की फोटो चुनें।' });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) return res.status(400).json({ error: 'केवल JPG, PNG या WEBP फोटो स्वीकार हैं।' });
  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: question || 'Analyze this crop carefully.' }, { inlineData: { mimeType, data: image } }] }],
      config: {
        systemInstruction: `You are a cautious agricultural assistant. Answer in ${language}. Describe visible crop symptoms and possible causes only; do not claim a definite diagnosis. If the image is unclear, say so and ask for a better photo or crop details. Never prescribe pesticide dosage without confirmation. Suggest safe next steps and a local agriculture expert/KVK for serious problems.`,
        maxOutputTokens: 900
      }
    });
    const answer = response.text?.trim();
    if (!answer) return res.status(502).json({ error: 'AI से खाली जवाब मिला। दूसरी साफ फोटो के साथ कोशिश करें।' });
    return res.json({ answer });
  } catch (error) { return handleGeminiError(error, res); }
});

app.get('/api/weather', async (req, res) => {
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
  if (!city || city.length > 80) return res.status(400).json({ error: 'कृपया शहर का सही नाम लिखें।' });

  try {
    // Mathura fallback avoids a separate geocoding request when that service is slow.
    let place = null;
    if (/^mathura$/i.test(city)) {
      place = { name: 'Mathura', admin1: 'Uttar Pradesh', country: 'India', latitude: 27.4924, longitude: 77.6737 };
    } else {
      const geoUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
      geoUrl.search = new URLSearchParams({ name: city, count: '1', language: 'en', format: 'json' }).toString();
      const geoResponse = await fetch(geoUrl, { signal: AbortSignal.timeout(20000) });
      if (!geoResponse.ok) throw new Error(`Weather location service returned HTTP ${geoResponse.status}`);
      const geo = await geoResponse.json();
      place = geo.results?.[0];
      if (!place) return res.status(404).json({ error: 'शहर नहीं मिला। कृपया अंग्रेज़ी में शहर का नाम लिखें।' });
    }

    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.search = new URLSearchParams({
      latitude: String(place.latitude), longitude: String(place.longitude),
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
      timezone: 'auto', forecast_days: '1'
    }).toString();

    const weatherResponse = await fetch(weatherUrl, { signal: AbortSignal.timeout(25000) });
    if (!weatherResponse.ok) throw new Error(`Weather forecast service returned HTTP ${weatherResponse.status}`);
    const weather = await weatherResponse.json();
    const current = weather.current;
    if (!current) throw new Error('Weather response did not contain current conditions');

    return res.json({
      location: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
      temperature: current.temperature_2m, apparentTemperature: current.apparent_temperature,
      humidity: current.relative_humidity_2m, precipitation: current.precipitation,
      windSpeed: current.wind_speed_10m, weatherCode: current.weather_code, time: current.time
    });
  } catch (error) {
    console.error('Weather request failed:', String(error?.message || error));
    return res.status(502).json({ error: 'मौसम सेवा से समय पर जवाब नहीं मिला। इंटरनेट जाँचकर दोबारा कोशिश करें।' });
  }
});

app.get('/api/mandi', async (req, res) => {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'लाइव मंडी भाव चालू करने के लिए backend/.env में DATA_GOV_IN_API_KEY जोड़ना होगा। Gemini API key से यह अलग सरकारी API key है।' });
  const state = safeQuery(req.query.state, 80);
  const district = safeQuery(req.query.district, 80);
  const commodity = safeQuery(req.query.commodity, 80);
  if (!state || !commodity) return res.status(400).json({ error: 'राज्य और फसल का नाम जरूरी है।' });
  try {
    // Do not filter district at the API: exact district filters can hide valid results.
    const url = new URL('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070');
    const requestMandiData = async (params) => {
      const requestUrl = new URL(url);
      requestUrl.search = params.toString();
      let response;
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await fetch(requestUrl, { signal: AbortSignal.timeout(20000) });
          break;
        } catch (error) {
          lastError = error;
          if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 700));
        }
      }
      if (!response) {
        const cause = lastError?.cause;
        console.error('Mandi connection diagnostics:', {
          name: lastError?.name || '', message: lastError?.message || '',
          causeCode: cause?.code || '', causeMessage: cause?.message || ''
        });
        throw new Error(`Could not connect to data.gov.in after 3 attempts (${cause?.code || lastError?.message || 'network error'})`);
      }
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`data.gov.in returned HTTP ${response.status}: ${body.slice(0, 200)}`);
      }
      return response.json();
    };

    const params = new URLSearchParams({
      'api-key': apiKey, format: 'json', limit: '100',
      'filters[state.keyword]': state, 'filters[commodity]': commodity
    });
    let data = await requestMandiData(params);

    // Some resource responses can be strict about commodity spelling/capitalization.
    // If exact filtering returns nothing, fetch recent state records and match locally.
    if (!(data.records || []).length) {
      const wantedCommodity = commodity.toLocaleLowerCase().trim();
      const fallbackRecords = [];
      let fallbackData = {};
      // Use 100-record pages for compatibility with the resource API's page-size limits.
      for (let offset = 0; offset < 1000; offset += 100) {
        const fallbackParams = new URLSearchParams({
          'api-key': apiKey, format: 'json', limit: '100', offset: String(offset),
          'filters[state.keyword]': state
        });
        fallbackData = await requestMandiData(fallbackParams);
        const pageRecords = fallbackData.records || [];
        fallbackRecords.push(...pageRecords.filter((record) =>
          String(record.commodity || '').toLocaleLowerCase().trim().includes(wantedCommodity)
        ));
        if (pageRecords.length < 100 || fallbackRecords.length) break;
      }
      data = { ...fallbackData, records: fallbackRecords };
    }

    const allRecords = (data.records || []).map((r) => ({
      state: r.state || '', district: r.district || '', market: r.market || '',
      commodity: r.commodity || '', variety: r.variety || '', grade: r.grade || '',
      arrival_date: r.arrival_date || '', min_price: r.min_price || '',
      max_price: r.max_price || '', modal_price: r.modal_price || ''
    }));
    const normalizedDistrict = district.toLocaleLowerCase().trim();
    const districtRecords = normalizedDistrict
      ? allRecords.filter((r) => r.district.toLocaleLowerCase().trim() === normalizedDistrict)
      : allRecords;
    const records = districtRecords.length ? districtRecords : allRecords;
    const message = records.length === 0
      ? 'इस फसल के लिए अभी सरकारी रिकॉर्ड नहीं मिला। दूसरी फसल चुनें या बाद में कोशिश करें।'
      : (normalizedDistrict && districtRecords.length === 0
          ? `${district} जिले का रिकॉर्ड नहीं मिला; नीचे उत्तर प्रदेश की इसी फसल के उपलब्ध मंडी रिकॉर्ड दिखाए गए हैं।`
          : '');
    return res.json({ records, message });
  } catch (error) {
    console.error('Mandi request failed:', String(error?.message || error));
    return res.status(502).json({ error: 'सरकारी मंडी डेटा से कनेक्शन नहीं हो पाया। इंटरनेट/API key जाँचें; असली कारण backend terminal में दर्ज है।' });
  }
});

function safeQuery(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function handleGeminiError(error, res) {
  const status = Number(error?.status || error?.code || 0);
  const message = String(error?.message || '');
  console.error('Gemini request failed:', { status, message });
  const normalized = message.toLowerCase();
  if (status === 401 || status === 403 || normalized.includes('api key not valid') || normalized.includes('unauthenticated') || normalized.includes('invalid api key')) {
    return res.status(502).json({ error: 'Gemini API key स्वीकार नहीं हुई। backend/.env में सही key जाँचें।' });
  }
  if (status === 429 || normalized.includes('quota') || normalized.includes('rate limit') || normalized.includes('resource_exhausted')) {
    return res.status(502).json({ error: 'Gemini API की usage limit पूरी हो सकती है। Google AI Studio में quota जाँचें।' });
  }
  if (status === 404 || normalized.includes('model not found')) {
    return res.status(502).json({ error: 'Gemini model उपलब्ध नहीं है। backend/.env में GEMINI_MODEL जाँचें।' });
  }
  return res.status(502).json({ error: 'Gemini से जवाब नहीं मिल पाया। Backend terminal में असली कारण देखें।' });
}

// Serve the frontend and API from the same Render web service. The public URL is the backend origin too.
app.use(express.static(path.resolve(__dirname, '..'), { dotfiles: 'deny' }));
app.listen(PORT, () => console.log(`Kisan Mitra server running on port ${PORT}`));
