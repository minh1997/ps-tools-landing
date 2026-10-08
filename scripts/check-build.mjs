import { access, readFile, stat } from "node:fs/promises";

const required = [
  "dist/index.html",
  "dist/assets/ps-studio-hero-ui.webp",
  "dist/assets/ps-tools-guide.webp",
  "dist/downloads/PS_V1.0.1.ccx",
];

await Promise.all(required.map((file) => access(file)));

const html = await readFile("dist/index.html", "utf8");
const installer = await stat("dist/downloads/PS_V1.0.1.ccx");
const checks = [
  [html.includes("PS Visual Tool"), "Astro generated the landing page"],
  [html.includes("/downloads/PS_V1.0.1.ccx"), "Built page links to the CCX installer"],
  [html.includes("Photoshop 27.0 trở lên"), "Built guide keeps the Photoshop requirement"],
  [html.includes('id="bang-gia"') && html.includes("1.300K"), "Built page includes the credit pricing section"],
  [html.includes('id="credit-email"') && html.includes("credits-2000/orders"), "Built page includes the email checkout flow for every credit package"],
  [installer.size > 0, "CCX installer is included in the Worker assets"],
];

const failed = checks.filter(([pass]) => !pass);
for (const [pass, message] of checks) console.log(`${pass ? "✓" : "✗"} ${message}`);
if (failed.length) process.exit(1);
