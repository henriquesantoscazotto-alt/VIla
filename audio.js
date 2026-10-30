// ============================================
// ÁUDIO — Sussurro distorcido + Rugido + Final
// ============================================

let audioCtx = null;
let audioSource = null;
let distorter = null;
let lowpassFilter = null;
let masterGain = null;
let reverbNode = null;

let soundEnabled = true;
let audioReady = false;

const bgMusic = document.getElementById('bgMusic');
const soundToggle = document.getElementById('soundToggle');

const BASE_VOLUME = 0.18;

// ============================================
// CONSTRUÇÃO DA CADEIA DE DISTORÇÃO
// ============================================
function buildDistortionChain() {
  if (audioCtx) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  audioSource = audioCtx.createMediaElementSource(bgMusic);

  const waveShaper = audioCtx.createWaveShaper();
  waveShaper.curve = makeDistortionCurve(120);
  waveShaper.oversample = '4x';
  distorter = waveShaper;

  lowpassFilter = audioCtx.createBiquadFilter();
  lowpassFilter.type = 'lowpass';
  lowpassFilter.frequency.value = 800;
  lowpassFilter.Q.value = 4;

  const lfo = audioCtx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.3;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain).connect(lowpassFilter.frequency);
  lfo.start();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = BASE_VOLUME;

  reverbNode = audioCtx.createConvolver();
  reverbNode.buffer = buildReverbImpulse(2.5, 0.4);

  audioSource
    .connect(distorter)
    .connect(lowpassFilter)
    .connect(masterGain)
    .connect(audioCtx.destination);

  masterGain.connect(reverbNode).connect(audioCtx.destination);
}

// ============================================
// CURVA DE DISTORÇÃO
// ============================================
function makeDistortionCurve(amount) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// ============================================
// IMPULSO DE REVERB SINTÉTICO
// ============================================
function buildReverbImpulse(duration, decay) {
  const rate = audioCtx.sampleRate;
  const length = rate * duration;
  const impulse = audioCtx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

// ============================================
// 🦈 RUGIDO SUBMERSO — disparado no erro
// ============================================
function playSubmergedRoar() {
  if (!audioCtx) buildDistortionChain();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const now = audioCtx.currentTime;
  const DURATION = 1.8;

  const roarOut = audioCtx.createGain();
  roarOut.gain.value = 0.0;

  const roarDistort = audioCtx.createWaveShaper();
  roarDistort.curve = makeDistortionCurve(300);
  roarDistort.oversample = '4x';

  const roarFilter = audioCtx.createBiquadFilter();
  roarFilter.type = 'lowpass';
  roarFilter.frequency.value = 350;
  roarFilter.Q.value = 8;

  roarDistort.connect(roarFilter).connect(roarOut);
  roarOut.connect(audioCtx.destination);
  if (reverbNode) roarOut.connect(reverbNode);

  // Camada 1 — Sub-bass sweep
  const sub = audioCtx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(85, now);
  sub.frequency.exponentialRampToValueAtTime(22, now + DURATION);
  const subGain = audioCtx.createGain();
  subGain.gain.setValueAtTime(0.0, now);
  subGain.gain.linearRampToValueAtTime(0.9, now + 0.05);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + DURATION);
  sub.connect(subGain).connect(roarDistort);
  sub.start(now);
  sub.stop(now + DURATION);

  // Camada 2 — Growl
  const growl = audioCtx.createOscillator();
  growl.type = 'sawtooth';
  growl.frequency.setValueAtTime(65, now);
  growl.frequency.exponentialRampToValueAtTime(38, now + DURATION);
  const growlGain = audioCtx.createGain();
  growlGain.gain.setValueAtTime(0.0, now);
  growlGain.gain.linearRampToValueAtTime(0.5, now + 0.1);
  growlGain.gain.exponentialRampToValueAtTime(0.001, now + DURATION);
  growl.connect(growlGain).connect(roarDistort);
  growl.start(now);
  growl.stop(now + DURATION);

  // Camada 3 — Ruído (jato de água/lama)
  const noiseLen = audioCtx.sampleRate * DURATION;
  const noiseBuf = audioCtx.createBuffer(1, noiseLen, audioCtx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;

  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuf;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(1200, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(150, now + DURATION);
  noiseFilter.Q.value = 6;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.0, now);
  noiseGain.gain.linearRampToValueAtTime(0.55, now + 0.08);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + DURATION);

  noise.connect(noiseFilter).connect(noiseGain).connect(roarDistort);
  noise.start(now);
  noise.stop(now + DURATION);

  // Camada 4 — Lamento descendente
  const wail = audioCtx.createOscillator();
  wail.type = 'triangle';
  wail.frequency.setValueAtTime(320, now);
  wail.frequency.exponentialRampToValueAtTime(45, now + DURATION * 0.9);
  const wailGain = audioCtx.createGain();
  wailGain.gain.setValueAtTime(0.0, now);
  wailGain.gain.linearRampToValueAtTime(0.28, now + 0.15);
  wailGain.gain.exponentialRampToValueAtTime(0.001, now + DURATION);
  wail.connect(wailGain).connect(roarFilter);
  wail.start(now);
  wail.stop(now + DURATION);

  // Envelope geral
  roarOut.gain.setValueAtTime(0.0, now);
  roarOut.gain.linearRampToValueAtTime(0.6, now + 0.06);
  roarOut.gain.exponentialRampToValueAtTime(0.001, now + DURATION);

  // Tremor
  const tremorLfo = audioCtx.createOscillator();
  tremorLfo.type = 'sine';
  tremorLfo.frequency.value = 8;
  const tremorGain = audioCtx.createGain();
  tremorGain.gain.value = 80;
  tremorLfo.connect(tremorGain).connect(roarFilter.frequency);
  tremorLfo.start(now);
  tremorLfo.stop(now + DURATION);

  console.log('🦈 Rugido submerso disparado.');
}

// ============================================
// DIAGNÓSTICO
// ============================================
bgMusic.addEventListener('loadeddata', () => {
  audioReady = true;
  console.log('✅ Áudio carregado.');
});
bgMusic.addEventListener('error', () => {
  console.error('❌ Erro ao carregar sussurro.mp3');
});

// ============================================
// INÍCIO NA PRIMEIRA INTERAÇÃO
// ============================================
function startAudioOnFirstInteraction() {
  buildDistortionChain();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  bgMusic.play()
    .then(() => console.log('▶️ Sussurro tocando.'))
    .catch((err) => console.warn('⚠️ Autoplay bloqueado:', err));

  document.removeEventListener('click', startAudioOnFirstInteraction);
  document.removeEventListener('keydown', startAudioOnFirstInteraction);
}
document.addEventListener('click', startAudioOnFirstInteraction);
document.addEventListener('keydown', startAudioOnFirstInteraction);

// ============================================
// BOTÃO DE SOM
// ============================================
soundToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  soundEnabled = !soundEnabled;

  if (soundEnabled) {
    if (!audioCtx) buildDistortionChain();
    audioCtx.resume();
    bgMusic.play().catch(() => {});
    soundToggle.textContent = '♪';
    soundToggle.style.color = '#6a5a45';
  } else {
    bgMusic.pause();
    soundToggle.textContent = '✕';
    soundToggle.style.color = '#2a2015';
  }
});

// ============================================
// AMPLIFICAÇÃO NO ACERTO
// ============================================
function amplifyAudio() {
  if (!audioCtx || !masterGain) return;
  masterGain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 2);
  lowpassFilter.frequency.linearRampToValueAtTime(2000, audioCtx.currentTime + 2);
}

// ============================================
// 🌊 ÁUDIO FINAL — o sussurro afunda de vez
// ============================================
function finaleAudio() {
  if (!audioCtx || !masterGain || !lowpassFilter) return;

  const now = audioCtx.currentTime;

  lowpassFilter.frequency.linearRampToValueAtTime(120, now + 3);
  lowpassFilter.Q.linearRampToValueAtTime(2, now + 3);

  masterGain.gain.linearRampToValueAtTime(0.02, now + 4);

  const bell = audioCtx.createOscillator();
  bell.type = 'sine';
  bell.frequency.setValueAtTime(60, now);
  bell.frequency.exponentialRampToValueAtTime(30, now + 5);

  const bellGain = audioCtx.createGain();
  bellGain.gain.setValueAtTime(0.0, now);
  bellGain.gain.linearRampToValueAtTime(0.4, now + 0.3);
  bellGain.gain.exponentialRampToValueAtTime(0.001, now + 6);

  bell.connect(bellGain).connect(audioCtx.destination);
  bell.start(now);
  bell.stop(now + 6);
}
