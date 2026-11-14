// Read-aloud buttons for Shawn's site.
// Mark a block with data-read and it gets a "朗讀" button that reads the block's text in Chinese.
// Put an empty <span class="read-slot"></span> inside the block to choose where the button goes.
(function () {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') return;

  const ICON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const STOP = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>';

  let voice = null;
  function pickVoice() {
    const voices = synth.getVoices();
    const prefs = ['zh-TW', 'zh-HK', 'zh-CN', 'zh'];
    for (const p of prefs) {
      const v = voices.find(v => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(p.toLowerCase()));
      if (v) { voice = v; return; }
    }
  }
  pickVoice();
  if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', pickVoice);

  let active = null; // { block, btn }

  function setIdle(btn) {
    btn.innerHTML = ICON + '<span>朗讀</span>';
    btn.setAttribute('aria-label', '朗讀這一段');
  }
  function setPlaying(btn) {
    btn.innerHTML = STOP + '<span>停止</span>';
    btn.setAttribute('aria-label', '停止朗讀');
  }
  function stop() {
    synth.cancel();
    if (active) {
      active.block.classList.remove('reading');
      setIdle(active.btn);
      active = null;
    }
  }

  // Read the block's visible text, leaving out the button itself.
  function textOf(block) {
    if (block.dataset.readText) return block.dataset.readText;
    const copy = block.cloneNode(true);
    copy.querySelectorAll('.read-btn, [aria-hidden="true"]').forEach(n => n.remove());
    // innerText needs layout, so measure the copy off-screen.
    copy.style.position = 'absolute';
    copy.style.left = '-9999px';
    document.body.appendChild(copy);
    const t = copy.innerText;
    copy.remove();
    return t.replace(/\s+/g, ' ').trim();
  }

  // Some browsers stop long speech after ~15 seconds, so speak one sentence at a time.
  function chunks(text) {
    return text.split(/(?<=[。！？!?；;])\s*/).map(s => s.trim()).filter(Boolean);
  }

  function play(block, btn) {
    stop();
    const parts = chunks(textOf(block));
    if (!parts.length) return;
    active = { block, btn };
    block.classList.add('reading');
    setPlaying(btn);
    parts.forEach((part, i) => {
      const u = new SpeechSynthesisUtterance(part);
      u.lang = voice ? voice.lang : 'zh-TW';
      if (voice) u.voice = voice;
      u.rate = 0.9;
      if (i === parts.length - 1) {
        u.onend = () => { if (active && active.btn === btn) stop(); };
      }
      u.onerror = () => { if (active && active.btn === btn) stop(); };
      synth.speak(u);
    });
  }

  document.querySelectorAll('[data-read]').forEach(block => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'read-btn';
    setIdle(btn);
    btn.addEventListener('click', () => {
      if (active && active.btn === btn) stop();
      else play(block, btn);
    });
    const slot = block.querySelector('.read-slot');
    if (slot) slot.appendChild(btn);
    else block.prepend(btn);
  });

  window.addEventListener('pagehide', () => synth.cancel());
})();
