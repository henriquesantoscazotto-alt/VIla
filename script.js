// ============================================
// SISTEMA DE SENHA — Tubarão
// ============================================

const input   = document.getElementById('codeInput');
const message = document.getElementById('message');
const granted = document.getElementById('granted');
const finale  = document.getElementById('finale');

// ⚠️ CONFIGURE AQUI
const VALID_ANSWERS = ['tubarao'];   // aceita "Tubarão", "tubarão", "TUBARAO"...

// Texto de fundo (quase invisível) — fala do mar podre
const HIDDEN_TEXT = "Sou um ato desesperado de Deus, nasci de um fraco homem para parar as mãos de feiticeiros, nasci das lagrimas para apresentar dor, sou um ato desesperado de Deus. Uma criança, na labareda chamuscada, será o unico sobrevivente de chorosa tragédia";

function fillBackgroundText() {
  const bgEl = document.getElementById('bgText');
  if (!bgEl) return;
  let content = '';
  for (let i = 0; i < 15; i++) content += HIDDEN_TEXT + ' ';
  bgEl.textContent = content;
}
fillBackgroundText();

// ============================================
// NORMALIZAÇÃO
// ============================================
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================
// COOLDOWN DO RUGIDO (evita spam)
// ============================================
let lastRoarTime = 0;
const ROAR_COOLDOWN = 1500;

function triggerRoar() {
  const now = Date.now();
  if (now - lastRoarTime < ROAR_COOLDOWN) return;
  lastRoarTime = now;
  if (typeof playSubmergedRoar === 'function') playSubmergedRoar();
}

// ============================================
// TENTATIVA DE ACESSO
// ============================================
function tryAccess() {
  const value = normalize(input.value);

  if (VALID_ANSWERS.includes(value)) {
    // Sucesso — amplifica o áudio
    if (typeof amplifyAudio === 'function') amplifyAudio();

    // Mostra "Acesso Concedido"
    granted.classList.add('active');

    // Depois de 1.5s, revela a data final
    setTimeout(() => {
      granted.classList.remove('active');
      finale.classList.add('active');

      // 🌊 Áudio afunda de vez
      if (typeof finaleAudio === 'function') finaleAudio();
    }, 1500);

  } else {
    // Erro — rugido submerso + flash
    triggerRoar();

    document.body.classList.add('error-flash');
    setTimeout(() => document.body.classList.remove('error-flash'), 600);

    input.classList.add('error');
    message.classList.add('show');

    setTimeout(() => {
      input.classList.remove('error');
      message.classList.remove('show');
    }, 2000);
  }
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    tryAccess();
  }
});
