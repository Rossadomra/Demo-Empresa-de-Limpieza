(function () {
  "use strict";

  const $  = (sel, scope) => (scope || document).querySelector(sel);
  const $$ = (sel, scope) => Array.from((scope || document).querySelectorAll(sel));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  /* ---- Sticky nav: transparent on hero, solid on scroll ---- */
  function initNav() {
    const nav = $(".nav");
    if (!nav) return;
    const hasHero = nav.classList.contains("nav--transparent");
    const setH = () => document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
    setH();
    window.addEventListener("resize", setH);

    const onScroll = () => {
      const solid = window.scrollY > (hasHero ? window.innerHeight * 0.6 : 10);
      nav.classList.toggle("is-solid", solid);
      if (hasHero) nav.classList.toggle("nav--transparent", !solid);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile drawer ---- */
  function initDrawer() {
    const toggle = $(".nav__toggle");
    const drawer = $(".nav__drawer");
    const scrim = $(".scrim");
    if (!toggle || !drawer) return;
    const open = (state) => {
      toggle.classList.toggle("is-open", state);
      drawer.classList.toggle("is-open", state);
      if (scrim) scrim.classList.toggle("is-open", state);
      toggle.setAttribute("aria-expanded", state ? "true" : "false");
      document.body.style.overflow = state ? "hidden" : "";
    };
    toggle.addEventListener("click", () => open(!drawer.classList.contains("is-open")));
    if (scrim) scrim.addEventListener("click", () => open(false));
    $$(".nav__drawer a").forEach(a => a.addEventListener("click", () => open(false)));
    document.addEventListener("keydown", e => { if (e.key === "Escape") open(false); });
  }

  /* ---- Smooth anchor scroll ---- */
  function initSmoothScroll() {
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const nav = $(".nav");
      const offset = (nav ? nav.offsetHeight : 70) + 14;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - offset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* ---- Reveal on scroll ---- */
  function initReveals() {
    const items = $$(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach(el => el.classList.add("is-visible")); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -4% 0px" });
    items.forEach(el => io.observe(el));
    // Safety net
    setTimeout(() => {
      $$(".reveal:not(.is-visible)").forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---- Count-up stats ---- */
  function initCountUp() {
    const nums = $$("[data-count-to]");
    if (!nums.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.countTo);
      const prefix = el.dataset.prefix || "";
      const suffix = el.dataset.suffix || "";
      const dur = 1500; const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.round(target * eased);
        el.textContent = prefix + val + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    nums.forEach(el => io.observe(el));
  }

  /* ---- Subtle tilt on cards ---- */
  function initTilt() {
    if (matchMedia("(hover: none)").matches) return;
    $$("[data-tilt]").forEach(card => {
      const max = 6;
      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-7px)`;
      };
      const reset = () => { card.style.transform = ""; };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseout", e => { if (!card.contains(e.relatedTarget)) reset(); });
    });
  }

  /* ---- Magnetic buttons (subtle) ---- */
  function initMagnetic() {
    if (matchMedia("(hover: none)").matches) return;
    $$("[data-magnetic]").forEach(btn => {
      const strength = 0.25;
      btn.addEventListener("mousemove", e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("mouseout", e => { if (!btn.contains(e.relatedTarget)) btn.style.transform = ""; });
    });
  }

  /* ---- FAQ accordion ---- */
  function initFaq() {
    $$(".faq-item").forEach(item => {
      const q = $(".faq-q", item);
      const a = $(".faq-a", item);
      if (!q || !a) return;
      q.setAttribute("aria-expanded", "false");
      q.addEventListener("click", () => {
        const open = item.classList.contains("is-open");
        $$(".faq-item.is-open").forEach(other => {
          if (other !== item) {
            other.classList.remove("is-open");
            $(".faq-a", other).style.maxHeight = null;
            $(".faq-q", other).setAttribute("aria-expanded", "false");
          }
        });
        item.classList.toggle("is-open", !open);
        q.setAttribute("aria-expanded", !open ? "true" : "false");
        a.style.maxHeight = !open ? a.scrollHeight + "px" : null;
      });
    });
  }

  /* ---- Mobile sticky CTA visibility ---- */
  function initMobileCta() {
    const bar = $(".mobile-cta");
    if (!bar) return;
    document.body.classList.add("has-mobile-cta");
    const onScroll = () => bar.classList.toggle("is-visible", window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Contact form (simulated submit) ---- */
  function initForm() {
    const form = $("#quote-form");
    if (!form) return;
    const success = $(".form__success", form);
    form.addEventListener("submit", e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const btn = $('button[type="submit"]', form);
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      setTimeout(() => {
        form.classList.add("is-sent");
        if (success) success.classList.add("is-visible");
        form.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      }, 900);
    });
  }

  /* ---- Year ---- */
  function initYear() {
    $$("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });
  }

  function boot() {
    safe(initNav, "initNav");
    safe(initDrawer, "initDrawer");
    safe(initSmoothScroll, "initSmoothScroll");
    safe(initReveals, "initReveals");
    safe(initCountUp, "initCountUp");
    safe(initTilt, "initTilt");
    safe(initMagnetic, "initMagnetic");
    safe(initFaq, "initFaq");
    safe(initMobileCta, "initMobileCta");
    safe(initForm, "initForm");
    safe(initYear, "initYear");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
