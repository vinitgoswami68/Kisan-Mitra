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
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

app.use(express.json({ limit: '20kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, aiConfigured: Boolean(ai) });
});

app.post('/api/chat', async (req, res) => {
  const question = typeof req.body?.question === 'string'
    ? req.body.question.trim()
    : '';

  if (!question) {
    return res.status(400).json({ error: 'कृपया अपना सवाल लिखें।' });
  }
  if (question.length > 2000) {
    return res.status(400).json({ error: 'सवाल 2000 अक्षरों से छोटा रखें।' });
  }
  if (!ai) {
    return res.status(503).json({
      error: 'Gemini API key अभी सेट नहीं है। Backend की .env file में GEMINI_API_KEY सेट करें।'
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: 'आप Kisan Mitra हैं, भारत के किसानों को सरल हिंदी या उपयोगकर्ता की भाषा में सामान्य खेती संबंधी जानकारी देने वाले सहायक। फसल, मिट्टी, सिंचाई, मौसम और कीट/रोग के बारे में सावधानीपूर्वक सामान्य मार्गदर्शन दें। केवल लक्षणों से बीमारी निश्चित घोषित न करें। बिना पर्याप्त जानकारी के कीटनाशक या दवा की मात्रा न बताएं; स्थानीय कृषि विशेषज्ञ या कृषि विज्ञान केंद्र से पुष्टि करने की सलाह दें। उत्तर स्पष्ट और व्यावहारिक रखें।',
        maxOutputTokens: 800
      }
    });

    const answer = response.text?.trim();
    if (!answer) {
      return res.status(502).json({ error: 'AI से खाली जवाब मिला। कृपया दोबारा कोशिश करें।' });
    }
    return res.json({ answer });
  } catch (error) {
    // Log diagnostic details on the backend only; never expose the API key.
    const status = Number(error?.status || error?.code || 0);
    const message = String(error?.message || '');
    console.error('Gemini request failed:', { status, message });

    const normalized = message.toLowerCase();
    if (status === 401 || status === 403 ||
        normalized.includes('api key not valid') ||
        normalized.includes('unauthenticated') ||
        normalized.includes('invalid api key')) {
      return res.status(502).json({
        error: 'Gemini API key स्वीकार नहीं हुई। Google AI Studio से नई/सही key बनाकर backend/.env में GEMINI_API_KEY के रूप में रखें, फिर backend restart करें।'
      });
    }
    if (status === 429 || normalized.includes('quota') ||
        normalized.includes('rate limit') || normalized.includes('resource_exhausted')) {
      return res.status(502).json({
        error: 'Gemini API की usage limit पूरी हो सकती है। Google AI Studio में quota/billing status जाँचें।'
      });
    }
    if (status === 404 || normalized.includes('model not found')) {
      return res.status(502).json({
        error: 'Gemini model उपलब्ध नहीं है। backend/.env में GEMINI_MODEL की setting जाँचें।'
      });
    }
    return res.status(502).json({
      error: 'Gemini से जवाब नहीं मिल पाया। Backend terminal में “Gemini request failed” वाली line में असली कारण है।'
    });
  }
});

// Serve the existing frontend without changing its design.
app.use(express.static(path.resolve(__dirname, '..'), { dotfiles: 'deny' }));

app.listen(PORT, () => {
  console.log(`Kisan Mitra server running on port ${PORT}`);
});
