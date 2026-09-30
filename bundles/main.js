const root = document.documentElement;

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the preference just won't persist
  }
}

document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const theme = root.classList.toggle("dark") ? "dark" : "light";
  store("color-theme", theme);
  setGiscusTheme(theme);
});

const FONT_SIZES = [16, 18, 20];

document.getElementById("font-size-switcher")?.addEventListener("click", () => {
  const current = parseInt(root.style.fontSize, 10) || FONT_SIZES[0];
  const next = FONT_SIZES[(FONT_SIZES.indexOf(current) + 1) % FONT_SIZES.length];
  root.style.fontSize = `${next}px`;
  store("font-size", next);
});

// Heading anchors copy their link as well as navigating
document.addEventListener("click", (event) => {
  const anchor = event.target.closest?.("a.heading-anchor");
  if (anchor) navigator.clipboard?.writeText(anchor.href).catch(() => {});
});

// Sidebar panels are disclosure widgets on small screens but always open beside the text
const wide = matchMedia("(min-width: 64rem)");
const syncPanels = () => {
  for (const panel of document.querySelectorAll("details.side-panel")) panel.open = wide.matches;
};
syncPanels();
wide.addEventListener("change", syncPanels);

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS = [
  ["year", 365 * 86400],
  ["month", 30 * 86400],
  ["week", 7 * 86400],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

function relativeDate(date) {
  const seconds = (date - Date.now()) / 1000;
  if (seconds > 0) return "coming soon";
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

for (const time of document.querySelectorAll("time[data-relative]")) {
  time.append(` · ${relativeDate(new Date(time.dateTime))}`);
}

const scrollTop = document.getElementById("scroll-to-top");

if (scrollTop) {
  let last = 0;
  let queued = false;

  scrollTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  window.addEventListener(
    "scroll",
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        const y = Math.max(window.scrollY, 0);
        // Only offer the button while the reader is scrolling back up a long page
        scrollTop.hidden = !(y > 800 && y < last);
        last = y;
        queued = false;
      });
    },
    { passive: true }
  );
}

const giscusTheme = (theme) => (theme === "dark" ? "purple_dark" : "light");

function setGiscusTheme(theme) {
  document
    .querySelector("iframe.giscus-frame")
    ?.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusTheme(theme) } } }, "https://giscus.app");
}

const comments = document.getElementById("comments");

if (comments) {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();

      const { giscusRepo, giscusRepoId, giscusCategory, giscusCategoryId } = comments.dataset;
      const script = document.createElement("script");
      Object.entries({
        src: "https://giscus.app/client.js",
        "data-repo": giscusRepo,
        "data-repo-id": giscusRepoId,
        "data-category": giscusCategory,
        "data-category-id": giscusCategoryId,
        "data-mapping": "title",
        "data-strict": "1",
        "data-reactions-enabled": "1",
        "data-emit-metadata": "0",
        "data-input-position": "bottom",
        "data-theme": giscusTheme(root.classList.contains("dark") ? "dark" : "light"),
        "data-lang": "en",
        crossorigin: "anonymous",
        async: "",
      }).forEach(([key, value]) => script.setAttribute(key, value));
      comments.append(script);
    },
    { rootMargin: "600px" }
  );
  observer.observe(comments);
}
