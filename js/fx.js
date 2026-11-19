let confettiParticles = [];
let crackerRockets = [];
let crackerSparks = [];
let fxAnimRunning = false;

function firePartyPoppers() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  spawnPopperStream(0, h * 0.88, -Math.PI / 3, 75);
  spawnPopperStream(w, h * 0.88, (-2 * Math.PI) / 3, 75);
}

function spawnPopperStream(originX, originY, baseAngle, count) {
  const colors = ["#d97757", "#e9c46a", "#74c69d", "#f4978e", "#f7f4eb"];
  const shapes = ["rect", "circle", "ribbon"];

  for (let i = 0; i < count; i++) {
    const angle = baseAngle + (Math.random() - 0.5) * 0.68;
    const speed = Math.random() * 15 + 9;
    confettiParticles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.28,
      drag: 0.985,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      rot: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 14,
      life: 160 + Math.random() * 50
    });
  }
  runFxLoop();
}

function fireConfettiBurst(x, y, count = 30) {
  const colors = ["#d97757", "#e9c46a", "#74c69d", "#f4978e", "#f7f4eb"];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 7 + 2.5;
    confettiParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      gravity: 0.2,
      drag: 0.96,
      size: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: i % 2 === 0 ? "circle" : "rect",
      rot: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      life: 85 + Math.random() * 35
    });
  }
  runFxLoop();
}

function launchFirecrackerSalvo(count = 4) {
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const targetX = window.innerWidth * (0.15 + Math.random() * 0.7);
      const targetY = window.innerHeight * (0.14 + Math.random() * 0.34);
      spawnRocketTo(targetX, targetY);
    }, i * 190);
  }
}

function spawnRocketTo(targetX, targetY) {
  const startX = targetX + (Math.random() - 0.5) * 120;
  const startY = window.innerHeight + 10;
  const colors = ["#e9c46a", "#d97757", "#74c69d", "#f7f4eb"];
  const color = colors[Math.floor(Math.random() * colors.length)];

  crackerRockets.push({
    x: startX,
    y: startY,
    targetX,
    targetY,
    vx: (targetX - startX) / 26,
    vy: (targetY - startY) / 26,
    steps: 26,
    color
  });
  runFxLoop();
}

function explodeFirecracker(x, y, sparkCount = 55) {
  playCrackerPopSound();
  const palettes = [
    ["#e9c46a", "#d97757", "#ffffff"],
    ["#d97757", "#f4978e", "#e9c46a"],
    ["#74c69d", "#e9c46a", "#ffffff"]
  ];
  const pal = palettes[Math.floor(Math.random() * palettes.length)];

  for (let i = 0; i < sparkCount; i++) {
    const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.15;
    const speed = Math.random() * 6.5 + 2;
    crackerSparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.09,
      drag: 0.95,
      color: pal[i % pal.length],
      size: Math.random() * 2.8 + 1.6,
      life: 52 + Math.random() * 24,
      maxLife: 76
    });
  }
  runFxLoop();
}

function playCrackerPopSound() {
  if (!window.SITE_CONFIG || !window.SITE_CONFIG.effects || !window.SITE_CONFIG.effects.enableFirecrackerSound) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = window.sharedAudioCtx || new AudioContextClass();
    window.sharedAudioCtx = ctx;

    const bufferSize = ctx.sampleRate * 0.14;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 950;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch (_) {}
}

function runFxLoop() {
  if (fxAnimRunning) return;
  fxAnimRunning = true;

  const canvas = document.getElementById("fx-canvas");
  const ctx = canvas.getContext("2d");

  function step() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    confettiParticles.forEach((p) => {
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;
      p.life--;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 40));
      ctx.fillStyle = p.color;

      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "ribbon") {
        ctx.fillRect(-p.size, -p.size / 4, p.size * 2, p.size / 2.2);
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
      }
      ctx.restore();
    });
    confettiParticles = confettiParticles.filter((p) => p.life > 0 && p.y < canvas.height + 40);

    crackerRockets.forEach((r) => {
      r.x += r.vx;
      r.y += r.vy;
      r.steps--;

      ctx.save();
      ctx.fillStyle = r.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (r.steps <= 0) {
        explodeFirecracker(r.x, r.y, 58);
      }
    });
    crackerRockets = crackerRockets.filter((r) => r.steps > 0);

    crackerSparks.forEach((s) => {
      s.vx *= s.drag;
      s.vy = s.vy * s.drag + s.gravity;
      s.x += s.vx;
      s.y += s.vy;
      s.life--;

      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life / s.maxLife);
      ctx.fillStyle = s.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    crackerSparks = crackerSparks.filter((s) => s.life > 0);

    if (confettiParticles.length > 0 || crackerRockets.length > 0 || crackerSparks.length > 0) {
      requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      fxAnimRunning = false;
    }
  }
  requestAnimationFrame(step);
}
