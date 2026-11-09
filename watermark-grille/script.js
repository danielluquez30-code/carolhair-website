(() => {
  "use strict";

  // Restaurant hours in Naples, FL (America/New_York). [openHour, closeHour] per weekday, 0 = Sunday.
  const HOURS = { 0: [16, 21], 1: [16, 21], 2: [16, 21], 3: [16, 21], 4: [16, 21], 5: [16, 22], 6: [16, 22] };
  const TZ = "America/New_York";

  // Current date/time as seen in Naples, regardless of the visitor's timezone.
  function nowInNaples() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", hour12: false, weekday: "short"
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return {
      year: +get("year"), month: +get("month"), day: +get("day"),
      hour: +get("hour") % 24, minute: +get("minute"), dow: dayIdx
    };
  }

  const fmtHour = (h) => (h > 12 ? h - 12 : h) + (h >= 12 ? "pm" : "am");

  // ---------- Open / closed status ----------
  function updateStatus() {
    const el = document.getElementById("open-status");
    if (!el) return;
    const n = nowInNaples();
    const [open, close] = HOURS[n.dow];
    const t = n.hour + n.minute / 60;
    const text = el.querySelector(".status-text");
    el.classList.remove("is-open", "is-closed");

    if (t >= open && t < close) {
      el.classList.add("is-open");
      text.textContent = `Open now · until ${fmtHour(close)} tonight`;
    } else if (t < open) {
      el.classList.add("is-closed");
      text.textContent = `Closed now · opens today at ${fmtHour(open)}`;
    } else {
      el.classList.add("is-closed");
      const next = HOURS[(n.dow + 1) % 7][0];
      text.textContent = `Closed now · opens tomorrow at ${fmtHour(next)}`;
    }

    const row = document.querySelector(`#hours-table tr[data-days="${n.dow}"]`);
    if (row) row.classList.add("today");
  }

  // ---------- Holiday dates ----------
  function easter(y) { // Anonymous Gregorian algorithm
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }
  function nthWeekday(y, month, weekday, n) { // month 1-12, n >= 1
    const first = new Date(y, month - 1, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return new Date(y, month - 1, 1 + offset + (n - 1) * 7);
  }
  const RULES = {
    easter: (y) => easter(y),
    mothers: (y) => nthWeekday(y, 5, 0, 2),      // 2nd Sunday of May
    fathers: (y) => nthWeekday(y, 6, 0, 3),      // 3rd Sunday of June
    thanksgiving: (y) => nthWeekday(y, 11, 4, 4) // 4th Thursday of November
  };

  function holidayDate(li, year) {
    const rule = li.dataset.rule;
    if (rule) return RULES[rule](year);
    return new Date(year, +li.dataset.month - 1, +li.dataset.day);
  }

  function updateHolidays() {
    const list = document.getElementById("holiday-list");
    if (!list) return;
    const n = nowInNaples();
    const today = new Date(n.year, n.month - 1, n.day);
    const fmt = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });

    let nextLi = null, nextDate = null;
    list.querySelectorAll("li").forEach((li) => {
      let d = holidayDate(li, n.year);
      if (d < today) d = holidayDate(li, n.year + 1);
      const span = document.createElement("span");
      span.className = "h-date";
      span.textContent = fmt.format(d);
      li.querySelector(".h-name").after(span);
      if (!nextDate || d < nextDate) { nextDate = d; nextLi = li; }
    });
    if (nextLi) nextLi.classList.add("next");
  }

  // ---------- Header: scroll state, mobile menu, active link ----------
  function initHeader() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.getElementById("nav");

    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const setOpen = (open) => {
      header.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    toggle.addEventListener("click", () => setOpen(!header.classList.contains("open")));
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

    if ("IntersectionObserver" in window) {
      const links = new Map([...nav.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute("href").slice(1), a]));
      const spy = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((a) => a.classList.remove("active"));
            const a = links.get(en.target.id);
            if (a) a.classList.add("active");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
    }
  }

  // ---------- Reveal on scroll ----------
  function initReveal() {
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const targets = document.querySelectorAll(".section-head, .dish, .split-media, .split-text, .holidays li, .card, .g-item, .visit-info, .visit-map");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    targets.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      io.observe(el);
    });
  }

  // ---------- Gallery lightbox ----------
  function initLightbox() {
    const dlg = document.getElementById("lightbox");
    const items = [...document.querySelectorAll("#gallery-grid .g-item")];
    if (!dlg || !items.length || typeof dlg.showModal !== "function") return;
    const img = document.getElementById("lb-img");
    const cap = document.getElementById("lb-cap");
    let idx = 0;

    const show = (i) => {
      idx = (i + items.length) % items.length;
      const it = items[idx];
      img.src = it.dataset.src;
      img.alt = it.querySelector("img").alt;
      cap.textContent = it.dataset.caption || "";
    };
    items.forEach((it, i) => it.addEventListener("click", () => { show(i); dlg.showModal(); }));
    dlg.querySelector(".lb-close").addEventListener("click", () => dlg.close());
    dlg.querySelector(".lb-prev").addEventListener("click", () => show(idx - 1));
    dlg.querySelector(".lb-next").addEventListener("click", () => show(idx + 1));
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  document.getElementById("year").textContent = new Date().getFullYear();
  updateStatus();
  setInterval(updateStatus, 60 * 1000);
  updateHolidays();
  initHeader();
  initReveal();
  initLightbox();
})();
