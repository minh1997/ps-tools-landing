const PAYMENT_API_ORIGIN = "https://visual-tools.webacela.com";
const ORDER_PATHS = new Set([
  "/api/v1/payments/packages/credits-200/orders",
  "/api/v1/payments/packages/credits-400/orders",
  "/api/v1/payments/packages/credits-800/orders",
  "/api/v1/payments/packages/credits-1000/orders",
  "/api/v1/payments/packages/credits-2000/orders",
]);

const jsonResponse = (body, status) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

const isEmail = (value) => typeof value === "string"
  && value.length <= 254
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

async function createCreditOrder(request, pathname) {
  if (request.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Phương thức không được hỗ trợ." } }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: { code: "INVALID_JSON", message: "Dữ liệu gửi lên không hợp lệ." } }, 400);
  }

  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  if (!isEmail(email)) {
    return jsonResponse({ error: { code: "INVALID_EMAIL", message: "Vui lòng nhập địa chỉ email hợp lệ." } }, 400);
  }

  const headers = new Headers({ "Accept": "application/json", "Content-Type": "application/json" });
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey.slice(0, 128));

  try {
    const upstream = await fetch(`${PAYMENT_API_ORIGIN}${pathname}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email }),
    });
    const responseHeaders = new Headers({
      "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return jsonResponse({ error: { code: "PAYMENT_SERVICE_UNAVAILABLE", message: "Chưa thể kết nối cổng thanh toán. Vui lòng thử lại sau." } }, 502);
  }
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (ORDER_PATHS.has(pathname)) return createCreditOrder(request, pathname);
    return env.ASSETS.fetch(request);
  },
};
