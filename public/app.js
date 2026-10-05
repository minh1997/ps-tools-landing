const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  mobileNav.classList.toggle("open", !open);
  document.body.classList.toggle("menu-open", !open);
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("open");
    document.body.classList.remove("menu-open");
  });
});

const compareRange = document.querySelector("#compareRange");
const beforePane = document.querySelector("#beforePane");
const compareLine = document.querySelector("#compareLine");

compareRange?.addEventListener("input", (event) => {
  const value = `${event.target.value}%`;
  beforePane.style.width = value;
  compareLine.style.left = value;
});

const navLinks = [...document.querySelectorAll(".desktop-nav a")];
const sections = [...document.querySelectorAll("main section[id], #top")];

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    const id = visible.target.id || "top";
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
  },
  { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.2, 0.5] }
);

sections.forEach((section) => sectionObserver.observe(section));

const toast = document.querySelector(".toast");
const toastClose = toast?.querySelector("button");
let toastTimer;

function showToast(platform = "") {
  const title = toast.querySelector("b");
  title.textContent = platform ? `Bản cài đặt ${platform} đang được chuẩn bị` : "Bản cài đặt đang được chuẩn bị";
  toast.classList.add("show");
  toast.setAttribute("aria-hidden", "false");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4500);
}

function hideToast() {
  toast?.classList.remove("show");
  toast?.setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".download-trigger").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    if (trigger.getAttribute("href") !== "#tai-xuong") event.preventDefault();
    if (trigger.dataset.platform) showToast(trigger.dataset.platform);
  });
});

toastClose?.addEventListener("click", hideToast);
