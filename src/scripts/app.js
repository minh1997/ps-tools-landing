const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

function closeMenu() {
  menuToggle?.setAttribute("aria-expanded", "false");
  mobileNav?.classList.remove("open");
  document.body.classList.remove("menu-open");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  mobileNav?.classList.toggle("open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

const toast = document.querySelector(".toast");
const toastClose = toast?.querySelector("button");
let toastTimer;

function hideToast() {
  toast?.classList.remove("show");
  toast?.setAttribute("aria-hidden", "true");
}

document.querySelectorAll(".download-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    toast?.classList.add("show");
    toast?.setAttribute("aria-hidden", "false");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 4500);
  });
});

toastClose?.addEventListener("click", hideToast);

const navLinks = [...document.querySelectorAll(".desktop-nav a")];
const sections = [...document.querySelectorAll("header[id], main section[id], footer[id]")];
const navObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
}, { rootMargin: "-28% 0px -62% 0px", threshold: [0, .2, .5] });
sections.forEach((section) => navObserver.observe(section));

const creditEmailForm = document.querySelector("#credit-order-form");
const creditEmailInput = document.querySelector("#credit-email");
const creditOrderStatus = document.querySelector("#credit-order-status");
const purchaseButtons = [...document.querySelectorAll(".price-action[data-order-endpoint]")];

function setOrderStatus(message = "", state = "") {
  if (!creditOrderStatus) return;
  creditOrderStatus.textContent = message;
  creditOrderStatus.dataset.state = state;
}

function setPurchaseLoading(activeButton) {
  purchaseButtons.forEach((button) => {
    button.disabled = Boolean(activeButton);
    button.classList.toggle("loading", button === activeButton);
    const label = button.querySelector("span");
    if (label) label.textContent = button === activeButton ? "Đang tạo đơn..." : "Mua ngay";
  });
}

function createIdempotencyKey(packageValue) {
  if (globalThis.crypto?.randomUUID) return `credits-${packageValue}-${crypto.randomUUID()}`;
  return `credits-${packageValue}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function findPaymentUrl(value, depth = 0) {
  if (!value || typeof value !== "object" || depth > 4) return null;
  const keys = ["checkoutUrl", "paymentUrl", "redirectUrl", "payUrl", "checkout_url", "payment_url", "redirect_url", "pay_url"];
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate !== "string") continue;
    try {
      const url = new URL(candidate, window.location.origin);
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch {}
  }
  for (const nested of Object.values(value)) {
    const found = findPaymentUrl(nested, depth + 1);
    if (found) return found;
  }
  return null;
}

function getApiMessage(data, fallback) {
  return data?.error?.message || data?.message || fallback;
}

async function createOrder(button) {
  if (!(creditEmailForm instanceof HTMLFormElement) || !(creditEmailInput instanceof HTMLInputElement)) return;
  creditEmailInput.value = creditEmailInput.value.trim();
  if (!creditEmailForm.checkValidity()) {
    setOrderStatus("Vui lòng nhập địa chỉ email hợp lệ trước khi mua.", "error");
    creditEmailInput.focus();
    creditEmailForm.reportValidity();
    return;
  }

  const endpoint = button.dataset.orderEndpoint;
  const packageValue = button.dataset.creditPackage;
  if (!endpoint || !packageValue) return;

  setPurchaseLoading(button);
  setOrderStatus(`Đang tạo đơn hàng ${Number(packageValue).toLocaleString("vi-VN")} credit...`, "loading");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key": createIdempotencyKey(packageValue),
      },
      body: JSON.stringify({ email: creditEmailInput.value }),
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : { message: await response.text() };
    if (!response.ok) throw new Error(getApiMessage(data, "Không thể tạo đơn thanh toán. Vui lòng thử lại."));

    const paymentUrl = findPaymentUrl(data);
    if (paymentUrl) {
      setOrderStatus("Đã tạo đơn. Đang chuyển bạn tới trang thanh toán...", "success");
      window.location.assign(paymentUrl);
      return;
    }
    setOrderStatus(getApiMessage(data, "Đơn hàng đã được tạo. Vui lòng kiểm tra email để tiếp tục thanh toán."), "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Có lỗi xảy ra. Vui lòng thử lại.";
    setOrderStatus(message, "error");
  } finally {
    setPurchaseLoading(null);
  }
}

purchaseButtons.forEach((button) => button.addEventListener("click", () => createOrder(button)));
creditEmailForm?.addEventListener("submit", (event) => event.preventDefault());
creditEmailInput?.addEventListener("input", () => {
  if (creditOrderStatus?.dataset.state === "error") setOrderStatus();
});
