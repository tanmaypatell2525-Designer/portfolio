const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const themeToggle = document.querySelector(".theme-toggle");
const themeText = document.querySelector(".theme-text");

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  if (themeText) themeText.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  if (themeToggle) themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
};

applyTheme(document.documentElement.dataset.theme || "light");

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    localStorage.setItem("portfolio-theme", nextTheme);
  } catch {
    // Theme still changes for this visit if storage is unavailable.
  }
});

menuButton.addEventListener("click", () => {
  const isOpen = menuButton.classList.toggle("active");
  mobileMenu.classList.toggle("open", isOpen);
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  menuButton.setAttribute("aria-expanded", String(isOpen));
});

mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.classList.remove("active");
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
document.querySelector("#year").textContent = new Date().getFullYear();

const introLoader = document.querySelector(".intro-loader");
if (introLoader) {
  window.addEventListener("load", () => {
    window.setTimeout(() => introLoader.remove(), 3100);
  });
}

const auroraCanvas = document.querySelector(".aurora-cursor");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
const sectionPalettes = [
  { selector: ".hero", hue: 250, colors: ["#8858ff", "#27b9c8", "#ff6686"] },
  { selector: ".work", hue: 205, colors: ["#407dff", "#23b886", "#ff744f"] },
  { selector: ".tools-marquee", hue: 280, colors: ["#9a58ff", "#3aa7ff", "#e74893"] },
  { selector: ".about", hue: 178, colors: ["#3178d1", "#19b8a3", "#9b4bd8"] },
  { selector: ".contact", hue: 325, colors: ["#7d35d8", "#d72f76", "#ffae32"] },
];
let currentAuroraHue = sectionPalettes[0].hue;
let targetAuroraHue = currentAuroraHue;

const updateSectionPalette = () => {
  const viewportCenter = window.innerHeight * 0.5;
  const activePalette = sectionPalettes.find(({ selector }) => {
    const section = document.querySelector(selector);
    if (!section) return false;
    const bounds = section.getBoundingClientRect();
    return bounds.top <= viewportCenter && bounds.bottom >= viewportCenter;
  }) || sectionPalettes[0];

  targetAuroraHue = activePalette.hue;
};

let paletteFrame;
window.addEventListener("scroll", () => {
  if (paletteFrame) return;
  paletteFrame = requestAnimationFrame(() => {
    updateSectionPalette();
    paletteFrame = null;
  });
}, { passive: true });
updateSectionPalette();

if (auroraCanvas && !reducedMotion && !coarsePointer) {
  const context = auroraCanvas.getContext("2d");
  const trail = Array.from({ length: 18 }, () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  }));
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const liquidBlobs = [
    { angle: 0, distance: 54, speed: 0.0016, size: 190, hueOffset: 0 },
    { angle: 2.1, distance: 72, speed: -0.0012, size: 165, hueOffset: 70 },
    { angle: 4.2, distance: 46, speed: 0.002, size: 150, hueOffset: 135 },
  ];
  let isVisible = false;
  let pixelRatio = 1;
  let movementTimer;

  const resizeAurora = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    auroraCanvas.width = window.innerWidth * pixelRatio;
    auroraCanvas.height = window.innerHeight * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  window.addEventListener("resize", resizeAurora);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    isVisible = true;
    clearTimeout(movementTimer);
    movementTimer = setTimeout(() => { isVisible = false; }, 120);
  });
  document.documentElement.addEventListener("mouseleave", () => {
    clearTimeout(movementTimer);
    isVisible = false;
  });

  const drawAurora = (time) => {
    const hueDistance = ((targetAuroraHue - currentAuroraHue + 540) % 360) - 180;
    currentAuroraHue = (currentAuroraHue + hueDistance * 0.035 + 360) % 360;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    trail[0].x += (pointer.x - trail[0].x) * 0.22;
    trail[0].y += (pointer.y - trail[0].y) * 0.22;

    for (let index = 1; index < trail.length; index += 1) {
      trail[index].x += (trail[index - 1].x - trail[index].x) * 0.28;
      trail[index].y += (trail[index - 1].y - trail[index].y) * 0.28;
    }

    if (isVisible) {
      context.globalCompositeOperation = "source-over";
      trail.forEach((point, index) => {
        const progress = index / trail.length;
        const radius = 122 - progress * 72 + Math.sin(time * 0.004 + index) * 10;
        const hue = (time * 0.018 + currentAuroraHue + index * 12) % 360;
        const glow = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
        glow.addColorStop(0, `hsla(${hue}, 100%, 38%, ${0.36 * (1 - progress)})`);
        glow.addColorStop(0.4, `hsla(${(hue + 55) % 360}, 100%, 45%, ${0.22 * (1 - progress)})`);
        glow.addColorStop(1, "hsla(0, 0%, 100%, 0)");
        context.fillStyle = glow;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      });

      context.globalCompositeOperation = "multiply";
      liquidBlobs.forEach((blob, index) => {
        const pulse = Math.sin(time * 0.0022 + index * 2.4);
        const angle = blob.angle + time * blob.speed;
        const x = trail[0].x + Math.cos(angle) * (blob.distance + pulse * 22);
        const y = trail[0].y + Math.sin(angle * 1.25) * (blob.distance * 0.72 + pulse * 16);
        const size = blob.size + pulse * 25;
        const gradient = context.createRadialGradient(x, y, size * 0.04, x, y, size);
        const blobHue = (currentAuroraHue + blob.hueOffset) % 360;
        gradient.addColorStop(0, `hsla(${blobHue}, 100%, 29%, .58)`);
        gradient.addColorStop(.42, `hsla(${(blobHue + 38) % 360}, 100%, 39%, .38)`);
        gradient.addColorStop(1, `hsla(${blobHue}, 100%, 35%, 0)`);
        context.fillStyle = gradient;
        context.beginPath();
        context.ellipse(
          x,
          y,
          size * (1 + pulse * 0.12),
          size * (.68 - pulse * 0.08),
          angle + pulse * .25,
          0,
          Math.PI * 2
        );
        context.fill();
      });
    }

    requestAnimationFrame(drawAurora);
  };

  resizeAurora();
  requestAnimationFrame(drawAurora);
}