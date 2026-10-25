const form = document.getElementById('questionForm');
const question = document.getElementById('question');
const answer = document.getElementById('answer');

document.querySelectorAll('[data-question]').forEach((button) => {
  button.addEventListener('click', () => {
    question.value = button.dataset.question;
    question.focus();
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const q = question.value.trim();
  if (!q) return;

  let reply = 'अच्छा सवाल है! सही सलाह के लिए फसल का नाम, पौधे की उम्र, लक्षण कब से हैं और आपके क्षेत्र की जानकारी उपयोगी होगी।';
  if (/पीले|पीला|yellow/i.test(q)) {
    reply = 'संभावित कारण: पोषक तत्वों की कमी, ज्यादा या कम पानी, जड़ों की समस्या या कोई रोग। पहले खेत की नमी और पत्तों के लक्षण देखें। केवल इस सवाल से बीमारी पक्की नहीं बताई जा सकती। साफ फोटो और फसल की उम्र से बेहतर मार्गदर्शन मिल सकता है।';
  } else if (/पानी|सिंचाई|irrigat/i.test(q)) {
    reply = 'सिंचाई का सही समय फसल, मिट्टी, मौसम और पौधे की अवस्था पर निर्भर करता है। खेत में पानी जमा न होने दें। फसल और मिट्टी का प्रकार बताने पर सलाह अधिक उपयोगी होगी।';
  } else if (/टमाटर|tomato/i.test(q)) {
    reply = 'टमाटर के लिए पर्याप्त धूप, मिट्टी में उचित नमी और जल निकासी जरूरी हैं। पत्तों पर धब्बे या मुरझाने जैसे लक्षण हों तो साफ फोटो लें। बिना पुष्टि के कीटनाशक या दवा का उपयोग न करें।';
  } else if (/गेहूँ|गेहूं|wheat/i.test(q)) {
    reply = 'गेहूँ की सलाह उसकी बढ़वार की अवस्था, मिट्टी और मौसम पर निर्भर करती है। पत्तों का रंग बदल रहा हो तो पानी, पोषक तत्व और रोग के संकेत जाँचें। लक्षणों की फोटो से आगे जाँच की जा सकती है।';
  }

  answer.hidden = false;
  answer.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = '🌱 Kisan Mitra का डेमो जवाब';
  const body = document.createElement('span');
  body.textContent = reply;
  answer.append(heading, body);
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