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

document.addEventListener(
  "pointermove",
  (event) => {
    const card = event.target.closest?.(".timeline-card");
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - box.left}px`);
    card.style.setProperty("--my", `${event.clientY - box.top}px`);
  },
  { passive: true }
);

const seriesMenu = document.querySelector(".series-menu");

if (seriesMenu) {
  document.addEventListener("click", (event) => {
    if (seriesMenu.open && !seriesMenu.contains(event.target)) seriesMenu.open = false;
  });
  seriesMenu.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && seriesMenu.open) {
      seriesMenu.open = false;
      seriesMenu.querySelector("summary").focus();
    }
  });
}

for (const button of document.querySelectorAll("[data-open-note]")) {
  const dialog = button.nextElementSibling;
  button.addEventListener("click", () => dialog.showModal());
  // Clicks on the backdrop land on the dialog element itself, outside its box
  dialog.addEventListener("click", (event) => {
    const box = dialog.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) dialog.close();
  });
}

const COLLAPSE_AFTER = 40;

const ICON = (path) =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
const COPY_ICON = ICON('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>');
const COPIED_ICON = ICON('<path d="M5 12.5l4.5 4.5L19 7.5"/>');

for (const pre of document.querySelectorAll(".prose pre")) {
  const lines = pre.querySelectorAll(".giallo-l");

  for (const line of lines) {
    // Line number gutter (2ch margin in highlight.css) plus leading spaces, so wrapped rows line up under the code
    const number = line.querySelector(".giallo-ln");
    const gutter = number ? number.textContent.length + 2 : 0;
    const code = number ? line.textContent.slice(number.textContent.length) : line.textContent;
    const hang = gutter + code.match(/^\s*/)[0].replace(/\t/g, "    ").length;
    if (hang) line.style.setProperty("--hang", `${hang}ch`);
  }

  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "code-copy";
  copy.setAttribute("aria-label", "Copy code");
  copy.innerHTML = COPY_ICON;
  copy.addEventListener("click", async () => {
    const text = [...lines]
      .map((line) => line.textContent.slice(line.querySelector(".giallo-ln")?.textContent.length ?? 0))
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      copy.innerHTML = COPIED_ICON;
      copy.setAttribute("aria-label", "Copied");
    } catch {
      return;
    }
    clearTimeout(copy.reset);
    copy.reset = setTimeout(() => {
      copy.innerHTML = COPY_ICON;
      copy.setAttribute("aria-label", "Copy code");
    }, 1500);
  });
  pre.append(copy);

  if (lines.length > COLLAPSE_AFTER) {
    pre.classList.add("collapsed");
    const bar = document.createElement("div");
    bar.className = "code-expand";
    bar.innerHTML = `<button type="button" aria-expanded="false">Show all ${lines.length} lines</button>`;
    const toggle = bar.firstChild;
    toggle.addEventListener("click", () => {
      const collapsed = pre.classList.toggle("collapsed");
      toggle.setAttribute("aria-expanded", String(!collapsed));
      toggle.textContent = collapsed ? `Show all ${lines.length} lines` : "Collapse";
      // Collapsing from deep inside a long listing would otherwise strand the reader far below it
      if (collapsed && pre.getBoundingClientRect().top < 0) pre.scrollIntoView({ block: "start" });
    });
    pre.append(bar);
  }
}
