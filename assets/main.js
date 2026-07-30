/* ==========================================================
   1. YOUR PHOTOS
   Add / remove entries. Order here is the order on the page.
   w + h are optional (they just stop the layout jumping
   before an image has loaded).
   ========================================================== */
const PHOTOS = [
  { src: "photos/01.jpg"},
  { src: "photos/02.jpg"},
  { src: "photos/03.jpg"},
  { src: "photos/04.jpg"},
  { src: "photos/05.jpg"},
  { src: "photos/06.jpg"},
  { src: "photos/07.jpg"},
  { src: "photos/08.jpg"},
  { src: "photos/09.jpg"},
  { src: "photos/10.jpg"}
];

/* ==========================================================
   2. CONTACT FORM ENDPOINT
   Pick one service, paste its endpoint below. See README.
     Web3Forms  https://api.web3forms.com/submit          (also set ACCESS_KEY)
   ========================================================== */
const FORM_ENDPOINT = "https://api.web3forms.com/submit";
const FORM_ACCESS_KEY = "1f1de842-53e0-4296-b33d-1ccfdc761df8";
const FALLBACK_EMAIL = "hello@georgijs.com";

/* ==========================================================
   3. Photo reel
   ========================================================== */
(function gallery() {
  const strip = document.getElementById("strip");
  if (!strip) return;

  const counter = document.getElementById("frameCounter");
  const hint = document.getElementById("stripHint");
  const wide = window.matchMedia("(min-width: 900px)");
  const SETS = 5;                       // copies of the set, so the loop never shows an edge

  let items = [], setWidth = 0, active = null;
  let smoothing = false, smoothTimer = null, idleTimer = null;
  let dragging = false, dragX = 0, dragLeft = 0, dragMoved = 0, pressed = null;
  let touched = false, mode = null;

  function figure(photo, i) {
    const fig = document.createElement("figure");
    fig.className = "frame";
    fig.dataset.index = i;

    const img = document.createElement("img");
    img.src = photo.src;
    img.alt = photo.caption || "";
    img.loading = i < 3 ? "eager" : "lazy";
    img.draggable = false;
    if (photo.w && photo.h) img.style.aspectRatio = photo.w + " / " + photo.h;
    img.addEventListener("load", onImageLoad);

    const cap = document.createElement("figcaption");
    cap.textContent = photo.caption || "";

    fig.append(img, cap);
    return fig;
  }

  function render(next) {
    mode = next;
    strip.dataset.mode = next;
    strip.innerHTML = "";
    const copies = next === "strip" ? SETS : 1;
    for (let s = 0; s < copies; s++) {
      PHOTOS.forEach((p, i) => strip.append(figure(p, i)));
    }
    items = [...strip.children];

    if (next === "strip") {
      requestAnimationFrame(() => {
        measure();
        goTo(items[PHOTOS.length * 2], false);   // start in the middle set
        setActive();
      });
    } else {
      counter && (counter.textContent = "");
    }
  }

  /* ---- geometry ---- */
  function measure() {
    if (items.length <= PHOTOS.length) return;
    setWidth = items[PHOTOS.length].offsetLeft - items[0].offsetLeft;
  }

  function targetFor(el) {
    return el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2;
  }

  const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

  function goTo(el, smooth) {
    if (!el) return;
    const left = targetFor(el);
    if (smooth && !calm.matches) {
      smoothing = true;
      clearTimeout(smoothTimer);
      smoothTimer = setTimeout(() => (smoothing = false), 700);
      strip.scrollTo({ left: left, behavior: "smooth" });
    } else {
      strip.scrollLeft = left;
    }
  }

  function nearest() {
    const mid = strip.scrollLeft + strip.clientWidth / 2;
    let best = null, bestD = Infinity;
    for (const el of items) {
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
      if (d < bestD) { bestD = d; best = el; }
    }
    return best;
  }

  function loop() {
    if (!setWidth) return;
    if (strip.scrollLeft < setWidth) strip.scrollLeft += setWidth;
    else if (strip.scrollLeft > setWidth * (SETS - 2)) strip.scrollLeft -= setWidth;
  }

  function setActive() {
    const el = nearest();
    if (!el || el === active) return;
    active && active.classList.remove("is-active");
    el.classList.add("is-active");
    active = el;
    if (counter) {
      const n = Number(el.dataset.index) + 1;
      counter.innerHTML = String(n).padStart(2, "0") +
        '<span class="total"> / ' + String(PHOTOS.length).padStart(2, "0") + "</span>";
    }
  }

  function onImageLoad() {
    if (mode !== "strip") return;
    measure();
    if (!touched) { goTo(items[PHOTOS.length * 2], false); setActive(); }
  }

  /* ---- interaction ---- */
  strip.addEventListener("scroll", () => {
    if (mode !== "strip") return;
    setActive();
    if (!smoothing) loop();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdle, 140);
  }, { passive: true });

  function onIdle() {
    if (mode !== "strip" || dragging) return;
    smoothing = false;
    loop();
    const el = nearest();
    if (el && Math.abs(strip.scrollLeft - targetFor(el)) > 1.5) goTo(el, true);
    setActive();
  }

  strip.addEventListener("wheel", e => {
    if (mode !== "strip") return;
    const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (!d) return;
    e.preventDefault();
    touched = true;
    hideHint();
    smoothing = false;
    strip.scrollLeft += d * (e.deltaMode === 1 ? 18 : 1);
  }, { passive: false });

  strip.addEventListener("pointerdown", e => {
    pressed = e.target.closest(".frame");
    if (mode !== "strip" || e.button !== 0) return;
    dragging = true; dragMoved = 0; touched = true;
    dragX = e.clientX; dragLeft = strip.scrollLeft;
    strip.classList.add("is-dragging");
    strip.setPointerCapture(e.pointerId);
  });

  strip.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - dragX;
    dragMoved = Math.max(dragMoved, Math.abs(dx));
    if (dragMoved > 4) hideHint();
    smoothing = false;
    strip.scrollLeft = dragLeft - dx;
  });

  ["pointerup", "pointercancel"].forEach(type =>
    strip.addEventListener(type, e => {
      if (!dragging) return;
      dragging = false;
      strip.classList.remove("is-dragging");
      try { strip.releasePointerCapture(e.pointerId); } catch (_) {}
      onIdle();
    })
  );

  strip.addEventListener("keydown", e => {
    if (mode !== "strip") return;
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    touched = true; hideHint();
    const i = items.indexOf(active);
    goTo(items[i + step] || items[i], true);
  });

  function hideHint() { hint && hint.classList.add("is-gone"); }

  /* ---- open the viewer ---- */
  strip.addEventListener("click", e => {
    const fig = e.target.closest(".frame") || pressed;
    if (!fig) return;
    if (dragMoved > 6) { dragMoved = 0; return; }
    window.openViewer(PHOTOS[Number(fig.dataset.index)]);
  });

  /* ---- resize / breakpoint ---- */
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const next = wide.matches ? "strip" : "stack";
      if (next !== mode) { touched = false; render(next); return; }
      if (mode === "strip") { measure(); goTo(active, false); }
    }, 150);
  });

  render(wide.matches ? "strip" : "stack");
})();

/* ==========================================================
   4. Fullscreen viewer
   ========================================================== */
(function viewer() {
  const box = document.getElementById("lightbox");
  if (!box) return;

  const img = document.getElementById("lightboxImg");
  const cap = document.getElementById("lightboxCap");
  const closeBtn = document.getElementById("lightboxClose");
  let lastFocus = null;

  window.openViewer = function (photo) {
    if (!photo) return;
    img.src = photo.src;
    img.alt = photo.caption || "";
    cap.textContent = photo.caption || "";
    lastFocus = document.activeElement;
    box.hidden = false;
    document.body.classList.add("is-locked");
    closeBtn.focus();
  };

  function close() {
    box.hidden = true;
    img.removeAttribute("src");
    document.body.classList.remove("is-locked");
    lastFocus && lastFocus.focus();
  }

  // any click that is not on the photo itself closes the viewer
  box.addEventListener("click", e => { if (e.target !== img) close(); });
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !box.hidden) close();
  });
})();

/* ==========================================================
   5. Contact form
   ========================================================== */
(function contact() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("formStatus");
  const btn = document.getElementById("submitBtn");

  function say(text, kind) {
    status.textContent = text;
    status.className = "form-status" + (kind ? " is-" + kind : "");
  }

  form.addEventListener("submit", async e => {
    e.preventDefault();

    if (form._gotcha.value) return;                       // bot filled the trap

    if (!form.checkValidity()) {
      say("Add your name, a valid email and a message.", "bad");
      form.reportValidity();
      return;
    }

    if (!FORM_ENDPOINT) {
      say("No form endpoint set yet — add one in assets/main.js.", "bad");
      return;
    }

    const data = new FormData(form);
    data.delete("_gotcha");
    data.append("subject", "New message from the website");
    if (FORM_ACCESS_KEY) data.append("access_key", FORM_ACCESS_KEY);

    btn.disabled = true;
    say("Sending…");

    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      say("Message sent. You'll get a reply within a couple of days.", "ok");
    } catch (_) {
      say("That didn't send. Write to " + FALLBACK_EMAIL + " instead.", "bad");
    } finally {
      btn.disabled = false;
    }
  });
})();
