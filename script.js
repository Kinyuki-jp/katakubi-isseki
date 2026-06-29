if (window.lucide) {
  window.lucide.createIcons({
    attrs: {
      "stroke-width": 2,
    },
  });
}

(() => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || !document.querySelector(".opening")) {
    return;
  }

  const context = new AudioContext();
  let played = false;

  function createNoiseBuffer(duration) {
    const length = Math.max(1, Math.floor(context.sampleRate * duration));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function connectMaster(start, duration, peak) {
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, start);
    compressor.knee.setValueAtTime(18, start);
    compressor.ratio.setValueAtTime(6, start);
    compressor.attack.setValueAtTime(0.006, start);
    compressor.release.setValueAtTime(0.16, start);

    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(peak, start + 0.04);
    master.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    compressor.connect(master);
    master.connect(context.destination);

    return compressor;
  }

  function scheduleDoorSlide(start) {
    const master = connectMaster(start, 5.1, 0.42);

    const wood = context.createBufferSource();
    const woodFilter = context.createBiquadFilter();
    const woodGain = context.createGain();
    wood.buffer = createNoiseBuffer(5.1);
    woodFilter.type = "lowpass";
    woodFilter.frequency.setValueAtTime(180, start);
    woodFilter.frequency.linearRampToValueAtTime(520, start + 4.4);
    woodFilter.Q.setValueAtTime(1.2, start);
    woodGain.gain.setValueAtTime(0.0001, start);
    woodGain.gain.exponentialRampToValueAtTime(0.34, start + 0.22);
    woodGain.gain.exponentialRampToValueAtTime(0.08, start + 4.7);
    wood.connect(woodFilter);
    woodFilter.connect(woodGain);
    woodGain.connect(master);
    wood.start(start);
    wood.stop(start + 5.1);

    const rumble = context.createOscillator();
    const rumbleGain = context.createGain();
    rumble.type = "triangle";
    rumble.frequency.setValueAtTime(48, start);
    rumble.frequency.linearRampToValueAtTime(72, start + 4.6);
    rumbleGain.gain.setValueAtTime(0.0001, start);
    rumbleGain.gain.exponentialRampToValueAtTime(0.2, start + 0.32);
    rumbleGain.gain.exponentialRampToValueAtTime(0.0001, start + 5);
    rumble.connect(rumbleGain);
    rumbleGain.connect(master);
    rumble.start(start);
    rumble.stop(start + 5.05);
  }

  function scheduleCut(start, pitch, length) {
    const master = connectMaster(start, length, 0.5);

    const edge = context.createOscillator();
    const edgeFilter = context.createBiquadFilter();
    const edgeGain = context.createGain();
    edge.type = "sawtooth";
    edge.frequency.setValueAtTime(pitch * 0.42, start);
    edge.frequency.exponentialRampToValueAtTime(pitch, start + length * 0.34);
    edge.frequency.exponentialRampToValueAtTime(pitch * 0.54, start + length);
    edgeFilter.type = "bandpass";
    edgeFilter.frequency.setValueAtTime(pitch * 0.62, start);
    edgeFilter.frequency.exponentialRampToValueAtTime(pitch * 1.42, start + length * 0.4);
    edgeFilter.Q.setValueAtTime(8, start);
    edgeGain.gain.setValueAtTime(0.0001, start);
    edgeGain.gain.exponentialRampToValueAtTime(0.34, start + 0.03);
    edgeGain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    edge.connect(edgeFilter);
    edgeFilter.connect(edgeGain);
    edgeGain.connect(master);
    edge.start(start);
    edge.stop(start + length);

    const chop = context.createBufferSource();
    const chopFilter = context.createBiquadFilter();
    const chopGain = context.createGain();
    chop.buffer = createNoiseBuffer(length);
    chopFilter.type = "highpass";
    chopFilter.frequency.setValueAtTime(1400, start);
    chopFilter.frequency.exponentialRampToValueAtTime(6200, start + length * 0.5);
    chopGain.gain.setValueAtTime(0.0001, start);
    chopGain.gain.exponentialRampToValueAtTime(0.42, start + 0.018);
    chopGain.gain.exponentialRampToValueAtTime(0.0001, start + length * 0.82);
    chop.connect(chopFilter);
    chopFilter.connect(chopGain);
    chopGain.connect(master);
    chop.start(start);
    chop.stop(start + length);

    const hit = context.createOscillator();
    const hitGain = context.createGain();
    hit.type = "square";
    hit.frequency.setValueAtTime(96, start + 0.026);
    hit.frequency.exponentialRampToValueAtTime(54, start + 0.12);
    hitGain.gain.setValueAtTime(0.0001, start + 0.02);
    hitGain.gain.exponentialRampToValueAtTime(0.2, start + 0.034);
    hitGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    hit.connect(hitGain);
    hitGain.connect(master);
    hit.start(start + 0.02);
    hit.stop(start + 0.2);
  }

  function playIntroSounds() {
    if (played) {
      return;
    }

    played = true;

    const start = context.currentTime + 0.02;
    const compact = window.matchMedia("(max-width: 680px)").matches;
    const firstCut = compact ? 4.72 : 5.88;
    scheduleDoorSlide(start);
    scheduleCut(start + firstCut, 3800, 0.46);
    scheduleCut(start + firstCut + 0.3, 5200, 0.42);
    scheduleCut(start + firstCut + 0.6, 4400, 0.5);
  }

  async function triggerIntroSounds() {
    if (played) {
      return;
    }

    try {
      await context.resume();
    } catch (error) {
      return;
    }

    if (context.state === "running") {
      playIntroSounds();
      window.removeEventListener("pointerdown", triggerIntroSounds, true);
      window.removeEventListener("keydown", triggerIntroSounds, true);
      window.removeEventListener("touchstart", triggerIntroSounds, true);
    }
  }

  window.setTimeout(triggerIntroSounds, 700);
  window.addEventListener("pointerdown", triggerIntroSounds, { once: true, capture: true });
  window.addEventListener("keydown", triggerIntroSounds, { once: true, capture: true });
  window.addEventListener("touchstart", triggerIntroSounds, { once: true, capture: true });
})();
