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
let currentPreviewUrl = null;

photoInput.addEventListener('change', () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    alert('कृपया image file चुनें।');
    photoInput.value = '';
    return;
  }
  if (currentPreviewUrl) URL.revokeObjectURL(currentPreviewUrl);
  currentPreviewUrl = URL.createObjectURL(file);
  previewImage.src = currentPreviewUrl;
  photoName.textContent = 'चुनी गई फोटो: ' + file.name + ' — अभी केवल preview है।';
  photoPreview.hidden = false;
});
