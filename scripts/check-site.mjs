import { readFile, access } from "node:fs/promises";

const required = ["astro.config.mjs", "src/pages/index.astro", "src/styles/global.css", "src/scripts/app.js", "src/worker.js", "public/assets/ps-studio-hero-ui.webp", "public/assets/ps-tools-guide.webp", "public/downloads/PS_V1.0.2.ccx", "public/downloads/Cai-dat-PS-Visual-Tool-Windows.cmd", "public/downloads/PS-Visual-Tool-Windows-v1.0.2.zip"];
await Promise.all(required.map((file) => access(file)));

const html = await readFile("src/pages/index.astro", "utf8");
const css = await readFile("src/styles/global.css", "utf8");
const js = await readFile("src/scripts/app.js", "utf8");
const wrangler = await readFile("wrangler.jsonc", "utf8");
const worker = await readFile("src/worker.js", "utf8");
const windowsInstaller = await readFile("public/downloads/Cai-dat-PS-Visual-Tool-Windows.cmd", "utf8");
const checks = [
  [html.includes('import "../styles/global.css"'), "Astro page imports the global stylesheet"],
  [html.includes('src="../scripts/app.js"'), "Astro bundles the landing page interactions"],
  [wrangler.includes('"directory": "./dist"'), "Cloudflare Worker serves the Astro build output"],
  [html.includes('lang="vi"'), "HTML language is set to Vietnamese"],
  [html.includes("viewport"), "Responsive viewport is configured"],
  [html.includes("ps-studio-hero-ui.webp"), "Updated UI hero artwork is referenced"],
  [html.includes('id="tinh-nang"'), "Feature grid section exists"],
  [(html.match(/class="tool-card"/g) || []).length === 15, "All 15 feature cards are present"],
  [html.includes('id="bang-gia"') && html.includes('href="#bang-gia"'), "Pricing section is linked from navigation"],
  [(html.match(/credits:/g) || []).length === 6 && html.includes('popular: true') && html.includes('annual: true'), "All credit plans, including the annual contact plan, are configured"],
  [html.includes("2.800K") && html.includes("Tổng 52.000 credit / năm") && html.includes('class="price-action annual-action"'), "Annual plan has the requested price, benefits, and contact action"],
  [html.includes('id="credit-email"') && html.includes("data-order-endpoint"), "Credit checkout collects an email and maps plan buttons to API routes"],
  [js.includes("Idempotency-Key") && js.includes("findPaymentUrl"), "Checkout interaction prevents duplicate orders and handles payment redirects"],
  [worker.includes("ORDER_PATHS") && worker.includes("visual-tools.webacela.com") && wrangler.includes('"binding": "ASSETS"'), "Cloudflare Worker validates and proxies the credit order API"],
  [html.includes('id="huong-dan"') && html.includes("Cài đặt trên Windows") && html.includes("Cài đặt trên macOS"), "Windows and macOS CCX installation guides are present"],
  [html.includes("Photoshop 27.0 trở lên") && html.includes("PS Tools V1") && html.includes("ps-tools-guide.webp"), "Version requirement and illustrated plugin check are present"],
  [html.includes('href="#huong-dan"'), "Guide navigation points to the installation section"],
  [css.includes("@media(max-width:640px)"), "Mobile layout is present"],
  [html.includes('href="/downloads/PS_V1.0.2.ccx') && html.includes('download="PS_V1.0.2.ccx"'), "Download button links to the current CCX installer"],
  [html.includes("Tải cho Windows") && html.includes("Tải cho macOS") && html.includes('class="download-button download-trigger windows-download"') && html.includes('class="download-button download-trigger mac-download"'), "Hero provides separate Windows and macOS download buttons"],
  [html.includes('href="/downloads/PS-Visual-Tool-Windows-v1.0.2.zip"') && html.includes('href="/downloads/PS_V1.0.2.ccx?v=1.0"'), "Hero download buttons target the Windows ZIP and macOS CCX"],
  [html.includes('href="/downloads/PS-Visual-Tool-Windows-v1.0.2.zip"') && html.includes("Không cần mở CMD"), "Windows guide links to the self-contained ZIP installer"],
  [windowsInstaller.includes('/remove "%PLUGIN_NAME%"') && windowsInstaller.includes('/list all') && windowsInstaller.indexOf('/remove "%PLUGIN_NAME%"') < windowsInstaller.indexOf('/install "%CCX_FILE%"'), "Windows installer removes an existing plugin before installing the new version"],
  [js.includes("download-trigger") && js.includes("dataset.downloadTitle") && js.includes("setTimeout(hideToast, 4500)"), "Platform-specific download feedback is wired without blocking the download"],
];
const failed = checks.filter(([pass]) => !pass);
for (const [pass, message] of checks) console.log(`${pass ? "✓" : "✗"} ${message}`);
if (failed.length) process.exit(1);
