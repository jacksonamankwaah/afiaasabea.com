const root = document.documentElement;
const body = document.body;
const nav = document.getElementById("nav");
const menu = document.getElementById("menu");
const menuBtn = document.getElementById("menuBtn");
const hero = document.getElementById("top");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
root.classList.add("js");

/* Smooth inertia scrolling (Lenis). Falls back to normal scrolling if it fails to load. */
let lenis = null;
if (window.Lenis && !reduce) {
  lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* Page-load sequence */
window.addEventListener("load", () => requestAnimationFrame(() => body.classList.add("loaded")));

/* Hero slideshow */
const DURATION = 6000;
const slides = [...document.querySelectorAll(".slide")];
const dots = [...document.querySelectorAll(".dots button")];
let current = 0, timer;
root.style.setProperty("--dur", DURATION + "ms");
function show(i) {
  current = (i + slides.length) % slides.length;
  slides.forEach((s, k) => s.classList.toggle("active", k === current));
  dots.forEach((d, k) => d.classList.toggle("active", k === current));
  hero.style.setProperty("--shade", slides[current].dataset.shade);
  clearTimeout(timer);
  if (!reduce && !document.hidden) timer = setTimeout(() => show(current + 1), DURATION);
}
dots.forEach((d, k) => d.addEventListener("click", () => show(k)));
document.addEventListener("visibilitychange", () => show(current));
let startX = 0;
hero.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
hero.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 45) show(current + (dx < 0 ? 1 : -1));
}, { passive: true });
show(0);

/* Scroll-linked effects: hero shrink, nav background, watermark parallax */
const panels = [...document.querySelectorAll(".panel")];
let ticking = false;
function update() {
  const vh = window.innerHeight;
  const p = reduce ? 0 : Math.min(Math.max(window.scrollY / (vh * 0.7), 0), 1);
  root.style.setProperty("--p", p.toFixed(3));
  nav.classList.toggle("scrolled", window.scrollY > vh * 0.5);
  if (!reduce) panels.forEach(el => {
    const r = el.getBoundingClientRect();
    const v = (r.top + r.height / 2 - vh / 2) / vh;
    el.style.setProperty("--py", Math.max(-1.5, Math.min(1.5, v)).toFixed(3));
  });
  ticking = false;
}
window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
window.addEventListener("resize", update);
update();

/* Menu */
function setMenu(open) {
  body.classList.toggle("menu-open", open);
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu.inert = !open;
  if (lenis) open ? lenis.stop() : lenis.start();
}
menuBtn.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

/* Anchor links scroll smoothly */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = id === "#top" ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    setMenu(false);
    if (lenis) lenis.scrollTo(target, { duration: 1.5 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  });
});

/* Section content reveals once */
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
}), { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* Copy buttons for donation numbers */
document.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
  const text = btn.dataset.copy;
  try { await navigator.clipboard.writeText(text); }
  catch {
    const t = document.createElement("textarea");
    t.value = text; document.body.appendChild(t); t.select();
    document.execCommand("copy"); t.remove();
  }
  const label = btn.textContent;
  btn.textContent = "Copied";
  setTimeout(() => { btn.textContent = label; }, 1800);
}));