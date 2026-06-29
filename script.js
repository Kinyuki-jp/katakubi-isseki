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

  function playSlashSound() {
    if (played) {
      return;
    }

    played = true;

    const start = context.currentTime + 0.02;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(0.22, start + 0.035);
    master.gain.exponentialRampToValueAtTime(0.0001, start + 0.82);
    master.connect(context.destination);

    const sweep = context.createOscillator();
    const sweepFilter = context.createBiquadFilter();
    sweep.type = "sawtooth";
    sweep.frequency.setValueAtTime(240, start);
    sweep.frequency.exponentialRampToValueAtTime(2850, start + 0.22);
    sweep.frequency.exponentialRampToValueAtTime(620, start + 0.78);
    sweepFilter.type = "bandpass";
    sweepFilter.frequency.setValueAtTime(980, start);
    sweepFilter.frequency.exponentialRampToValueAtTime(4200, start + 0.2);
    sweepFilter.frequency.exponentialRampToValueAtTime(820, start + 0.78);
    sweepFilter.Q.setValueAtTime(7.5, start);
    sweep.connect(sweepFilter);
    sweepFilter.connect(master);
    sweep.start(start);
    sweep.stop(start + 0.86);

    const shine = context.createOscillator();
    const shineGain = context.createGain();
    shine.type = "sine";
    shine.frequency.setValueAtTime(1680, start + 0.08);
    shine.frequency.exponentialRampToValueAtTime(5200, start + 0.34);
    shineGain.gain.setValueAtTime(0.0001, start + 0.06);
    shineGain.gain.exponentialRampToValueAtTime(0.16, start + 0.16);
    shineGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.58);
    shine.connect(shineGain);
    shineGain.connect(master);
    shine.start(start + 0.06);
    shine.stop(start + 0.62);

    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = createNoiseBuffer(0.72);
    noiseFilter.type = "highpass";
    noiseFilter.frequency.setValueAtTime(1600, start);
    noiseFilter.frequency.exponentialRampToValueAtTime(5200, start + 0.26);
    noiseGain.gain.setValueAtTime(0.0001, start);
    noiseGain.gain.exponentialRampToValueAtTime(0.13, start + 0.06);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(start);
    noise.stop(start + 0.72);
  }

  async function triggerSlashSound() {
    if (played) {
      return;
    }

    try {
      await context.resume();
    } catch (error) {
      return;
    }

    if (context.state === "running") {
      playSlashSound();
      window.removeEventListener("pointerdown", triggerSlashSound, true);
      window.removeEventListener("keydown", triggerSlashSound, true);
      window.removeEventListener("touchstart", triggerSlashSound, true);
    }
  }

  window.setTimeout(triggerSlashSound, 900);
  window.addEventListener("pointerdown", triggerSlashSound, { once: true, capture: true });
  window.addEventListener("keydown", triggerSlashSound, { once: true, capture: true });
  window.addEventListener("touchstart", triggerSlashSound, { once: true, capture: true });
})();
