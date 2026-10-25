const form = document.getElementById('questionForm');
const question = document.getElementById('question');
const answer = document.getElementById('answer');
const submitButton = form.querySelector('button[type="submit"]');

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

  answer.hidden = false;
  answer.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = '🌱 Kisan Mitra AI';
  const body = document.createElement('span');
  body.textContent = 'आपके सवाल का जवाब तैयार हो रहा है...';
  answer.append(heading, body);

  submitButton.disabled = true;
  submitButton.textContent = 'जवाब तैयार हो रहा है...';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'जवाब नहीं मिल पाया।');
    body.textContent = data.answer;
  } catch (error) {
    body.textContent = error.message || 'Server से संपर्क नहीं हो पाया। Backend चालू है या नहीं, जाँचें।';
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
    alert('कृपया JPG, PNG या WEBP फोटो चुनें।');
    photoInput.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('फोटो 5 MB से छोटी होनी चाहिए।');
    photoInput.value = '';
    return;
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
  diagnosisResult.hidden = false;
  diagnosisResult.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = '🌿 AI फसल जाँच';
  const body = document.createElement('span');
  body.textContent = 'फोटो का विश्लेषण हो रहा है...';
  diagnosisResult.append(heading, body);
  diagnoseButton.disabled = true;
  diagnoseButton.textContent = 'जाँच जारी है...';

  try {
    const base64 = await fileToBase64(selectedPhoto);
    const response = await fetch('/api/crop-diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        mimeType: selectedPhoto.type,
        question: 'इस फसल की फोटो में दिखाई देने वाले लक्षणों का सावधानी से विश्लेषण करें। संभावित कारण, कौन-सी अतिरिक्त जानकारी चाहिए, और सुरक्षित अगले कदम सरल हिंदी में बताएं। यदि फोटो से पहचान संभव नहीं है तो स्पष्ट कहें। बीमारी को निश्चित न बताएं और बिना पुष्टि के कीटनाशक की मात्रा न बताएं।'
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'फोटो की जाँच नहीं हो पाई।');
    body.textContent = data.answer;
  } catch (error) {
    body.textContent = error.message || 'Server से संपर्क नहीं हो पाया। Backend चालू है या नहीं, जाँचें।';
  } finally {
    diagnoseButton.disabled = !selectedPhoto;
    diagnoseButton.innerHTML = 'फोटो से जाँचें <span>→</span>';
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('फोटो पढ़ी नहीं जा सकी। कृपया दूसरी फोटो चुनें।'));
    reader.readAsDataURL(file);
  });
}
