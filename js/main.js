let isPlaying = false;
let synthInterval = null;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const cfg = await loadSiteConfig();
    window.SITE_CONFIG = cfg;
    applyConfig(cfg);
    initRoamingCutouts(cfg);
    setupInteractions(cfg);
    setupScrollObservers();
  } catch (err) {
    console.error("Failed to load config.json:", err);
    document.getElementById("vault-subtitle").textContent =
      "Error loading config.json. Please host via GitHub Pages or a local server.";
  }
});

function applyConfig(cfg) {
  document.title = cfg.meta.pageTitle;
  document.documentElement.style.setProperty("--primary", cfg.meta.primaryColor);
  document.documentElement.style.setProperty("--secondary", cfg.meta.secondaryColor);
  document.documentElement.style.setProperty("--accent", cfg.meta.accentColor);
  document.documentElement.style.setProperty("--surface", cfg.meta.surfaceColor);
  document.documentElement.style.setProperty("--bg", cfg.meta.backgroundColor);

  const wallEl = document.getElementById("wall-backdrop");
  wallEl.className = "wall-backdrop";
  if (cfg.meta.wallStyle === "terracotta-brick") wallEl.classList.add("style-terracotta-brick");
  if (cfg.meta.wallStyle === "botanical-slate") wallEl.classList.add("style-botanical-slate");

  document.getElementById("vault-badge").textContent = cfg.vault.badgeText;
  document.getElementById("vault-title").textContent = cfg.vault.title;
  document.getElementById("vault-subtitle").textContent = cfg.vault.subtitle;
  document.getElementById("passcode-input").placeholder = cfg.vault.inputPlaceholder;
  document.getElementById("unlock-btn").textContent = cfg.vault.unlockButtonText;
  document.getElementById("hint-toggle").textContent = cfg.vault.hintButtonText;
  document.getElementById("vault-hint").textContent = cfg.vault.hintText;

  document.getElementById("song-title").textContent = cfg.music.songTitle;
  document.getElementById("song-artist").textContent = cfg.music.artistName;
  document.getElementById("music-toggle-btn").textContent = cfg.music.pauseButtonText;
  document.getElementById("bg-audio").src = cfg.music.audioFile;

  document.getElementById("hero-tag").textContent = cfg.hero.topTag;
  document.getElementById("hero-headline").textContent = cfg.hero.headline;
  document.getElementById("hero-subheadline").textContent = cfg.hero.subheadline;
  document.getElementById("hero-popper-btn").textContent = cfg.hero.popperButtonText;
  document.getElementById("hero-cracker-btn").textContent = cfg.hero.firecrackerButtonText;
  document.getElementById("scroll-cue").textContent = cfg.hero.scrollCueText;

  const counterSec = document.getElementById("counter-section");
  if (cfg.liveCounter && cfg.liveCounter.enabled) {
    document.getElementById("counter-title").textContent = cfg.liveCounter.sectionTitle;
    document.getElementById("counter-subtitle").textContent = cfg.liveCounter.sectionSubtitle;
    document.getElementById("lbl-days").textContent = cfg.liveCounter.labels.days;
    document.getElementById("lbl-hours").textContent = cfg.liveCounter.labels.hours;
    document.getElementById("lbl-mins").textContent = cfg.liveCounter.labels.minutes;
    document.getElementById("lbl-secs").textContent = cfg.liveCounter.labels.seconds;
    document.getElementById("counter-caption").textContent = cfg.liveCounter.bottomCaption;
    startLiveCounter(cfg.liveCounter.birthDateISO);
  } else {
    counterSec.classList.add("hidden");
  }

  document.getElementById("cake-title").textContent = cfg.cake.sectionTitle;
  document.getElementById("cake-instruction").textContent = cfg.cake.instructionText;
  document.getElementById("wish-title").textContent = cfg.cake.wishGrantedTitle;
  document.getElementById("wish-message").textContent = cfg.cake.wishGrantedMessage;
  document.getElementById("relight-btn").textContent = cfg.cake.relightButtonText;

  // 6 Photos (Auto-Resize Frame + Stick to Wall on Scroll)
  document.getElementById("gallery-title").textContent = cfg.wallPhotos.sectionTitle;
  document.getElementById("gallery-subtitle").textContent = cfg.wallPhotos.sectionSubtitle;

  const stream = document.getElementById("wall-photo-stream");
  const stuckLayer = document.getElementById("stuck-wall-layer");
  stream.innerHTML = "";
  stuckLayer.innerHTML = "";

  cfg.wallPhotos.photos.forEach((photo, idx) => {
    const tilt = idx % 2 === 0 ? -1.6 : 1.6;

    const stage = document.createElement("div");
    stage.className = "wall-photo-stage scroll-pop";
    stage.dataset.photoIndex = String(idx);

    const frame = document.createElement("div");
    frame.className = "auto-frame" + (photo.isTransparentPng ? " png-mode" : "");
    frame.style.transform = `rotate(${tilt}deg)`;

    const pin = document.createElement("div");
    pin.className = "frame-pushpin";

    const era = document.createElement("span");
    era.className = "era-pill";
    era.textContent = photo.eraBadge || `0${idx + 1}`;

    const img = document.createElement("img");
    img.src = photo.image;
    img.alt = photo.caption;
    img.onerror = () => {
      img.remove();
      const fb = document.createElement("div");
      fb.className = "auto-fallback-box";
      fb.style.background = photo.fallbackColor || "#d97757";
      fb.innerHTML = `<span>${photo.emoji || "📸"}</span><span style="font-size:0.8rem;margin-top:0.4rem;font-weight:700;">${escapeHtml(photo.image)}</span>`;
      frame.insertBefore(fb, cap);
    };

    const cap = document.createElement("div");
    cap.className = "frame-caption";
    cap.textContent = photo.caption;

    const snip = document.createElement("p");
    snip.className = "frame-story-snippet";
    snip.textContent = photo.story || "";

    frame.append(pin, era, img, cap, snip);
    frame.addEventListener("click", () => openPhotoModal(photo));
    stage.appendChild(frame);
    stream.appendChild(stage);

    const pinned = document.createElement("div");
    pinned.className = "wall-pinned-photo" + (photo.isTransparentPng ? " is-png" : "");
    pinned.id = `wall-pin-${idx}`;

    const pinCoords = photo.wallPin || {
      xPercent: idx % 2 === 0 ? 5 : 75,
      yPercent: 12 + idx * 13,
      rotateDeg: idx % 2 === 0 ? -6 : 6
    };
    pinned.style.left = pinCoords.xPercent + "%";
    pinned.style.top = pinCoords.yPercent + "%";
    pinned.style.width = window.innerWidth < 640 ? "94px" : "142px";
    pinned.dataset.targetRotate = String(pinCoords.rotateDeg);

    const bgPinDot = document.createElement("div");
    bgPinDot.className = "wall-pin-dot";

    const bgImg = document.createElement("img");
    bgImg.src = photo.image;
    bgImg.alt = photo.caption;
    bgImg.onerror = () => {
      bgImg.remove();
      const miniFb = document.createElement("div");
      miniFb.style.background = photo.fallbackColor || "#d97757";
      miniFb.style.height = "82px";
      miniFb.style.borderRadius = "3px";
      miniFb.style.display = "flex";
      miniFb.style.alignItems = "center";
      miniFb.style.justifyContent = "center";
      miniFb.style.fontSize = "1.9rem";
      miniFb.textContent = photo.emoji || "📸";
      pinned.appendChild(miniFb);
    };

    pinned.append(bgPinDot, bgImg);
    stuckLayer.appendChild(pinned);
  });

  const promiseCard = document.getElementById("promise-card");
  if (cfg.wallPhotos.futurePromise && cfg.wallPhotos.futurePromise.enabled) {
    document.getElementById("promise-title").textContent = cfg.wallPhotos.futurePromise.title;
    document.getElementById("promise-text").textContent = cfg.wallPhotos.futurePromise.text;
  } else {
    promiseCard.classList.add("hidden");
  }

  document.getElementById("reasons-title").textContent = cfg.reasons.sectionTitle;
  document.getElementById("reasons-subtitle").textContent = cfg.reasons.sectionSubtitle;
  const flipGrid = document.getElementById("flip-grid");
  flipGrid.innerHTML = "";
  cfg.reasons.cards.forEach((c) => {
    const item = document.createElement("div");
    item.className = "flip-card";
    item.innerHTML = `
      <div class="flip-inner">
        <div class="flip-front">
          <span class="flip-num">${escapeHtml(c.frontNumber)}</span>
          <h3>${escapeHtml(c.frontTitle)}</h3>
        </div>
        <div class="flip-back">
          <p>${escapeHtml(c.backText)}</p>
        </div>
      </div>
    `;
    item.addEventListener("click", () => {
      item.classList.toggle("flipped");
      if (item.classList.contains("flipped")) {
        const rect = item.getBoundingClientRect();
        fireConfettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 26);
      }
    });
    flipGrid.appendChild(item);
  });

  document.getElementById("envelopes-title").textContent = cfg.envelopes.sectionTitle;
  document.getElementById("envelopes-subtitle").textContent = cfg.envelopes.sectionSubtitle;
  document.getElementById("modal-close-btn").textContent = cfg.envelopes.closeModalButtonText;
  const envGrid = document.getElementById("envelopes-grid");
  envGrid.innerHTML = "";
  cfg.envelopes.items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "envelope-card";
    card.innerHTML = `
      <div class="wax-seal">💌</div>
      <div class="envelope-label">${escapeHtml(item.label)}</div>
    `;
    card.addEventListener("click", () => openEnvelopeModal(item));
    envGrid.appendChild(card);
  });

  document.getElementById("letter-title").textContent = cfg.letter.sectionTitle;
  document.getElementById("letter-salutation").textContent = cfg.letter.salutation;
  const lBody = document.getElementById("letter-body");
  lBody.innerHTML = "";
  cfg.letter.paragraphs.forEach((pText) => {
    const p = document.createElement("p");
    p.textContent = pText;
    lBody.appendChild(p);
  });
  document.getElementById("letter-signoff").textContent = cfg.letter.signOff;
  document.getElementById("letter-sender").textContent = cfg.letter.senderName;

  document.getElementById("finale-popper-btn").textContent = cfg.footer.finalPopperButtonText;
  document.getElementById("finale-cracker-btn").textContent = cfg.footer.finalFirecrackerButtonText;
  document.getElementById("footer-text").textContent = cfg.footer.text;
}

function initRoamingCutouts(cfg) {
  const layer = document.getElementById("roaming-cutouts-layer");
  layer.innerHTML = "";
  const list = (cfg.roamingCutouts || []).filter((c) => c.enabled);

  list.forEach((cCfg, idx) => {
    const el = document.createElement("div");
    el.className = "roaming-cutout";

    const inner = document.createElement("div");
    inner.className = "roaming-cutout-inner";

    const bubble = document.createElement("div");
    bubble.className = "roaming-bubble show";
    const msgs = cCfg.messages && cCfg.messages.length ? cCfg.messages : ["Happy Birthday! 🎉"];
    let msgIdx = 0;
    bubble.textContent = msgs[0];

    const img = document.createElement("img");
    img.src = cCfg.image;
    img.alt = "Cutout";
    img.onerror = () => {
      img.remove();
      const fb = document.createElement("div");
      fb.className = "roaming-fallback";
      fb.textContent = cCfg.fallbackEmoji || "✨";
      inner.appendChild(fb);
    };

    inner.append(bubble, img);
    el.appendChild(inner);
    layer.appendChild(el);

    const moveRandomly = () => {
      const pad = 16;
      const maxX = Math.max(pad, window.innerWidth - 130);
      const maxY = Math.max(80, window.innerHeight - 190);
      const rx = pad + Math.random() * (maxX - pad);
      const ry = 65 + Math.random() * (maxY - 65);
      el.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    };

    const startX = idx === 0 ? 14 : idx === 1 ? Math.max(20, window.innerWidth - 135) : Math.max(20, window.innerWidth * 0.45);
    const startY = idx === 0 ? 90 : idx === 1 ? 160 : Math.max(120, window.innerHeight - 230);
    el.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;

    setTimeout(() => {
      moveRandomly();
      setInterval(moveRandomly, 5200 + idx * 900);
    }, 1200 + idx * 700);

    setInterval(() => {
      bubble.classList.remove("show");
      setTimeout(() => {
        msgIdx = (msgIdx + 1) % msgs.length;
        bubble.textContent = msgs[msgIdx];
        bubble.classList.add("show");
      }, 300);
    }, 4400 + idx * 800);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      msgIdx = (msgIdx + 1) % msgs.length;
      bubble.textContent = msgs[msgIdx];
      bubble.classList.add("show");
      const rect = el.getBoundingClientRect();
      fireConfettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 24);
      moveRandomly();
    });
  });
}

function setupInteractions(cfg) {
  const form = document.getElementById("vault-form");
  const input = document.getElementById("passcode-input");
  const errorEl = document.getElementById("vault-error");
  const card = document.getElementById("vault-card");

  document.getElementById("hint-toggle").addEventListener("click", () => {
    document.getElementById("vault-hint").classList.toggle("hidden");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const entered = input.value.trim().toLowerCase();
    const validCodes = cfg.vault.passcodes.map((c) => c.trim().toLowerCase());

    if (validCodes.includes(entered)) {
      unlockVault(cfg);
    } else {
      errorEl.textContent = cfg.vault.wrongPasscodeText;
      card.classList.remove("shake");
      void card.offsetWidth;
      card.classList.add("shake");
    }
  });

  document.getElementById("hero-popper-btn").addEventListener("click", () => firePartyPoppers());
  document.getElementById("mini-popper-btn").addEventListener("click", () => firePartyPoppers());
  document.getElementById("finale-popper-btn").addEventListener("click", () => {
    firePartyPoppers();
    setTimeout(firePartyPoppers, 320);
  });

  document.getElementById("hero-cracker-btn").addEventListener("click", () => launchFirecrackerSalvo(4));
  document.getElementById("mini-cracker-btn").addEventListener("click", () => launchFirecrackerSalvo(4));
  document.getElementById("finale-cracker-btn").addEventListener("click", () => {
    launchFirecrackerSalvo(6);
    setTimeout(() => launchFirecrackerSalvo(6), 550);
  });

  window.addEventListener("pointerdown", (e) => {
    if (!cfg.effects || !cfg.effects.tapAnywhereSparks) return;
    if (e.target.closest("button, input, .auto-frame, .flip-card, .envelope-card, .roaming-cutout, .modal-card")) return;
    if (Math.random() > 0.45) {
      spawnRocketTo(e.clientX, e.clientY);
    } else {
      explodeFirecracker(e.clientX, e.clientY, 34);
    }
  });

  const candles = document.querySelectorAll(".candle");
  const wishBanner = document.getElementById("wish-banner");

  candles.forEach((candle) => {
    candle.addEventListener("click", () => {
      if (candle.getAttribute("data-lit") === "false") return;
      candle.setAttribute("data-lit", "false");

      const rect = candle.getBoundingClientRect();
      explodeFirecracker(rect.left + rect.width / 2, rect.top - 10, 36);

      const blownCount = Array.from(candles).filter((c) => c.getAttribute("data-lit") === "false").length;
      if (blownCount === candles.length) {
        wishBanner.classList.remove("hidden");
        firePartyPoppers();
        launchFirecrackerSalvo(5);
      }
    });
  });

  document.getElementById("relight-btn").addEventListener("click", () => {
    candles.forEach((c) => c.setAttribute("data-lit", "true"));
    wishBanner.classList.add("hidden");
  });

  document.getElementById("music-toggle-btn").addEventListener("click", () => {
    if (isPlaying) pauseMusic(cfg);
    else playMusic(cfg);
  });

  const overlay = document.getElementById("modal-overlay");
  document.getElementById("modal-close-btn").addEventListener("click", () => {
    overlay.classList.add("hidden");
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.add("hidden");
  });
}

function unlockVault(cfg) {
  const vaultScreen = document.getElementById("vault-screen");
  const mainContent = document.getElementById("main-content");
  document.getElementById("lock-icon").textContent = "🔓";

  vaultScreen.classList.add("unlocked");
  mainContent.classList.remove("hidden");
  firePartyPoppers();
  launchFirecrackerSalvo(5);

  if (cfg.music.enabled) {
    document.getElementById("music-bar").classList.remove("hidden");
    playMusic(cfg);
  }

  setTimeout(() => {
    vaultScreen.classList.add("hidden");
  }, 1150);
}

function setupScrollObservers() {
  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".scroll-pop").forEach((el) => sectionObs.observe(el));

  const wallStickObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const idx = entry.target.dataset.photoIndex;
        const pinnedTwin = document.getElementById(`wall-pin-${idx}`);
        if (!pinnedTwin) return;

        if (entry.isIntersecting) {
          const deg = pinnedTwin.dataset.targetRotate || "0";
          pinnedTwin.classList.add("stuck");
          pinnedTwin.style.transform = `scale(1) rotate(${deg}deg)`;
        } else if (entry.boundingClientRect.top < 0) {
          const deg = pinnedTwin.dataset.targetRotate || "0";
          pinnedTwin.classList.add("stuck");
          pinnedTwin.style.transform = `scale(1) rotate(${deg}deg)`;
          entry.target.classList.add("pinned-to-wall");
        } else {
          pinnedTwin.classList.remove("stuck");
          pinnedTwin.style.transform = "scale(1.5) rotate(0deg)";
          entry.target.classList.remove("pinned-to-wall");
        }
      });
    },
    { threshold: 0.35 }
  );
  document.querySelectorAll(".wall-photo-stage").forEach((el) => wallStickObs.observe(el));
}

function startLiveCounter(isoString) {
  const start = new Date(isoString).getTime();
  if (isNaN(start)) return;

  const update = () => {
    const diff = Math.max(0, Date.now() - start);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    document.getElementById("cnt-days").textContent = days.toLocaleString();
    document.getElementById("cnt-hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("cnt-mins").textContent = String(mins).padStart(2, "0");
    document.getElementById("cnt-secs").textContent = String(secs).padStart(2, "0");
  };
  update();
  setInterval(update, 1000);
}

function playMusic(cfg) {
  const audioEl = document.getElementById("bg-audio");
  const btn = document.getElementById("music-toggle-btn");
  const eq = document.getElementById("eq-bars");

  audioEl
    .play()
    .then(() => {
      isPlaying = true;
      btn.textContent = cfg.music.pauseButtonText;
      eq.classList.add("playing");
    })
    .catch(() => {
      if (cfg.music.useFallbackSynthIfMissing) {
        startBirthdaySynth();
        isPlaying = true;
        btn.textContent = cfg.music.pauseButtonText;
        eq.classList.add("playing");
      }
    });
}

function pauseMusic(cfg) {
  const audioEl = document.getElementById("bg-audio");
  const btn = document.getElementById("music-toggle-btn");
  const eq = document.getElementById("eq-bars");

  audioEl.pause();
  stopBirthdaySynth();
  isPlaying = false;
  btn.textContent = cfg.music.playButtonText;
  eq.classList.remove("playing");
}

function startBirthdaySynth() {
  if (synthInterval) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const ctx = window.sharedAudioCtx || new AudioContextClass();
  window.sharedAudioCtx = ctx;

  const notes = [
    [261.63, 0.35], [261.63, 0.35], [293.66, 0.7], [261.63, 0.7], [349.23, 0.7], [329.63, 1.2],
    [261.63, 0.35], [261.63, 0.35], [293.66, 0.7], [261.63, 0.7], [392.00, 0.7], [349.23, 1.2],
    [261.63, 0.35], [261.63, 0.35], [523.25, 0.7], [440.00, 0.7], [349.23, 0.7], [329.63, 0.7], [293.66, 1.2],
    [466.16, 0.35], [466.16, 0.35], [440.00, 0.7], [349.23, 0.7], [392.00, 0.7], [349.23, 1.3]
  ];

  let idx = 0;
  const playNext = () => {
    if (!window.sharedAudioCtx) return;
    const [freq, dur] = notes[idx % notes.length];
    const osc = window.sharedAudioCtx.createOscillator();
    const gain = window.sharedAudioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, window.sharedAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, window.sharedAudioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(window.sharedAudioCtx.destination);
    osc.start();
    osc.stop(window.sharedAudioCtx.currentTime + dur);
    idx++;
    synthInterval = setTimeout(playNext, dur * 650);
  };
  playNext();
}

function stopBirthdaySynth() {
  if (synthInterval) {
    clearTimeout(synthInterval);
    synthInterval = null;
  }
}

function openPhotoModal(photo) {
  const modal = document.getElementById("modal-overlay");
  const content = document.getElementById("modal-content");
  content.innerHTML = `
    <span class="badge">${escapeHtml(photo.eraBadge || "MEMORY")}</span>
    <img src="${escapeHtml(photo.image)}" alt="${escapeHtml(photo.caption)}" onerror="this.style.display='none'" />
    <h3 style="font-family:'Fraunces',serif;font-size:1.85rem;color:var(--secondary);margin-bottom:0.45rem;">${escapeHtml(photo.caption)}</h3>
    <p style="color:var(--muted);font-size:0.95rem;line-height:1.65;">${escapeHtml(photo.story || "")}</p>
  `;
  modal.classList.remove("hidden");
}

function openEnvelopeModal(item) {
  const modal = document.getElementById("modal-overlay");
  const content = document.getElementById("modal-content");
  content.innerHTML = `
    <span class="badge">${escapeHtml(item.tag)}</span>
    <h3 style="font-family:'Fraunces',serif;font-size:1.65rem;margin-bottom:0.75rem;color:var(--secondary);">${escapeHtml(item.title)}</h3>
    <p style="color:var(--muted);line-height:1.72;">${escapeHtml(item.message)}</p>
  `;
  modal.classList.remove("hidden");
  explodeFirecracker(window.innerWidth / 2, window.innerHeight / 2, 50);
}
