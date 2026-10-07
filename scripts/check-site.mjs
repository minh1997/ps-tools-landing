import { readFile, access } from "node:fs/promises";

const required = ["public/index.html", "public/styles.css", "public/app.js", "public/assets/ps-studio-hero-ui.webp", "public/downloads/PS_V1.0.1.ccx"];
await Promise.all(required.map((file) => access(file)));

const html = await readFile("public/index.html", "utf8");
const css = await readFile("public/styles.css", "utf8");
const js = await readFile("public/app.js", "utf8");
const checks = [
  [html.includes('lang="vi"'), "HTML language is set to Vietnamese"],
  [html.includes("viewport"), "Responsive viewport is configured"],
  [html.includes("ps-studio-hero-ui.webp"), "Updated UI hero artwork is referenced"],
  [html.includes('id="tinh-nang"'), "Feature grid section exists"],
  [(html.match(/class="tool-card"/g) || []).length === 15, "All 15 feature cards are present"],
  [html.includes('id="huong-dan"') && html.includes("Cài đặt trên Windows") && html.includes("Cài đặt trên macOS"), "Windows and macOS CCX installation guides are present"],
  [html.includes('href="#huong-dan"'), "Guide navigation points to the installation section"],
  [css.includes("@media(max-width:640px)"), "Mobile layout is present"],
  [html.includes('href="/downloads/PS_V1.0.1.ccx"') && html.includes('download="PS_V1.0.1.ccx"'), "Download button links to the CCX installer"],
  [js.includes("download-trigger") && !js.includes("event.preventDefault()"), "Download feedback is wired without blocking the download"],
];
const failed = checks.filter(([pass]) => !pass);
for (const [pass, message] of checks) console.log(`${pass ? "✓" : "✗"} ${message}`);
if (failed.length) process.exit(1);
