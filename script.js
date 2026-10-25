const form = document.getElementById('questionForm');
const question = document.getElementById('question');
const answer = document.getElementById('answer');
const submitButton = form.querySelector('button[type="submit"]');
const answerLanguage = document.getElementById('answerLanguage');

document.querySelectorAll('[data-question]').forEach((button) => {
  button.addEventListener('click', () => {
    question.value = button.dataset.question;
    question.focus();
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const q = question.value.trim();
  if (!q) return;
  showMessage(answer, '🌱 Kisan Mitra AI', 'आपके सवाल का जवाब तैयार हो रहा है...');
  submitButton.disabled = true;
  submitButton.textContent = 'जवाब तैयार हो रहा है...';
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, language: answerLanguage.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'जवाब नहीं मिल पाया।');
    showMessage(answer, '🌱 Kisan Mitra AI', data.answer);
  } catch (error) {
    showMessage(answer, 'त्रुटि / Error', error.message || 'Server से संपर्क नहीं हो पाया।');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'जवाब देखें <span>→</span>';
  }
});

const photoInput = document.getElementById('cropPhoto');
const photoPreview = document.getElementById('photoPreview');
const previewImage = document.getElementById('previewImage');
const photoName = document.getElementById('photoName');
const diagnoseButton = document.getElementById('diagnoseButton');
const diagnosisResult = document.getElementById('diagnosisResult');
let selectedPhoto = null;
let currentPreviewUrl = null;

photoInput.addEventListener('change', () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    alert('कृपया JPG, PNG या WEBP फोटो चुनें।'); photoInput.value = ''; return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('फोटो 5 MB से छोटी होनी चाहिए।'); photoInput.value = ''; return;
  }
  selectedPhoto = file;
  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  currentPreviewUrl = URL.createObjectURL(file);
  previewImage.src = currentPreviewUrl;
  photoName.textContent = 'चुनी गई फोटो: ' + file.name;
  photoPreview.hidden = false;
  diagnoseButton.disabled = false;
  diagnosisResult.hidden = true;
});

diagnoseButton.addEventListener('click', async () => {
  if (!selectedPhoto) return;
  showMessage(diagnosisResult, '🌿 AI फसल जाँच', 'फोटो का विश्लेषण हो रहा है...');
  diagnoseButton.disabled = true;
  diagnoseButton.textContent = 'जाँच जारी है...';
  try {
    const base64 = await fileToBase64(selectedPhoto);
    const response = await fetch('/api/crop-diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64, mimeType: selectedPhoto.type, language: answerLanguage.value,
        question: 'Analyze the visible crop symptoms carefully. Describe possible causes, useful follow-up information and safe next steps. Do not claim a definite diagnosis or prescribe pesticide dosage.'
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'फोटो की जाँच नहीं हो पाई।');
    showMessage(diagnosisResult, '🌿 AI फसल जाँच', data.answer);
  } catch (error) {
    showMessage(diagnosisResult, 'त्रुटि / Error', error.message || 'Server से संपर्क नहीं हो पाया।');
  } finally {
    diagnoseButton.disabled = !selectedPhoto;
    diagnoseButton.innerHTML = 'फोटो से जाँचें <span>→</span>';
  }
});

document.getElementById('weatherForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const city = document.getElementById('weatherCity').value.trim();
  const result = document.getElementById('weatherResult');
  result.textContent = 'मौसम खोज रहे हैं...';
  try {
    const response = await fetch('/api/weather?city=' + encodeURIComponent(city));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'मौसम उपलब्ध नहीं है।');
    result.replaceChildren();
    const icon = document.createElement('span'); icon.className = 'weather-emoji'; icon.textContent = weatherIcon(data.weatherCode);
    const details = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = data.location + ': ' + data.description + ', ' + data.temperature + '°C';
    const desc = document.createElement('p'); desc.textContent = 'महसूस तापमान ' + data.apparentTemperature + '°C · नमी ' + data.humidity + '% · हवा ' + data.windSpeed + ' km/h · वर्षा ' + data.precipitation + ' mm';
    const updated = document.createElement('p'); updated.textContent = 'समय: ' + data.time + ' (स्थानीय समय)';
    details.append(title, desc, updated); result.append(icon, details);
  } catch (error) { result.textContent = error.message; }
});

document.getElementById('mandiForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = document.getElementById('mandiResult');
  result.textContent = 'सरकारी मंडी डेटा खोज रहे हैं...';
  const params = new URLSearchParams({
    state: document.getElementById('mandiState').value.trim(),
    district: document.getElementById('mandiDistrict').value.trim(),
    commodity: document.getElementById('mandiCommodity').value.trim()
  });
  try {
    const response = await fetch('/api/mandi?' + params.toString());
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'मंडी भाव उपलब्ध नहीं हैं।');
    result.replaceChildren();
    if (!data.records.length) {
      result.textContent = data.message || 'इस खोज के लिए कोई रिकॉर्ड नहीं मिला। जिला खाली करके फिर कोशिश करें।';
      return;
    }
    const note = document.createElement('p'); note.className = 'muted'; note.textContent = 'स्रोत: data.gov.in · ' + data.records.length + ' रिकॉर्ड'; result.append(note);
    data.records.forEach((record) => {
      const row = document.createElement('article'); row.className = 'mandi-record';
      const name = document.createElement('strong'); name.textContent = [record.market, record.district, record.state].filter(Boolean).join(', ');
      const crop = document.createElement('p'); crop.textContent = [record.commodity, record.variety, record.grade].filter(Boolean).join(' · ');
      const prices = document.createElement('p'); prices.textContent = 'न्यूनतम ₹' + (record.min_price || '—') + ' · अधिकतम ₹' + (record.max_price || '—') + ' · मॉडल ₹' + (record.modal_price || '—') + ' प्रति क्विंटल';
      const date = document.createElement('small'); date.textContent = 'आवक तारीख: ' + (record.arrival_date || 'उपलब्ध नहीं');
      row.append(name, crop, prices, date); result.append(row);
    });
  } catch (error) { result.textContent = error.message; }
});

function showMessage(container, titleText, bodyText) {
  container.hidden = false;
  container.replaceChildren();
  const heading = document.createElement('strong'); heading.textContent = titleText;
  const body = document.createElement('span'); body.textContent = bodyText;
  container.append(heading, body);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => { const result = String(reader.result || ''); resolve(result.slice(result.indexOf(',') + 1)); };
    reader.onerror = () => reject(new Error('फोटो पढ़ी नहीं जा सकी। दूसरी फोटो चुनें।'));
    reader.readAsDataURL(file);
  });
}

function weatherIcon(code) {
  if (code === 0) return '☀️';
  if ([1, 2].includes(code)) return '🌤️';
  if (code === 3) return '☁️';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75, 85, 86].includes(code)) return '❄️';
  if ([95, 96, 99].includes(code)) return '⛈️';
  return '🌦️';
}
