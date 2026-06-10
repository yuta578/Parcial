// =============================================
//  DATOS
// =============================================
const WORDS = [
  { en: "apple",    es: "manzana"    },
  { en: "dog",      es: "perro"      },
  { en: "cat",      es: "gato"       },
  { en: "house",    es: "casa"       },
  { en: "school",   es: "escuela"    },
  { en: "water",    es: "agua"       },
  { en: "book",     es: "libro"      },
  { en: "teacher",  es: "profesor"   },
  { en: "computer", es: "computador" },
  { en: "music",    es: "música"     },
  { en: "tree",     es: "árbol"      },
  { en: "sun",      es: "sol"        },
  { en: "bird",     es: "pájaro"     },
  { en: "flower",   es: "flor"       },
  { en: "car",      es: "carro"      },
  { en: "phone",    es: "teléfono"   },
  { en: "food",     es: "comida"     },
  { en: "friend",   es: "amigo"      },
  { en: "sky",      es: "cielo"      },
  { en: "love",     es: "amor"       },
];

const COLORS = [
  "#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#c77dff",
  "#ff9f43","#00cec9","#fd79a8","#a29bfe","#55efc4",
  "#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#c77dff",
  "#ff9f43","#00cec9","#fd79a8","#a29bfe","#55efc4",
];

// =============================================
//  ESTADO
// =============================================
let currentWord   = null;
let isSpinning    = false;
let isListening   = false;
let score         = 0;
let correct       = 0;
let errors        = 0;
let currentAngle  = 0;
let history       = [];

// =============================================
//  CANVAS / RULETA
// =============================================
const canvas  = document.getElementById("wheelCanvas");
const ctx     = canvas.getContext("2d");
const SIZE    = 420;
canvas.width  = SIZE;
canvas.height = SIZE;

const cx = SIZE / 2;
const cy = SIZE / 2;
const R  = SIZE / 2 - 6;
const N  = WORDS.length;
const SLICE = (2 * Math.PI) / N;

/** Dibuja la rueda en el ángulo `angle` (radianes) */
function drawWheel(angle) {
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Sombra exterior
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.6)";
  ctx.shadowBlur  = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, R + 4, 0, 2 * Math.PI);
  ctx.fillStyle = "#161b22";
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < N; i++) {
    const startA = angle + i * SLICE;
    const endA   = startA + SLICE;
    const midA   = startA + SLICE / 2;

    // Slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startA, endA);
    ctx.closePath();
    ctx.fillStyle = COLORS[i];
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,.25)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Texto
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(midA);
    ctx.textAlign  = "right";
    ctx.textBaseline = "middle";
    ctx.font       = `bold ${N > 16 ? 11 : 13}px 'Segoe UI', sans-serif`;
    ctx.fillStyle  = "rgba(0,0,0,.75)";
    ctx.fillText(WORDS[i].en, R - 10, 0);
    ctx.restore();
  }

  // Centro
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, 2 * Math.PI);
  ctx.fillStyle = "#0d1117";
  ctx.fill();
  ctx.strokeStyle = "#30363d";
  ctx.lineWidth   = 3;
  ctx.stroke();
}

drawWheel(currentAngle);

// =============================================
//  SPIN LOGIC
// =============================================
const spinBtn = document.getElementById("spinBtn");

spinBtn.addEventListener("click", () => {
  if (isSpinning) return;
  startSpin();
});

function startSpin() {
  isSpinning = true;
  spinBtn.disabled = true;
  document.getElementById("micBtn").disabled = true;
  setFeedback("neutral", "Girando...");
  clearResult();

  // Velocidad angular aleatoria entre 15 y 30 rad
  const extraSpins = (Math.random() * 15 + 15);
  const targetAngle = currentAngle + extraSpins;

  const duration = 4000 + Math.random() * 2000; // 4–6 s
  const start    = performance.now();
  const from     = currentAngle;

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function frame(now) {
    const elapsed = now - start;
    const t       = Math.min(elapsed / duration, 1);
    currentAngle  = from + (targetAngle - from) * easeOut(t);
    drawWheel(currentAngle);

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      currentAngle = targetAngle;
      drawWheel(currentAngle);
      onSpinEnd();
    }
  }

  requestAnimationFrame(frame);
}

function onSpinEnd() {
  // El puntero está en la parte superior (−π/2).
  // Calculamos qué slice quedó bajo él.
  const normalized = ((- currentAngle - Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  const idx        = Math.floor(normalized / SLICE) % N;
  currentWord      = WORDS[idx];

  showResult(currentWord);
  speakWord(currentWord.en);

  isSpinning = false;
  spinBtn.disabled = false;
}

// =============================================
//  RESULTADO
// =============================================
const resultPanel = document.getElementById("resultPanel");

function showResult(word) {
  resultPanel.innerHTML = `
    <div class="word-big">${word.en}</div>
    <div class="word-hint">🇨🇴 ${word.es} &nbsp;|&nbsp; Haz clic en 🎤 para pronunciar</div>
  `;
  document.getElementById("micBtn").disabled = false;
  setFeedback("neutral", "Listo para escucharte");
  highlightChip(word.en);
}

function clearResult() {
  resultPanel.innerHTML = `<div class="word-hint">Girando...</div>`;
  highlightChip(null);
}

// =============================================
//  WORD CHIPS
// =============================================
const wordListEl = document.getElementById("wordList");
WORDS.forEach(w => {
  const chip = document.createElement("span");
  chip.className   = "word-chip";
  chip.textContent = w.en;
  chip.dataset.word = w.en;
  chip.title = w.es;
  chip.addEventListener("click", () => speakWord(w.en));
  wordListEl.appendChild(chip);
});

function highlightChip(word) {
  document.querySelectorAll(".word-chip").forEach(c => {
    c.classList.toggle("active", c.dataset.word === word);
  });
}

// =============================================
//  SPEECH SYNTHESIS
// =============================================
function speakWord(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = "en-US";
  utt.rate   = 0.85;
  utt.pitch  = 1;
  window.speechSynthesis.speak(utt);
}

// =============================================
//  SPEECH RECOGNITION
// =============================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const micBtn  = document.getElementById("micBtn");
let recognition = null;

if (!SpeechRecognition) {
  micBtn.textContent = "❌ Reconocimiento de voz no disponible";
  micBtn.disabled    = true;
} else {
  recognition = new SpeechRecognition();
  recognition.lang       = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    micBtn.classList.add("listening");
    micBtn.textContent = "🔴 Escuchando...";
    setFeedback("neutral", "Di la palabra en voz alta...");
  };

  recognition.onend = () => {
    isListening = false;
    micBtn.classList.remove("listening");
    micBtn.textContent = "🎤 Pronunciar palabra";
  };

  recognition.onerror = (e) => {
    isListening = false;
    micBtn.classList.remove("listening");
    micBtn.textContent = "🎤 Pronunciar palabra";
    if (e.error === "no-speech") {
      setFeedback("neutral", "No se detectó voz. Intenta de nuevo.");
    } else if (e.error === "not-allowed") {
      setFeedback("wrong", "Permiso de micrófono denegado.");
    } else {
      setFeedback("neutral", `Error: ${e.error}`);
    }
  };

  recognition.onresult = (e) => {
    const heard = e.results[0][0].transcript.trim().toLowerCase();
    evaluatePronunciation(heard);
  };

  micBtn.addEventListener("click", () => {
    if (!currentWord) return;
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });
}

// =============================================
//  EVALUACIÓN
// =============================================
function evaluatePronunciation(heard) {
  if (!currentWord) return;
  const expected = currentWord.en.toLowerCase();

  // Acepta si la palabra esperada está contenida en lo que se oyó
  const isCorrect = heard === expected
    || heard.includes(expected)
    || levenshtein(heard, expected) <= 1;

  if (isCorrect) {
    score   += 10;
    correct += 1;
    setFeedback("correct", `✅ ¡Correcto! Dijiste: "${heard}"`);
    speakWord("Correct! Well done!");
  } else {
    errors += 1;
    setFeedback("wrong", `❌ Incorrecto. Dijiste: "${heard}" — se esperaba: "${expected}"`);
    speakWord(currentWord.en); // repite la pronunciación correcta
  }

  updateScore();
  addHistory(currentWord.en, heard, isCorrect);

  // Deshabilitar micrófono hasta el siguiente giro
  micBtn.disabled = true;
  currentWord     = null;
}

// =============================================
//  LEVENSHTEIN (tolerancia)
// =============================================
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({length: m+1}, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

// =============================================
//  UI HELPERS
// =============================================
function setFeedback(type, msg) {
  const el = document.getElementById("feedback");
  el.className = `neutral ${type}`;
  el.textContent = msg;
}

function updateScore() {
  document.getElementById("scoreTotal").textContent = score;
  document.getElementById("scoreOk").textContent   = correct;
  document.getElementById("scoreFail").textContent  = errors;
}

function addHistory(word, heard, ok) {
  history.unshift({ word, heard, ok });
  const list = document.getElementById("historyList");

  if (history.length === 1) list.innerHTML = "";

  const li = document.createElement("li");
  li.innerHTML = `
    <span class="icon">${ok ? "✅" : "❌"}</span>
    <span style="flex:1"><strong>${word}</strong></span>
    <span class="heard">"${heard}"</span>
  `;
  list.prepend(li);

  // Máximo 20 en historial
  while (list.children.length > 20) list.removeChild(list.lastChild);
}